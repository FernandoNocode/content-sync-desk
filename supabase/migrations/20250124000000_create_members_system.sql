-- Create members table for restricted access users
create table public.members (
  id uuid not null default gen_random_uuid() primary key,
  admin_id uuid not null references auth.users(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  nome text not null,
  email text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS for members
alter table public.members enable row level security;

-- Members policies - only admin can manage members
create policy "Admins can view their members"
on public.members for select 
using (auth.uid() = admin_id);

create policy "Admins can insert their members"
on public.members for insert 
with check (auth.uid() = admin_id);

create policy "Admins can update their members"
on public.members for update 
using (auth.uid() = admin_id);

create policy "Admins can delete their members"
on public.members for delete 
using (auth.uid() = admin_id);

-- Create member_video_assignments table to control which videos members can access
create table public.member_video_assignments (
  id uuid not null default gen_random_uuid() primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  admin_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  unique(member_id, video_id)
);

-- Enable RLS for member_video_assignments
alter table public.member_video_assignments enable row level security;

-- Member video assignments policies
create policy "Admins can view their member assignments"
on public.member_video_assignments for select 
using (auth.uid() = admin_id);

create policy "Admins can insert their member assignments"
on public.member_video_assignments for insert 
with check (auth.uid() = admin_id);

create policy "Admins can update their member assignments"
on public.member_video_assignments for update 
using (auth.uid() = admin_id);

create policy "Admins can delete their member assignments"
on public.member_video_assignments for delete 
using (auth.uid() = admin_id);

-- Create member_sessions table to track member logins
create table public.member_sessions (
  id uuid not null default gen_random_uuid() primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  session_token text not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now()
);

-- Enable RLS for member_sessions
alter table public.member_sessions enable row level security;

-- Member sessions policies - no direct access needed, handled by functions
create policy "No direct access to member sessions"
on public.member_sessions for all 
using (false);

-- Add updated_at trigger for members
create trigger update_members_updated_at
  before update on public.members
  for each row execute function public.update_updated_at_column();

-- Function to authenticate members
create or replace function public.authenticate_member(
  p_username text,
  p_password text
)
returns table(
  member_id uuid,
  member_name text,
  session_token text
)
language plpgsql
security definer
as $$
declare
  v_member_id uuid;
  v_member_name text;
  v_password_hash text;
  v_session_token text;
  v_expires_at timestamp with time zone;
begin
  -- Get member info
  select id, nome, password_hash
  into v_member_id, v_member_name, v_password_hash
  from public.members
  where username = p_username and is_active = true;
  
  -- Check if member exists and password is correct
  if v_member_id is null or not crypt(p_password, v_password_hash) = v_password_hash then
    return;
  end if;
  
  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := now() + interval '24 hours';
  
  -- Clean old sessions for this member
  delete from public.member_sessions 
  where member_id = v_member_id or expires_at < now();
  
  -- Create new session
  insert into public.member_sessions (member_id, session_token, expires_at)
  values (v_member_id, v_session_token, v_expires_at);
  
  -- Return member info and session token
  return query select v_member_id, v_member_name, v_session_token;
end;
$$;

-- Function to validate member session
create or replace function public.validate_member_session(
  p_session_token text
)
returns table(
  member_id uuid,
  member_name text,
  admin_id uuid
)
language plpgsql
security definer
as $$
begin
  return query
  select m.id, m.nome, m.admin_id
  from public.member_sessions ms
  join public.members m on m.id = ms.member_id
  where ms.session_token = p_session_token 
    and ms.expires_at > now()
    and m.is_active = true;
end;
$$;

-- Function to get member assigned videos
create or replace function public.get_member_videos(
  p_session_token text
)
returns table(
  video_id uuid,
  titulo text,
  status text,
  canal_nome text,
  data_criacao timestamp with time zone,
  data_agendada timestamp with time zone,
  hora_agendada text,
  thumbnail_pronta boolean
)
language plpgsql
security definer
as $$
declare
  v_member_id uuid;
begin
  -- Validate session and get member_id
  select member_id into v_member_id
  from public.validate_member_session(p_session_token);
  
  if v_member_id is null then
    return;
  end if;
  
  -- Return assigned videos in production status only
  return query
  select v.id, v.titulo, v.status, c.nome as canal_nome,
         v.data_criacao, v.data_agendada, v.hora_agendada, v.thumbnail_pronta
  from public.videos v
  join public.canais c on c.id = v.canal_id
  join public.member_video_assignments mva on mva.video_id = v.id
  where mva.member_id = v_member_id
    and v.status in ('edicao', 'pronto'); -- Only production stages
end;
$$;

-- Function to update video status (only for assigned videos)
create or replace function public.update_member_video_status(
  p_session_token text,
  p_video_id uuid,
  p_new_status text
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_member_id uuid;
  v_admin_id uuid;
  v_is_assigned boolean := false;
begin
  -- Validate session and get member info
  select member_id, admin_id into v_member_id, v_admin_id
  from public.validate_member_session(p_session_token);
  
  if v_member_id is null then
    return false;
  end if;
  
  -- Check if video is assigned to this member
  select exists(
    select 1 from public.member_video_assignments
    where member_id = v_member_id and video_id = p_video_id
  ) into v_is_assigned;
  
  if not v_is_assigned then
    return false;
  end if;
  
  -- Only allow status changes within production stages
  if p_new_status not in ('edicao', 'pronto') then
    return false;
  end if;
  
  -- Update video status
  update public.videos
  set status = p_new_status, updated_at = now()
  where id = p_video_id and user_id = v_admin_id;
  
  return found;
end;
$$;

-- Function to logout member
create or replace function public.logout_member(
  p_session_token text
)
returns boolean
language plpgsql
security definer
as $$
begin
  delete from public.member_sessions
  where session_token = p_session_token;
  
  return found;
end;
$$;

-- Function to create member with password hashing
create or replace function public.create_member_with_password(
  p_admin_id uuid,
  p_username text,
  p_password text,
  p_nome text,
  p_email text,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_member_id uuid;
begin
  -- Check if admin exists
  if not exists(select 1 from auth.users where id = p_admin_id) then
    raise exception 'Admin not found';
  end if;
  
  -- Insert member with hashed password
  insert into public.members (
    admin_id,
    username,
    password_hash,
    nome,
    email,
    is_active
  ) values (
    p_admin_id,
    p_username,
    crypt(p_password, gen_salt('bf')),
    p_nome,
    p_email,
    p_is_active
  )
  returning id into v_member_id;
  
  return v_member_id;
end;
$$;

-- Grant necessary permissions
grant execute on function public.authenticate_member(text, text) to anon, authenticated;
grant execute on function public.validate_member_session(text) to anon, authenticated;
grant execute on function public.get_member_videos(text) to anon, authenticated;
grant execute on function public.update_member_video_status(text, uuid, text) to anon, authenticated;
grant execute on function public.logout_member(text) to anon, authenticated;
grant execute on function public.create_member_with_password(uuid, text, text, text, text, boolean) to authenticated;