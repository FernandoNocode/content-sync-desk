
import { useState } from 'react';
import { Calendar, Clock, Play, CalendarPlus, X, ExternalLink } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { format, addDays, startOfDay, isAfter, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export const ScheduleView = () => {
  const { videos, canais, scheduledVideos, scheduleVideo, unscheduleVideo } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState<string>('09:00');
  const [youtubeLink, setYoutubeLink] = useState<string>('');

  // Videos prontos para agendar (devem estar prontos E ter thumbnail pronta)
  const readyVideos = videos.filter(video => video.status === 'pronto' && video.thumbnail_pronta);

  // Função para calcular próximo slot disponível de um canal
  const getNextAvailableSlot = (canalId: string) => {
    const canal = canais.find(c => c.id === canalId);
    if (!canal) return { data: 'N/A', hora: 'N/A' };

    // Verifica se o canal tem dias e horários configurados
    if (!canal.dias_postagem || canal.dias_postagem.length === 0 || 
        !canal.horarios_postagem || canal.horarios_postagem.length === 0) {
      return { data: 'N/A', hora: 'N/A' };
    }

    const today = startOfDay(new Date());
    let checkDate = addDays(today, 1); // Começa a verificar a partir de amanhã
    
    // Verifica os próximos 30 dias
    for (let i = 0; i < 30; i++) {
      const dayIndex = checkDate.getDay();
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dayName = dayNames[dayIndex];
      
      // Verifica se este canal posta neste dia da semana
      if (canal.dias_postagem.includes(dayName)) {
        // Verifica se já existe algum vídeo agendado neste dia para este canal
        const hasScheduledVideo = scheduledVideos.some(sv => 
          sv.canal_nome === canal.nome && 
          isSameDay(sv.data_agendada, checkDate)
        );
        
        if (!hasScheduledVideo) {
          // Retorna o primeiro horário disponível
          const firstTime = canal.horarios_postagem[0];
          return {
            data: format(checkDate, 'dd/MM/yyyy'),
            hora: firstTime
          };
        }
      }
      
      checkDate = addDays(checkDate, 1);
    }
    
    return { data: 'N/A', hora: 'N/A' };
  };

  // Vídeos agendados para a data selecionada
  const videosForSelectedDate = scheduledVideos.filter(video => {
    if (!selectedDate) return false;
    const isSame = isSameDay(video.data_agendada, selectedDate);
    console.log('🎥 Verificando vídeo:', video.titulo, 'Data do vídeo:', format(video.data_agendada, 'dd/MM/yyyy'), 'Data selecionada:', format(selectedDate, 'dd/MM/yyyy'), 'É mesmo dia?', isSame);
    return isSame;
  }).sort((a, b) => a.hora_agendada.localeCompare(b.hora_agendada));

  const handleScheduleVideo = () => {
    if (!selectedVideo || !scheduleDate || !scheduleTime) return;
    
    const video = readyVideos.find(v => v.id === selectedVideo);
    if (!video) return;

    scheduleVideo(video, scheduleDate, scheduleTime, youtubeLink);
    setShowScheduleModal(false);
    setSelectedVideo('');
    setScheduleDate(new Date());
    setScheduleTime('09:00');
    setYoutubeLink('');
  };

  const openScheduleModal = (videoId: string) => {
    const video = readyVideos.find(v => v.id === videoId);
    if (!video) return;

    const nextSlot = getNextAvailableSlot(video.canal_id);
    setSelectedVideo(videoId);
    
    if (nextSlot.data !== 'N/A') {
      // Convert DD/MM/YYYY to Date object
      const [day, month, year] = nextSlot.data.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      setScheduleDate(date);
      setScheduleTime(nextSlot.hora);
    }
    
    setShowScheduleModal(true);
  };

  const handleUnscheduleVideo = (videoId: string) => {
    if (confirm('Deseja cancelar o agendamento deste vídeo?')) {
      unscheduleVideo(videoId);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    console.log('📅 Data clicada no calendário:', date);
    setSelectedDate(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Agendamento</h1>
        </div>
        
        <button 
          onClick={() => setShowScheduleModal(true)}
          className="btn-primary"
          disabled={readyVideos.length === 0}
        >
          <CalendarPlus className="w-4 h-4 mr-2" />
          Agendar Vídeo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="card-primary p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Calendário</h2>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className={cn("rounded-md border-0 pointer-events-auto")}
              modifiers={{
                hasVideos: scheduledVideos.map(v => v.data_agendada)
              }}
              modifiersStyles={{
                hasVideos: { 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
              components={{
                Day: ({ date, ...props }) => {
                  const videosForDay = scheduledVideos.filter(v => 
                    isSameDay(v.data_agendada, date)
                  );
                  
                  if (videosForDay.length === 0) {
                    return <button {...props} onClick={() => handleDateSelect(date)}>{date.getDate()}</button>;
                  }

                  // Get unique colors for the day
                  const uniqueColors = [...new Set(videosForDay.map(v => v.canal_cor))];
                  
                  return (
                    <div className="relative">
                      <button {...props} onClick={() => handleDateSelect(date)}>{date.getDate()}</button>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {uniqueColors.slice(0, 3).map((cor, index) => (
                          <div
                            key={index}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                        {uniqueColors.length > 3 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                    </div>
                  );
                }
              }}
            />
          </div>
        </div>

        {/* Videos for Selected Date */}
        <div className="lg:col-span-2">
          <div className="card-primary p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Agendamentos para {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Selecione uma data'}
              {selectedDate && videosForSelectedDate.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({videosForSelectedDate.length} vídeo{videosForSelectedDate.length > 1 ? 's' : ''})
                </span>
              )}
            </h2>
            
            {videosForSelectedDate.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhum vídeo agendado para esta data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {videosForSelectedDate.map(video => (
                  <div key={video.id} className="card-secondary p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: video.canal_cor }}
                      ></div>
                      <div>
                        <h3 className="font-medium text-foreground">{video.titulo}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{video.canal_nome}</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{video.hora_agendada}</span>
                          </div>
                        </div>
                        {video.link_youtube && (
                          <a 
                            href={video.link_youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1 mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver no YouTube
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        video.status === 'agendado' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                      }`}>
                        {video.status === 'agendado' ? 'Agendado' : 'Publicado'}
                      </div>
                      
                      {video.status === 'agendado' && (
                        <button
                          onClick={() => handleUnscheduleVideo(video.id)}
                          className="btn-ghost text-xs px-2 py-1"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ready Videos Section */}
      <div className="card-primary p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Vídeos Prontos para Agendar</h2>
        
        {readyVideos.length === 0 ? (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Nenhum vídeo pronto para agendamento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {readyVideos.map(video => {
              const nextSlot = getNextAvailableSlot(video.canal_id);
              return (
                <div key={video.id} className="card-secondary p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-foreground line-clamp-2">{video.titulo}</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: canais.find(c => c.id === video.canal_id)?.cor || 'hsl(var(--primary))' }}
                    ></div>
                    <span className="text-sm text-foreground">{video.canal_nome}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-3">
                    Próximo slot: {nextSlot.data} às {nextSlot.hora}
                  </div>
                  
                  <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mb-3 ${
                    video.thumbnail_pronta ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    Thumbnail: {video.thumbnail_pronta ? 'Pronta' : 'Pendente'}
                  </div>
                  
                  <button
                    onClick={() => openScheduleModal(video.id)}
                    className="btn-primary w-full text-xs"
                  >
                    Agendar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="card-primary p-6 max-w-md w-full cursor-move" 
            draggable 
            onDragStart={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.dataTransfer.setData('text/plain', JSON.stringify({
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top
              }));
            }}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">Agendar Vídeo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Vídeo
                </label>
                <select 
                  value={selectedVideo}
                  onChange={(e) => setSelectedVideo(e.target.value)}
                  className="input-primary w-full"
                >
                  <option value="">Selecione um vídeo</option>
                  {readyVideos.map(video => (
                    <option key={video.id} value={video.id}>
                      {video.titulo} - {video.canal_nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduleDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {scheduleDate ? format(scheduleDate, 'dd/MM/yyyy') : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border border-border shadow-lg z-[60]" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={scheduleDate}
                      onSelect={setScheduleDate}
                      disabled={(date) => date < startOfDay(new Date())}
                      initialFocus
                      className={cn("p-3 pointer-events-auto bg-card")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Horário
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="input-primary w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Link do YouTube (opcional)
                </label>
                <input
                  type="url"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  className="input-primary w-full"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleScheduleVideo} 
                className="btn-primary flex-1"
                disabled={!selectedVideo || !scheduleDate || !scheduleTime}
              >
                Confirmar Agendamento
              </button>
              <button 
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedVideo('');
                  setYoutubeLink('');
                }} 
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
