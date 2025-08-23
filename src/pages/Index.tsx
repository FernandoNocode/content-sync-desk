import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ScheduleView } from '@/components/schedule/ScheduleView';
import { ManagementView } from '@/components/management/ManagementView';
import { IdeasBank } from '@/components/ideas/IdeasBank';
import { UserProfile } from '@/components/profile/UserProfile';

type ViewType = 'kanban' | 'schedule' | 'management' | 'ideas' | 'profile';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('ideas');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderView = () => {
    switch (currentView) {
      case 'ideas':
        return <IdeasBank />;
      case 'kanban':
        return <KanbanBoard />;
      case 'schedule':
        return <ScheduleView />;
      case 'management':
        return <ManagementView />;
      case 'profile':
        return <UserProfile />;
      default:
        return <IdeasBank />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="flex-1 flex flex-col">
        <Header currentView={currentView} />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="fade-in">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;