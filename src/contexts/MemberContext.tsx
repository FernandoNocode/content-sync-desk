import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  username: string;
  nome: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface MemberVideoAssignment {
  id: string;
  member_id: string;
  video_id: string;
  video_title?: string;
  video_status?: string;
  canal_nome?: string;
}

interface MemberContextType {
  members: Member[];
  memberAssignments: MemberVideoAssignment[];
  loading: boolean;
  createMember: (memberData: any) => Promise<void>;
  updateMember: (id: string, memberData: any) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  assignVideosToMember: (memberId: string, videoIds: string[]) => Promise<void>;
  removeVideoFromMember: (memberId: string, videoId: string) => Promise<void>;
  getMemberAssignments: (memberId: string) => MemberVideoAssignment[];
  refreshMembers: () => Promise<void>;
}

const MemberContext = createContext<MemberContextType | undefined>(undefined);

export const MemberProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberAssignments, setMemberAssignments] = useState<MemberVideoAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const refreshMembers = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Try to fetch from Supabase, fallback to localStorage for development
      try {
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('admin_id', user.id)
          .order('created_at', { ascending: false });

        if (membersError) throw membersError;
        setMembers(membersData || []);
      } catch (supabaseError) {
        // Fallback to localStorage for development
        console.log('Using localStorage fallback for members');
        const localMembers = JSON.parse(localStorage.getItem('dev_members') || '[]');
        setMembers(localMembers.filter((m: any) => m.admin_id === user.id));
      }

      // Fetch member video assignments with video details
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('member_video_assignments')
        .select(`
          *,
          videos!inner(
            titulo,
            status,
            canais!inner(
              nome
            )
          )
        `)
        .eq('admin_id', user.id);

      if (assignmentsError) throw assignmentsError;
      
      // Transform the data to include video details
      const transformedAssignments = (assignmentsData || []).map(assignment => ({
        id: assignment.id,
        member_id: assignment.member_id,
        video_id: assignment.video_id,
        video_title: assignment.videos?.titulo,
        video_status: assignment.videos?.status,
        canal_nome: assignment.videos?.canais?.nome
      }));
      
      setMemberAssignments(transformedAssignments);
    } catch (error: any) {
      console.error('Error fetching members:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar membros",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshMembers();
  }, [user]);

  const createMember = async (memberData: any) => {
    if (!user) return;

    try {
      // Try to create in Supabase, fallback to localStorage for development
      try {
        const { data: memberResult, error: memberError } = await supabase
          .from('members')
          .insert({
            admin_id: user.id,
            username: memberData.username,
            password_hash: await hashPassword(memberData.password),
            nome: memberData.nome,
            email: memberData.email,
            is_active: memberData.is_active
          })
          .select()
          .single();

        if (memberError) throw memberError;
      } catch (supabaseError) {
        // Fallback to localStorage for development
        console.log('Using localStorage fallback for member creation');
        const localMembers = JSON.parse(localStorage.getItem('dev_members') || '[]');
        const newMember = {
          id: Date.now().toString(),
          admin_id: user.id,
          username: memberData.username,
          password: memberData.password, // Store plain password for development
          password_hash: await hashPassword(memberData.password),
          nome: memberData.nome,
          email: memberData.email,
          is_active: memberData.is_active,
          created_at: new Date().toISOString()
        };
        localMembers.push(newMember);
        localStorage.setItem('dev_members', JSON.stringify(localMembers));
      }

      await refreshMembers();
      
      toast({
        title: "Sucesso!",
        description: "Membro criado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error creating member:', error);
      toast({
        variant: "destructive",
        title: "Erro ao criar membro",
        description: error.message,
      });
      throw error;
    }
  };

  // Simple password hashing function (in production, use proper bcrypt)
  const hashPassword = async (password: string): Promise<string> => {
    // This is a simple hash - in production, use proper bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt_' + Date.now());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const updateMember = async (id: string, memberData: any) => {
    if (!user) return;

    try {
      const updateData: any = {
        nome: memberData.nome,
        email: memberData.email,
        is_active: memberData.is_active
      };

      const { error } = await supabase
        .from('members')
        .update(updateData)
        .eq('id', id)
        .eq('admin_id', user.id);

      if (error) throw error;



      await refreshMembers();
      
      toast({
        title: "Sucesso!",
        description: "Membro atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar membro",
        description: error.message,
      });
      throw error;
    }
  };

  const deleteMember = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id)
        .eq('admin_id', user.id);

      if (error) throw error;

      await refreshMembers();
      
      toast({
        title: "Sucesso!",
        description: "Membro excluído com sucesso.",
      });
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir membro",
        description: error.message,
      });
      throw error;
    }
  };

  const assignVideosToMember = async (memberId: string, videoIds: string[]) => {
    if (!user || videoIds.length === 0) return;

    try {
      const assignments = videoIds.map(videoId => ({
        member_id: memberId,
        video_id: videoId,
        admin_id: user.id
      }));

      const { error } = await supabase
        .from('member_video_assignments')
        .insert(assignments);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error assigning videos:', error);
      throw error;
    }
  };

  const removeVideoFromMember = async (memberId: string, videoId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('member_video_assignments')
        .delete()
        .eq('member_id', memberId)
        .eq('video_id', videoId)
        .eq('admin_id', user.id);

      if (error) throw error;

      await refreshMembers();
      
      toast({
        title: "Sucesso!",
        description: "Vídeo removido do membro.",
      });
    } catch (error: any) {
      console.error('Error removing video from member:', error);
      toast({
        variant: "destructive",
        title: "Erro ao remover vídeo",
        description: error.message,
      });
    }
  };

  const getMemberAssignments = (memberId: string): MemberVideoAssignment[] => {
    return memberAssignments.filter(assignment => assignment.member_id === memberId);
  };

  const value: MemberContextType = {
    members,
    memberAssignments,
    loading,
    createMember,
    updateMember,
    deleteMember,
    assignVideosToMember,
    removeVideoFromMember,
    getMemberAssignments,
    refreshMembers,
  };

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
};

export const useMember = () => {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
};