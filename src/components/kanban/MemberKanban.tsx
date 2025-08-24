import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Video, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMemberAuth } from '@/contexts/MemberAuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Video {
  id: string;
  titulo: string;
  status: string;
  data_agendada: string | null;
  hora_agendada: string | null;
  thumbnail_pronta: boolean;
  canal_nome?: string;
  responsavel_nome?: string;
}

interface Column {
  id: string;
  title: string;
  videos: Video[];
}

const statusColumns = [
  { id: 'ideias', title: 'Ideias', status: 'ideias' },
  { id: 'roteiro', title: 'Roteiro', status: 'roteiro' },
  { id: 'gravacao', title: 'Gravação', status: 'gravacao' },
  { id: 'edicao', title: 'Edição', status: 'edicao' },
  { id: 'thumbnail', title: 'Thumbnail', status: 'thumbnail' },
  { id: 'agendado', title: 'Agendado', status: 'agendado' },
  { id: 'publicado', title: 'Publicado', status: 'publicado' }
];

const getStatusColor = (status: string) => {
  const colors = {
    'ideias': 'bg-gray-100 text-gray-800',
    'roteiro': 'bg-blue-100 text-blue-800',
    'gravacao': 'bg-yellow-100 text-yellow-800',
    'edicao': 'bg-orange-100 text-orange-800',
    'thumbnail': 'bg-purple-100 text-purple-800',
    'agendado': 'bg-green-100 text-green-800',
    'publicado': 'bg-emerald-100 text-emerald-800'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const MemberKanban: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const { memberUser, logoutMember } = useMemberAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (memberUser) {
      fetchMemberVideos();
    }
  }, [memberUser]);

  const createSampleVideos = () => {
    const sampleVideos = [
      {
        id: 'video-1',
        titulo: 'Tutorial React Hooks',
        status: 'ideias',
        data_agendada: '2024-01-20',
        hora_agendada: '14:00',
        thumbnail_pronta: false,
        canal_nome: 'Tech Channel',
        responsavel_nome: memberUser?.nome || 'Membro'
      },
      {
        id: 'video-2',
        titulo: 'Como usar TypeScript',
        status: 'roteiro',
        data_agendada: '2024-01-22',
        hora_agendada: '16:00',
        thumbnail_pronta: false,
        canal_nome: 'Dev Channel',
        responsavel_nome: memberUser?.nome || 'Membro'
      },
      {
        id: 'video-3',
        titulo: 'Introdução ao Supabase',
        status: 'gravacao',
        data_agendada: null,
        hora_agendada: null,
        thumbnail_pronta: true,
        canal_nome: 'Backend Channel',
        responsavel_nome: memberUser?.nome || 'Membro'
      }
    ];
    
    localStorage.setItem(`member_videos_${memberUser?.id}`, JSON.stringify(sampleVideos));
    return sampleVideos;
  };

  const fetchMemberVideos = async () => {
    if (!memberUser) return;

    try {
      setLoading(true);
      
      // Try to fetch videos assigned to this member using the RPC function
      const { data: videosData, error } = await supabase.rpc('get_member_videos', {
        p_member_id: memberUser.id
      });

      if (error) {
        console.warn('RPC failed, using localStorage fallback:', error);
        
        // Fallback to localStorage
        let localVideos = localStorage.getItem(`member_videos_${memberUser.id}`);
        let videosArray;
        
        if (!localVideos) {
          // Create sample videos if none exist
          videosArray = createSampleVideos();
          toast({
            title: "Modo de desenvolvimento",
            description: "Usando dados locais para teste.",
          });
        } else {
          videosArray = JSON.parse(localVideos);
        }
        
        // Group videos by status
        const videosByStatus = videosArray.reduce((acc: Record<string, Video[]>, video: any) => {
          const status = video.status || 'ideias';
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(video);
          return acc;
        }, {});

        // Create columns with videos
        const newColumns = statusColumns.map(column => ({
          id: column.id,
          title: column.title,
          videos: videosByStatus[column.status] || []
        }));

        setColumns(newColumns);
        return;
      }

      // Group videos by status (Supabase data)
      const videosByStatus = (videosData || []).reduce((acc: Record<string, Video[]>, video: any) => {
        const status = video.status || 'ideias';
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push({
          id: video.id,
          titulo: video.titulo,
          status: video.status,
          data_agendada: video.data_agendada,
          hora_agendada: video.hora_agendada,
          thumbnail_pronta: video.thumbnail_pronta,
          canal_nome: video.canal_nome,
          responsavel_nome: video.responsavel_nome
        });
        return acc;
      }, {});

      // Create columns with videos
      const newColumns = statusColumns.map(column => ({
        id: column.id,
        title: column.title,
        videos: videosByStatus[column.status] || []
      }));

      setColumns(newColumns);
    } catch (error: any) {
      console.warn('Error fetching videos, using localStorage fallback:', error);
      
      // Fallback to localStorage
      let localVideos = localStorage.getItem(`member_videos_${memberUser.id}`);
      let videosArray;
      
      if (!localVideos) {
        // Create sample videos if none exist
        videosArray = createSampleVideos();
        toast({
          title: "Modo de desenvolvimento",
          description: "Usando dados locais para teste.",
        });
      } else {
        videosArray = JSON.parse(localVideos);
      }
      
      // Group videos by status
      const videosByStatus = videosArray.reduce((acc: Record<string, Video[]>, video: any) => {
        const status = video.status || 'ideias';
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(video);
        return acc;
      }, {});

      // Create columns with videos
      const newColumns = statusColumns.map(column => ({
        id: column.id,
        title: column.title,
        videos: videosByStatus[column.status] || []
      }));

      setColumns(newColumns);
    } finally {
      setLoading(false);
    }
  };

  const updateLocalStorage = (updatedColumns: Column[]) => {
    if (!memberUser) return;
    
    // Flatten all videos from all columns
    const allVideos = updatedColumns.flatMap(column => column.videos);
    localStorage.setItem(`member_videos_${memberUser.id}`, JSON.stringify(allVideos));
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    const draggedVideo = sourceColumn?.videos.find(video => video.id === draggableId);

    if (!sourceColumn || !destColumn || !draggedVideo) return;

    const newStatus = statusColumns.find(col => col.id === destination.droppableId)?.status;
    if (!newStatus) return;

    // Update local state first (optimistic update)
    const newColumns = [...columns];
    const sourceColIndex = newColumns.findIndex(col => col.id === source.droppableId);
    const destColIndex = newColumns.findIndex(col => col.id === destination.droppableId);

    // Remove from source
    const [movedVideo] = newColumns[sourceColIndex].videos.splice(source.index, 1);
    
    // Update video status
    movedVideo.status = newStatus;
    
    // Add to destination
    newColumns[destColIndex].videos.splice(destination.index, 0, movedVideo);

    setColumns(newColumns);

    // Try to update in database, fallback to localStorage
    try {
      // Use the RPC function to update video status
      const { error } = await supabase.rpc('update_member_video_status', {
        p_member_id: memberUser!.id,
        p_video_id: draggableId,
        p_new_status: newStatus
      });

      if (error) {
        console.warn('RPC failed, using localStorage fallback:', error);
        // Update localStorage as fallback
        updateLocalStorage(newColumns);
        
        toast({
          title: "Status atualizado (local)",
          description: `Vídeo "${draggedVideo.titulo}" movido para ${destColumn.title} (salvo localmente).`,
        });
        return;
      }

      toast({
        title: "Status atualizado",
        description: `Vídeo "${draggedVideo.titulo}" movido para ${destColumn.title}.`,
      });
    } catch (error: any) {
      console.warn('Error updating video, using localStorage fallback:', error);
      // Update localStorage as fallback
      updateLocalStorage(newColumns);
      
      toast({
        title: "Status atualizado (local)",
        description: `Vídeo "${draggedVideo.titulo}" movido para ${destColumn.title} (salvo localmente).`,
      });
    }
  };

  const handleLogout = async () => {
    await logoutMember();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando seus vídeos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Área de Produção</h1>
              <p className="text-sm text-gray-600">Bem-vindo, {memberUser?.nome}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-6">
            {columns.map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      {column.title}
                      <Badge variant="secondary" className="ml-2">
                        {column.videos.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={'min-h-48 space-y-3 p-2 rounded-lg transition-colors ' + (snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50')}
                        >
                          {column.videos.map((video, index) => (
                            <Draggable key={video.id} draggableId={video.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={'cursor-move transition-shadow ' + (snapshot.isDragging ? 'shadow-lg' : 'shadow-sm')}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="flex items-start justify-between">
                                        <h3 className="font-medium text-sm leading-tight">
                                          {video.titulo}
                                        </h3>
                                        <Badge 
                                          variant="secondary" 
                                          className={'text-xs ' + getStatusColor(video.status)}
                                        >
                                          {video.status}
                                        </Badge>
                                      </div>
                                      
                                      {video.canal_nome && (
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <Video className="h-3 w-3" />
                                          {video.canal_nome}
                                        </div>
                                      )}
                                      
                                      {video.responsavel_nome && (
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <User className="h-3 w-3" />
                                          {video.responsavel_nome}
                                        </div>
                                      )}
                                      
                                      {video.data_agendada && (
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <Calendar className="h-3 w-3" />
                                          {format(new Date(video.data_agendada), 'dd/MM/yyyy', { locale: ptBR })}
                                          {video.hora_agendada && (
                                            <>
                                              <Clock className="h-3 w-3 ml-1" />
                                              {video.hora_agendada}
                                            </>
                                          )}
                                        </div>
                                      )}
                                      
                                      {video.thumbnail_pronta && (
                                        <Badge variant="outline" className="text-xs">
                                          Thumbnail Pronta
                                        </Badge>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
};