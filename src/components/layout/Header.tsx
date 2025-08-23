import { Search, Filter, Plus, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  currentView: 'kanban' | 'schedule' | 'management' | 'ideas';
}

export const Header = ({ currentView }: HeaderProps) => {
  const { signOut } = useAuth();
  const getTitle = () => {
    switch (currentView) {
      case 'ideas':
        return 'Banco de Ideias';
      case 'kanban':
        return 'Pipeline de Produção';
      case 'schedule':
        return 'Controle de Lançamento';
      case 'management':
        return 'Central de Gerenciamento';
      default:
        return 'Dark Channel Manager';
    }
  };

  const getDescription = () => {
    switch (currentView) {
      case 'ideas':
        return 'Gerencie e aprove ideias para seus canais';
      case 'kanban':
        return 'Organize o fluxo de produção dos seus vídeos';
      case 'schedule':
        return 'Gerencie o agendamento e calendário de conteúdo';
      case 'management':
        return 'Configure canais, equipe e preferências';
      default:
        return 'Sistema de gestão para canais faceless';
    }
  };

  return (
    <header className="bg-background-secondary border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{getTitle()}</h1>
          <p className="text-muted-foreground mt-1">{getDescription()}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="input-primary pl-10 w-64"
            />
          </div>



          {/* Logout Button */}
          <button onClick={signOut} className="btn-ghost text-red-500 hover:text-red-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};