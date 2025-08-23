import { useState } from 'react';
import { MoreHorizontal, User, Trash2, ArrowLeft, Check, FolderOpen } from 'lucide-react';
import { useApp, type Video, type Usuario } from '@/contexts/AppContext';

interface VideoCardActionsProps {
  video: Video;
  onThumbnailToggle: (videoId: string) => void;
}

export const VideoCardActions = ({ video, onThumbnailToggle }: VideoCardActionsProps) => {
  const { usuarios, updateVideo, deleteVideo, moveVideoToIdeas } = useApp();
  const [showActions, setShowActions] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>(video.responsavel_id || '');
  const [driveLink, setDriveLink] = useState<string>(video.google_drive_link || '');

  const handleAssignUser = () => {
    const usuario = usuarios.find(u => u.id === selectedUser);
    updateVideo(video.id, {
      responsavel_id: selectedUser || undefined,
      responsavel_nome: usuario?.nome || undefined,
    });
    setShowAssignModal(false);
    setShowActions(false);
  };

  const handleDeleteVideo = () => {
    if (confirm('Tem certeza que deseja excluir este vídeo?')) {
      deleteVideo(video.id);
      setShowActions(false);
    }
  };

  const handleMoveToIdeas = () => {
    if (confirm('Retornar este vídeo para o banco de ideias?')) {
      moveVideoToIdeas(video.id);
      setShowActions(false);
    }
  };

  const handleUpdateDriveLink = () => {
    updateVideo(video.id, {
      google_drive_link: driveLink || undefined,
    });
    setShowDriveModal(false);
    setShowActions(false);
  };

  return (
    <div className="absolute top-2 right-2 z-30">
      {/* Actions Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowActions(!showActions);
        }}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Actions Menu */}
      {showActions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowActions(false)}
          />
          <div className="absolute top-8 right-0 z-50 bg-card border border-border rounded-md shadow-lg py-1 min-w-[140px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAssignModal(true);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
            >
              <User className="w-3 h-3" />
              Atribuir
            </button>
            {video.status === 'ideias' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDriveModal(true);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <FolderOpen className="w-3 h-3" />
                {video.google_drive_link ? 'Editar Drive' : 'Adicionar Drive'}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMoveToIdeas();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar p/ Ideias
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteVideo();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted text-destructive flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Excluir
            </button>
          </div>
        </>
      )}

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card-primary p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Atribuir Responsável
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {video.titulo}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Responsável
                </label>
                <select 
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="input-primary w-full"
                >
                  <option value="">Nenhum responsável</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome} - {usuario.role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={handleAssignUser} className="btn-primary flex-1">
                Confirmar
              </button>
              <button 
                onClick={() => {
                  setShowAssignModal(false);
                  setShowActions(false);
                }} 
                className="btn-ghost flex-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Link Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg sm:max-w-2xl lg:max-w-4xl mx-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {video.google_drive_link ? 'Editar' : 'Adicionar'} Link do Google Drive
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {video.titulo}
              </p>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Link da Pasta do Google Drive
              </label>
              <input 
                type="url"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              <p className="text-sm text-muted-foreground mt-2">
                Cole aqui o link da pasta do Google Drive com todos os arquivos necessários para este vídeo.
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/20 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button 
                onClick={() => {
                  setShowDriveModal(false);
                  setShowActions(false);
                  setDriveLink(video.google_drive_link || '');
                }} 
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleUpdateDriveLink} 
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!driveLink.trim()}
              >
                {video.google_drive_link ? 'Atualizar Link' : 'Adicionar Link'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};