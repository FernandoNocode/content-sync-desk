import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types
export interface Canal {
  id: string;
  nome: string;
  link: string;
  lingua: string;
  nicho: string;
  sub_nicho: string;
  micro_nicho: string;
  freq_postagem: string;
  cor: string;
  logo_url?: string;
  dias_postagem: string[];
  horarios_postagem: string[];
  user_id?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: string;
}

export interface Video {
  id: string;
  titulo: string;
  status: 'ideias' | 'roteiro' | 'audio' | 'edicao' | 'pronto';
  canal_id: string;
  canal_nome: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  data_criacao: Date;
  data_agendada?: Date;
  hora_agendada?: string;
  thumbnail_pronta: boolean;
  google_drive_link?: string;
  user_id?: string;
}

export interface Idea {
  id: string;
  titulo: string;
  descricao: string;
  canal_id: string;
  canal_nome: string;
  canal_cor: string;
  data_criacao: Date;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  user_id?: string;
}

export interface ScheduledVideo {
  id: string;
  titulo: string;
  canal_nome: string;
  canal_cor: string;
  data_agendada: Date;
  hora_agendada: string;
  link_youtube?: string;
  status: 'agendado' | 'publicado';
  user_id?: string;
}

// Context
interface AppContextType {
  // Data
  canais: Canal[];
  usuarios: Usuario[];
  videos: Video[];
  ideias: Idea[];
  scheduledVideos: ScheduledVideo[];
  loading: boolean;
  
  // Canal Actions
  addCanal: (canal: Omit<Canal, 'id'>) => Promise<void>;
  updateCanal: (id: string, canal: Partial<Canal>) => Promise<void>;
  deleteCanal: (id: string) => Promise<void>;
  
  // Usuario Actions
  addUsuario: (usuario: Omit<Usuario, 'id'>) => Promise<void>;
  updateUsuario: (id: string, usuario: Partial<Usuario>) => Promise<void>;
  deleteUsuario: (id: string) => Promise<void>;
  
  // Video Actions
  updateVideo: (id: string, video: Partial<Video>) => Promise<void>;
  addVideo: (video: Omit<Video, 'id'>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  moveVideoToIdeas: (videoId: string) => Promise<void>;
  scheduleVideo: (video: Video, data_agendada: Date, hora_agendada: string, link_youtube?: string) => Promise<void>;
  unscheduleVideo: (id: string) => Promise<void>;
  
  // Idea Actions
  addIdeia: (idea: Omit<Idea, 'id'>) => Promise<void>;
  updateIdeia: (id: string, idea: Partial<Idea>) => Promise<void>;
  deleteIdeia: (id: string) => Promise<void>;
  approveIdeaToProduction: (ideaId: string) => Promise<void>;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [canais, setCanais] = useState<Canal[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [ideias, setIdeias] = useState<Idea[]>([]);
  const [scheduledVideos, setScheduledVideos] = useState<ScheduledVideo[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all data
  const refreshData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadCanais(),
        loadUsuarios(),
        loadVideos(),
        loadIdeias(),
        loadScheduledVideos()
      ]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load functions
  const loadCanais = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('canais')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    const canaisFormatted = data.map(canal => ({
      ...canal,
      dias_postagem: canal.dias_postagem || [],
      horarios_postagem: canal.horarios_postagem || []
    }));
    
    setCanais(canaisFormatted);
  };

  const loadUsuarios = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    setUsuarios(data || []);
  };

  const loadVideos = async () => {
    if (!user) return;
    
    const { data: videosData, error } = await supabase
      .from('videos')
      .select(`
        *,
        canais!inner(nome)
      `)
      .eq('user_id', user.id);
    
    if (error) throw error;

    // Get responsavel names separately
    const userIds = videosData?.map(v => v.responsavel_id).filter(Boolean) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome')
      .in('id', userIds);
    
    const videosFormatted: Video[] = (videosData || []).map(video => ({
      id: video.id,
      titulo: video.titulo,
      status: video.status as 'ideias' | 'roteiro' | 'audio' | 'edicao' | 'pronto',
      canal_id: video.canal_id,
      canal_nome: (video.canais as any)?.nome || '',
      responsavel_id: video.responsavel_id,
      responsavel_nome: profiles?.find(p => p.id === video.responsavel_id)?.nome,
      data_criacao: new Date(video.data_criacao),
      data_agendada: video.data_agendada ? new Date(video.data_agendada) : undefined,
      hora_agendada: video.hora_agendada,
      thumbnail_pronta: video.thumbnail_pronta,
      google_drive_link: video.google_drive_link,
      user_id: video.user_id
    }));
    
    setVideos(videosFormatted);
  };

  const loadIdeias = async () => {
    if (!user) return;
    
    const { data: ideiasData, error } = await supabase
      .from('ideias')
      .select(`
        *,
        canais!inner(nome, cor)
      `)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    const ideiasFormatted: Idea[] = (ideiasData || []).map(ideia => ({
      id: ideia.id,
      titulo: ideia.titulo,
      descricao: ideia.descricao || '',
      canal_id: ideia.canal_id,
      canal_nome: (ideia.canais as any)?.nome || '',
      canal_cor: (ideia.canais as any)?.cor || '#000',
      data_criacao: new Date(ideia.data_criacao),
      status: ideia.status as 'pendente' | 'aprovada' | 'rejeitada',
      user_id: ideia.user_id
    }));
    
    setIdeias(ideiasFormatted);
  };

  const loadScheduledVideos = async () => {
    if (!user) return;
    
    const { data: scheduledData, error } = await supabase
      .from('scheduled_videos')
      .select(`
        *,
        canais!inner(nome, cor)
      `)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    const scheduledFormatted: ScheduledVideo[] = (scheduledData || []).map(video => ({
      id: video.id,
      titulo: video.titulo,
      canal_nome: (video.canais as any)?.nome || '',
      canal_cor: (video.canais as any)?.cor || '#000',
      data_agendada: new Date(video.data_agendada),
      hora_agendada: video.hora_agendada,
      link_youtube: video.link_youtube,
      status: video.status as 'agendado' | 'publicado',
      user_id: video.user_id
    }));
    
    setScheduledVideos(scheduledFormatted);
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      // Clear data when user logs out
      setCanais([]);
      setUsuarios([]);
      setVideos([]);
      setIdeias([]);
      setScheduledVideos([]);
    }
  }, [user]);

  // Canal Actions
  const addCanal = async (canal: Omit<Canal, 'id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('canais')
        .insert({
          ...canal,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const newCanal = {
        ...data,
        dias_postagem: data.dias_postagem || [],
        horarios_postagem: data.horarios_postagem || []
      };
      
      setCanais(prev => [...prev, newCanal]);
      
      toast({
        title: "Sucesso!",
        description: "Canal criado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar canal",
        description: error.message,
      });
    }
  };

  const updateCanal = async (id: string, canalUpdate: Partial<Canal>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('canais')
        .update(canalUpdate)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCanais(prev => prev.map(canal => 
        canal.id === id ? { ...canal, ...canalUpdate } : canal
      ));
      
      toast({
        title: "Sucesso!",
        description: "Canal atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar canal",
        description: error.message,
      });
    }
  };

  const deleteCanal = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('canais')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCanais(prev => prev.filter(canal => canal.id !== id));
      setVideos(prev => prev.filter(video => video.canal_id !== id));
      setIdeias(prev => prev.filter(idea => idea.canal_id !== id));
      
      toast({
        title: "Sucesso!",
        description: "Canal excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir canal",
        description: error.message,
      });
    }
  };

  // Usuario Actions
  const addUsuario = async (usuario: Omit<Usuario, 'id'>) => {
    // Note: This function creates a profile, but requires auth.users to exist first
    // In a real app, this would be handled by the signup process
    console.warn('addUsuario: This function should only be used with existing auth users');
    return;
  };

  const updateUsuario = async (id: string, usuarioUpdate: Partial<Usuario>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(usuarioUpdate)
        .eq('id', id);

      if (error) throw error;
      
      setUsuarios(prev => prev.map(usuario => 
        usuario.id === id ? { ...usuario, ...usuarioUpdate } : usuario
      ));
      
      toast({
        title: "Sucesso!",
        description: "Usuário atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar usuário",
        description: error.message,
      });
    }
  };

  const deleteUsuario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsuarios(prev => prev.filter(usuario => usuario.id !== id));
      setVideos(prev => prev.map(video => 
        video.responsavel_id === id 
          ? { ...video, responsavel_id: undefined, responsavel_nome: undefined }
          : video
      ));
      
      toast({
        title: "Sucesso!",
        description: "Usuário excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message,
      });
    }
  };

  // Video Actions
  const updateVideo = async (id: string, videoUpdate: Partial<Video>) => {
    if (!user) return;
    
    try {
      // Convert dates to ISO strings for Supabase
      const updateData: any = { ...videoUpdate };
      delete updateData.user_id;
      delete updateData.canal_nome;
      delete updateData.responsavel_nome;
      
      if (updateData.data_criacao) {
        updateData.data_criacao = updateData.data_criacao.toISOString();
      }
      if (updateData.data_agendada) {
        updateData.data_agendada = updateData.data_agendada.toISOString();
      }
      
      const { error } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setVideos(prev => prev.map(video => 
        video.id === id ? { ...video, ...videoUpdate } : video
      ));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar vídeo",
        description: error.message,
      });
    }
  };

  const addVideo = async (video: Omit<Video, 'id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .insert({
          titulo: video.titulo,
          status: video.status,
          canal_id: video.canal_id,
          responsavel_id: video.responsavel_id,
          data_criacao: video.data_criacao.toISOString(),
          data_agendada: video.data_agendada?.toISOString(),
          hora_agendada: video.hora_agendada,
          thumbnail_pronta: video.thumbnail_pronta,
          google_drive_link: video.google_drive_link,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const newVideo: Video = {
        id: data.id,
        titulo: data.titulo,
        status: data.status as 'ideias' | 'roteiro' | 'audio' | 'edicao' | 'pronto',
        canal_id: data.canal_id,
        canal_nome: video.canal_nome,
        responsavel_id: data.responsavel_id,
        responsavel_nome: video.responsavel_nome,
        data_criacao: new Date(data.data_criacao),
        data_agendada: data.data_agendada ? new Date(data.data_agendada) : undefined,
        hora_agendada: data.hora_agendada,
        thumbnail_pronta: data.thumbnail_pronta,
        google_drive_link: data.google_drive_link,
        user_id: data.user_id
      };
      
      setVideos(prev => [...prev, newVideo]);
      
      toast({
        title: "Sucesso!",
        description: "Vídeo criado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar vídeo",
        description: error.message,
      });
    }
  };

  const deleteVideo = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setVideos(prev => prev.filter(video => video.id !== id));
      
      toast({
        title: "Sucesso!",
        description: "Vídeo excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir vídeo",
        description: error.message,
      });
    }
  };

  const moveVideoToIdeas = async (videoId: string) => {
    if (!user) return;
    
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    
    const canal = canais.find(c => c.id === video.canal_id);
    if (!canal) return;

    try {
      // Create idea from video with complete data
      const newIdeia = {
        titulo: video.titulo,
        descricao: 'Retornado da produção',
        canal_id: video.canal_id,
        canal_nome: video.canal_nome,
        canal_cor: canal.cor,
        data_criacao: new Date(),
        status: 'pendente' as const,
      };

      await addIdeia(newIdeia);
      await deleteVideo(videoId);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao mover vídeo",
        description: error.message,
      });
    }
  };

  const scheduleVideo = async (video: Video, data_agendada: Date, hora_agendada: string, link_youtube?: string) => {
    if (!user) return;
    
    try {
      // Create scheduled video
      const { error } = await supabase
        .from('scheduled_videos')
        .insert({
          titulo: video.titulo,
          canal_id: video.canal_id,
          data_agendada: data_agendada.toISOString(),
          hora_agendada,
          link_youtube,
          status: 'agendado',
          user_id: user.id
        });

      if (error) throw error;
      
      // Remove from videos
      await deleteVideo(video.id);
      
      // Refresh scheduled videos
      await loadScheduledVideos();
      
      toast({
        title: "Sucesso!",
        description: "Vídeo agendado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao agendar vídeo",
        description: error.message,
      });
    }
  };

  const unscheduleVideo = async (id: string) => {
    if (!user) return;
    
    const scheduled = scheduledVideos.find(v => v.id === id);
    if (!scheduled) return;

    try {
      // Delete from scheduled videos
      const { error: deleteError } = await supabase
        .from('scheduled_videos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      
      // Add back to videos
      const backToVideo = {
        titulo: scheduled.titulo,
        status: 'pronto' as const,
        canal_id: canais.find(c => c.nome === scheduled.canal_nome)?.id || '',
        canal_nome: scheduled.canal_nome,
        responsavel_id: undefined,
        responsavel_nome: undefined,
        data_criacao: new Date(),
        data_agendada: undefined,
        hora_agendada: undefined,
        thumbnail_pronta: true,
        google_drive_link: undefined,
      };
      
      await addVideo(backToVideo);
      
      setScheduledVideos(prev => prev.filter(v => v.id !== id));
      
      toast({
        title: "Sucesso!",
        description: "Agendamento cancelado com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar agendamento",
        description: error.message,
      });
    }
  };

  // Idea Actions
  const addIdeia = async (idea: Omit<Idea, 'id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ideias')
        .insert({
          titulo: idea.titulo,
          descricao: idea.descricao,
          canal_id: idea.canal_id,
          status: idea.status,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const newIdeia: Idea = {
        id: data.id,
        titulo: data.titulo,
        descricao: data.descricao || '',
        canal_id: data.canal_id,
        canal_nome: idea.canal_nome,
        canal_cor: idea.canal_cor,
        data_criacao: new Date(data.data_criacao),
        status: data.status as 'pendente' | 'aprovada' | 'rejeitada',
        user_id: data.user_id
      };
      
      setIdeias(prev => [newIdeia, ...prev]);
      
      toast({
        title: "Sucesso!",
        description: "Ideia criada com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar ideia",
        description: error.message,
      });
    }
  };

  const approveIdeaToProduction = async (ideaId: string) => {
    if (!user) return;
    
    const idea = ideias.find(i => i.id === ideaId);
    if (!idea) return;

    try {
      // Create video from idea
      const newVideo = {
        titulo: idea.titulo,
        status: 'ideias' as const,
        canal_id: idea.canal_id,
        canal_nome: idea.canal_nome,
        responsavel_id: undefined,
        responsavel_nome: undefined,
        data_criacao: new Date(),
        data_agendada: undefined,
        hora_agendada: undefined,
        thumbnail_pronta: false,
        google_drive_link: undefined,
      };

      await addVideo(newVideo);
      await deleteIdeia(ideaId);
      
      toast({
        title: "Sucesso!",
        description: "Ideia aprovada para produção.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar ideia",
        description: error.message,
      });
    }
  };

  const updateIdeia = async (id: string, ideiaUpdate: Partial<Idea>) => {
    if (!user) return;
    
    try {
      // Convert dates and clean data for Supabase
      const updateData: any = { ...ideiaUpdate };
      delete updateData.user_id;
      delete updateData.canal_nome;
      delete updateData.canal_cor;
      
      if (updateData.data_criacao) {
        updateData.data_criacao = updateData.data_criacao.toISOString();
      }
      
      const { error } = await supabase
        .from('ideias')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setIdeias(prev => prev.map(idea => 
        idea.id === id ? { ...idea, ...ideiaUpdate } : idea
      ));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar ideia",
        description: error.message,
      });
    }
  };

  const deleteIdeia = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('ideias')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setIdeias(prev => prev.filter(idea => idea.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir ideia",
        description: error.message,
      });
    }
  };

  const value: AppContextType = {
    canais,
    usuarios,
    videos,
    ideias,
    scheduledVideos,
    loading,
    addCanal,
    updateCanal,
    deleteCanal,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    updateVideo,
    addVideo,
    deleteVideo,
    moveVideoToIdeas,
    scheduleVideo,
    unscheduleVideo,
    addIdeia,
    updateIdeia,
    deleteIdeia,
    approveIdeaToProduction,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
