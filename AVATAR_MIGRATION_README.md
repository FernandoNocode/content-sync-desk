# Migração para Adicionar Campo Avatar URL

## Descrição
Este script adiciona o campo `avatar_url` à tabela `profiles` para suportar fotos de perfil dos usuários.

## Como executar a migração

### Opção 1: Via Supabase CLI (Recomendado)
```bash
# Certifique-se de estar na pasta do projeto
cd content-sync-desk-59

# Execute a migração
supabase db push
```

### Opção 2: Via Dashboard do Supabase
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para "SQL Editor"
4. Copie e cole o conteúdo do arquivo `supabase/migrations/add_avatar_url_to_profiles.sql`
5. Execute o script

### Opção 3: Executar SQL diretamente
Copie e execute o seguinte SQL no seu banco de dados:

```sql
-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_url text;

-- Add comment to the column
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil do usuário armazenada no Supabase Storage';

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## O que a migração faz

1. **Adiciona coluna `avatar_url`**: Campo de texto para armazenar a URL da foto de perfil
2. **Cria bucket 'avatars'**: Bucket público no Supabase Storage para armazenar as imagens
3. **Configura políticas de segurança**: 
   - Permite visualização pública das imagens
   - Permite que usuários façam upload apenas de suas próprias fotos
   - Permite que usuários atualizem e deletem apenas suas próprias fotos

## Verificação
Após executar a migração, você pode verificar se funcionou:

1. Acesse a tela de perfil na aplicação
2. Tente fazer upload de uma foto de perfil
3. Verifique se a foto aparece corretamente

## Estrutura de arquivos
- As fotos são salvas no formato: `avatars/{user_id}.{extensão}`
- O campo `avatar_url` na tabela `profiles` armazena a URL pública da imagem

## Troubleshooting

### Erro: "bucket 'avatars' already exists"
Isso é normal se o bucket já foi criado. A migração usa `ON CONFLICT DO NOTHING` para evitar erros.

### Erro de permissão
Certifique-se de que você tem permissões de administrador no projeto Supabase.

### Políticas não funcionam
Verifique se as políticas foram criadas corretamente no painel "Authentication > Policies" do Supabase.