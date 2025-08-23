import { LayoutGrid, Calendar, Settings, PlusCircle, Lightbulb, User } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

interface SidebarProps {
  currentView: 'kanban' | 'schedule' | 'management' | 'ideas' | 'profile';
  onViewChange: (view: 'kanban' | 'schedule' | 'management' | 'ideas' | 'profile') => void;
}

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const { videos, canais, usuarios, ideias } = useApp();
  
  // Calcular estatísticas dinâmicas
  const videosEmProducao = videos.filter(v => !['pronto', 'agendado', 'publicado'].includes(v.status)).length;
  const videosProntos = videos.filter(v => v.status === 'pronto' && v.thumbnail_pronta).length;
  const canaisAtivos = canais.length;
  const totalIdeias = ideias.length;
  const colaboradores = usuarios.length;
  
  const menuItems = [
    {
      id: 'ideas' as const,
      label: 'Banco de Ideias',
      icon: Lightbulb,
      description: 'Gestão de Ideias'
    },
    {
      id: 'kanban' as const,
      label: 'Produção',
      icon: LayoutGrid,
      description: 'Pipeline Kanban'
    },
    {
      id: 'schedule' as const,
      label: 'Agendamento',
      icon: Calendar,
      description: 'Calendário & Fila'
    },
    {
      id: 'management' as const,
      label: 'Gerenciamento',
      icon: Settings,
      description: 'Canais & Equipe'
    },
    {
      id: 'profile' as const,
      label: 'Perfil',
      icon: User,
      description: 'Meu Perfil'
    }
  ];

  return (
    <div className="w-72 bg-background-secondary border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
            <PlusCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Dark Channel</h1>
            <p className="text-sm text-muted-foreground">Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`nav-item w-full text-left ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Stats */}
      <div className="p-4 border-t border-border">
        <div className="card-secondary p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Status Geral</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vídeos em Produção</span>
              <span className="text-warning font-medium">{videosEmProducao}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prontos para Agendar</span>
              <span className="text-success font-medium">{videosProntos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Canais Ativos</span>
              <span className="text-primary font-medium">{canaisAtivos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de Ideias</span>
              <span className="text-secondary font-medium">{totalIdeias}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Colaboradores</span>
              <span className="text-foreground font-medium">{colaboradores}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};