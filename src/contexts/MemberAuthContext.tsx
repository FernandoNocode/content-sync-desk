import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MemberUser {
  id: string;
  username: string;
  nome: string;
  email: string;
  is_active: boolean;
  admin_id: string;
}

interface MemberSession {
  id: string;
  member_id: string;
  session_token: string;
  expires_at: string;
}

interface MemberAuthContextType {
  memberUser: MemberUser | null;
  memberSession: MemberSession | null;
  loading: boolean;
  loginMember: (username: string, password: string) => Promise<boolean>;
  logoutMember: () => Promise<void>;
  isMemberAuthenticated: boolean;
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined);

export const MemberAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [memberUser, setMemberUser] = useState<MemberUser | null>(null);
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const sessionToken = localStorage.getItem('member_session_token');
      if (!sessionToken) {
        setLoading(false);
        return;
      }

      try {
        // Try to validate session with Supabase
        const { data, error } = await supabase.rpc('validate_member_session', {
          p_session_token: sessionToken
        });

        if (error || !data) {
          // Session invalid, clear local storage
          localStorage.removeItem('member_session_token');
          setLoading(false);
          return;
        }

        // Session valid, fetch member data
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('id', data.member_id)
          .eq('is_active', true)
          .single();

        if (memberError || !memberData) {
          localStorage.removeItem('member_session_token');
          setLoading(false);
          return;
        }

        setMemberUser(memberData);
        setMemberSession(data);
      } catch (supabaseError) {
        console.log('Supabase RPC not available, checking local session...');
        
        // Fallback: Check local session
        const localSession = localStorage.getItem('member_local_session');
        if (localSession) {
          try {
            const sessionData = JSON.parse(localSession);
            const expiresAt = new Date(sessionData.expires_at);
            
            if (expiresAt > new Date()) {
              // Session still valid
              setMemberUser(sessionData.member);
              setMemberSession({
                id: sessionData.id,
                member_id: sessionData.member_id,
                session_token: sessionData.session_token,
                expires_at: sessionData.expires_at
              });
            } else {
              // Session expired
              localStorage.removeItem('member_session_token');
              localStorage.removeItem('member_local_session');
            }
          } catch (parseError) {
            console.error('Error parsing local session:', parseError);
            localStorage.removeItem('member_session_token');
            localStorage.removeItem('member_local_session');
          }
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem('member_session_token');
      localStorage.removeItem('member_local_session');
    } finally {
      setLoading(false);
    }
  };

  const loginMember = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      try {
        // Try to authenticate member using Supabase RPC
        const { data, error } = await supabase.rpc('authenticate_member', {
          p_username: username,
          p_password: password
        });

        if (error) {
          throw new Error('Supabase RPC error');
        }

        // The RPC returns an array, check if we have results
        if (!data || data.length === 0) {
          toast({
            variant: "destructive",
            title: "Erro de autenticação",
            description: "Usuário ou senha inválidos.",
          });
          return false;
        }

        const authResult = data[0]; // Get first result from array

        // Fetch member data
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('id', authResult.member_id)
          .single();

        if (memberError || !memberData) {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Erro ao carregar dados do usuário.",
          });
          return false;
        }

        // Check if member is active
        if (!memberData.is_active) {
          toast({
            variant: "destructive",
            title: "Acesso negado",
            description: "Sua conta está inativa. Entre em contato com o administrador.",
          });
          return false;
        }

        // Store session token
        localStorage.setItem('member_session_token', authResult.session_token);
        
        setMemberUser(memberData);
        setMemberSession({
          id: `session_${Date.now()}`,
          member_id: authResult.member_id,
          session_token: authResult.session_token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

        toast({
          title: "Sucesso!",
          description: `Bem-vindo, ${memberData.nome}!`,
        });

        return true;
      } catch (supabaseError) {
        console.log('Supabase RPC not available, trying local authentication...');
        
        // Fallback: Local authentication using localStorage
        const devMembers = localStorage.getItem('dev_members');
        if (!devMembers) {
          toast({
            variant: "destructive",
            title: "Erro de autenticação",
            description: "Nenhum membro encontrado no sistema local.",
          });
          return false;
        }

        try {
          const members = JSON.parse(devMembers);
          
          // Find member by username or email
          const member = members.find((m: any) => 
            m.username === username || m.email === username
          );

          if (!member) {
            toast({
              variant: "destructive",
              title: "Erro de autenticação",
              description: "Usuário não encontrado.",
            });
            return false;
          }

          // Check password (simple comparison for development)
          if (member.password !== password) {
            toast({
              variant: "destructive",
              title: "Erro de autenticação",
              description: "Senha incorreta.",
            });
            return false;
          }

          // Check if member is active
          if (!member.is_active) {
            toast({
              variant: "destructive",
              title: "Acesso negado",
              description: "Sua conta está inativa. Entre em contato com o administrador.",
            });
            return false;
          }

          // Create local session
          const sessionToken = `local_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
          
          const localSession = {
            id: `session_${Date.now()}`,
            member_id: member.id,
            session_token: sessionToken,
            expires_at: expiresAt,
            member: member
          };

          // Store session
          localStorage.setItem('member_session_token', sessionToken);
          localStorage.setItem('member_local_session', JSON.stringify(localSession));
          
          setMemberUser(member);
          setMemberSession({
            id: localSession.id,
            member_id: member.id,
            session_token: sessionToken,
            expires_at: expiresAt
          });

          toast({
            title: "Sucesso!",
            description: `Bem-vindo, ${member.nome}! (Modo local)`,
          });

          return true;
        } catch (parseError) {
          console.error('Error parsing dev members:', parseError);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Erro ao processar dados locais.",
          });
          return false;
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Erro ao conectar com o servidor.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logoutMember = async () => {
    try {
      if (memberSession) {
        try {
          // Try to call logout RPC to invalidate session
          await supabase.rpc('logout_member', {
            p_session_token: memberSession.session_token
          });
        } catch (error) {
          console.log('Supabase RPC not available for logout, clearing local session...');
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      localStorage.removeItem('member_session_token');
      localStorage.removeItem('member_local_session');
      setMemberUser(null);
      setMemberSession(null);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    }
  };

  const isMemberAuthenticated = !!memberUser && !!memberSession;

  const value: MemberAuthContextType = {
    memberUser,
    memberSession,
    loading,
    loginMember,
    logoutMember,
    isMemberAuthenticated,
  };

  return <MemberAuthContext.Provider value={value}>{children}</MemberAuthContext.Provider>;
};

export const useMemberAuth = () => {
  const context = useContext(MemberAuthContext);
  if (context === undefined) {
    throw new Error('useMemberAuth must be used within a MemberAuthProvider');
  }
  return context;
};