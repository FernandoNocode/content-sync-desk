import { useState } from 'react';
import { Plus, Edit, Trash2, Users, Hash, Globe, BarChart3, Calendar, Clock, Upload } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useMember } from '@/contexts/MemberContext';
import { CanalForm } from '@/components/forms/CanalForm';
import { UsuarioForm } from '@/components/forms/UsuarioForm';
import { MemberForm } from '@/components/forms/MemberForm';

export const ManagementView = () => {
  const { canais, usuarios, addCanal, updateCanal, deleteCanal, addUsuario, updateUsuario, deleteUsuario } = useApp();
  const { members, createMember, updateMember, deleteMember } = useMember();
  const [activeTab, setActiveTab] = useState<'canais' | 'equipe' | 'membros'>('canais');
  const [showCanalForm, setShowCanalForm] = useState(false);
  const [showUsuarioForm, setShowUsuarioForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingCanal, setEditingCanal] = useState<any>(null);
  const [editingUsuario, setEditingUsuario] = useState<any>(null);
  const [editingMember, setEditingMember] = useState<any>(null);

  const handleAddCanal = () => {
    setEditingCanal(null);
    setShowCanalForm(true);
  };

  const handleEditCanal = (canal: any) => {
    setEditingCanal(canal);
    setShowCanalForm(true);
  };

  const handleDeleteCanal = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este canal? Todos os vídeos e ideias relacionados serão perdidos.')) {
      deleteCanal(id);
    }
  };

  const handleCanalSubmit = (canalData: any) => {
    if (editingCanal) {
      updateCanal(editingCanal.id, canalData);
    } else {
      addCanal(canalData);
    }
    setShowCanalForm(false);
    setEditingCanal(null);
  };

  const handleAddUsuario = () => {
    setEditingUsuario(null);
    setShowUsuarioForm(true);
  };

  const handleEditUsuario = (usuario: any) => {
    setEditingUsuario(usuario);
    setShowUsuarioForm(true);
  };

  const handleDeleteUsuario = (id: string) => {
    if (confirm('Tem certeza que deseja remover este membro da equipe?')) {
      deleteUsuario(id);
    }
  };

  const handleUsuarioSubmit = (usuarioData: any) => {
    if (editingUsuario) {
      updateUsuario(editingUsuario.id, usuarioData);
    } else {
      addUsuario(usuarioData);
    }
    setShowUsuarioForm(false);
    setEditingUsuario(null);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setShowMemberForm(true);
  };

  const handleEditMember = (member: any) => {
    setEditingMember(member);
    setShowMemberForm(true);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este membro?')) {
      deleteMember(id);
    }
  };

  const handleMemberSubmit = (memberData: any) => {
    if (editingMember) {
      updateMember(editingMember.id, memberData);
    } else {
      createMember(memberData);
    }
    setShowMemberForm(false);
    setEditingMember(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('canais')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'canais'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Hash className="w-4 h-4 inline mr-2" />
          Canais
        </button>
        <button
          onClick={() => setActiveTab('equipe')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'equipe'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Equipe
        </button>
        <button
          onClick={() => setActiveTab('membros')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'membros'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Membros
        </button>
      </div>

      {/* Canais Tab */}
      {activeTab === 'canais' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Gerenciar Canais</h2>
            <button onClick={handleAddCanal} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Novo Canal
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {canais.map((canal) => (
              <div key={canal.id} className="card-primary p-6">
                {/* Canal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {canal.logo_url ? (
                        <img 
                          src={canal.logo_url} 
                          alt={`Logo ${canal.nome}`}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-border"
                        />
                      ) : (
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: canal.cor }}
                        >
                          <span className="text-white font-bold text-lg">
                            {canal.nome.charAt(0)}
                          </span>
                        </div>
                      )}


                      <input
                        type="file"
                        accept="image/*"
                        id={`logo-upload-${canal.id}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const imageUrl = event.target?.result as string;
                              updateCanal(canal.id, { logo_url: imageUrl });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label 
                        htmlFor={`logo-upload-${canal.id}`}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors"
                        title="Alterar logo do canal"
                      >
                        <Upload className="w-3 h-3 text-white" />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{canal.nome}</h3>
                      <a
                        href={canal.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {canal.link}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditCanal(canal)} 
                      className="btn-ghost p-2"
                      title="Editar canal"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCanal(canal.id)} 
                      className="btn-ghost p-2 text-destructive"
                      title="Excluir canal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Canal Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: canal.cor }}
                    ></div>
                    <span className="text-muted-foreground">Cor do canal</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Língua:</span>
                    <span className="text-foreground">{canal.lingua}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Frequência:</span>
                    <span className="text-foreground">{canal.freq_postagem}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Dias:</span>
                    <div className="flex gap-1">
                      {canal.dias_postagem.map((dia) => (
                        <span key={dia} className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
                          {dia}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Horários:</span>
                    <div className="flex gap-1">
                      {canal.horarios_postagem.map((horario) => (
                        <span key={horario} className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
                          {horario}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nicho Hierarchy */}
                <div className="mt-4 p-3 bg-background-tertiary rounded-lg">
                  <h4 className="text-sm font-medium text-foreground mb-2">Categorização</h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded">
                      {canal.nicho}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="bg-secondary/20 text-secondary px-2 py-1 rounded">
                      {canal.sub_nicho}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="bg-success/20 text-success px-2 py-1 rounded">
                      {canal.micro_nicho}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Membros Tab */}
      {activeTab === 'membros' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Gerenciar Membros</h2>
            <button onClick={handleAddMember} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Membro
            </button>
          </div>

          <div className="card-primary overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-tertiary">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">Nome</th>
                    <th className="text-left p-4 font-medium text-foreground">Usuário</th>
                    <th className="text-left p-4 font-medium text-foreground">Email</th>
                    <th className="text-left p-4 font-medium text-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr
                      key={member.id}
                      className={`border-t border-border ${
                        index % 2 === 0 ? 'bg-background' : 'bg-background-secondary'
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.nome?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm font-medium">{member.nome}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{member.username}</td>
                      <td className="p-4 text-muted-foreground">{member.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          member.is_active 
                            ? 'bg-success/20 text-success' 
                            : 'bg-destructive/20 text-destructive'
                        }`}>
                          {member.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditMember(member)} 
                            className="btn-ghost p-2"
                            title="Editar membro"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMember(member.id)} 
                            className="btn-ghost p-2 text-destructive"
                            title="Excluir membro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Equipe Tab */}
      {activeTab === 'equipe' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-foreground">Gerenciar Equipe</h2>
            <div className="flex gap-2">
              <button onClick={handleAddUsuario} className="btn-secondary">
                <Plus className="w-4 h-4 mr-2" />
                Convidar Admin
              </button>
              <button onClick={() => setShowMemberForm(true)} className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Criar Membro
              </button>
            </div>
          </div>

          <div className="card-primary overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-tertiary">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">Nome</th>
                    <th className="text-left p-4 font-medium text-foreground">Email</th>
                    <th className="text-left p-4 font-medium text-foreground">Função</th>
                    <th className="text-left p-4 font-medium text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario, index) => (
                    <tr
                      key={usuario.id}
                      className={`border-t border-border ${
                        index % 2 === 0 ? 'bg-background' : 'bg-background-secondary'
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {usuario.nome.charAt(0)}
                          </div>
                          <span className="text-foreground font-medium">{usuario.nome}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{usuario.email}</td>
                      <td className="p-4">
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-sm">
                          {usuario.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditUsuario(usuario)} 
                            className="btn-ghost p-2"
                            title="Editar membro"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUsuario(usuario.id)} 
                            className="btn-ghost p-2 text-destructive"
                            title="Remover membro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Forms */}
      {showCanalForm && (
        <CanalForm
          canal={editingCanal}
          onSubmit={handleCanalSubmit}
          onCancel={() => {
            setShowCanalForm(false);
            setEditingCanal(null);
          }}
        />
      )}

      {showUsuarioForm && (
        <UsuarioForm
          usuario={editingUsuario}
          onSubmit={handleUsuarioSubmit}
          onCancel={() => {
            setShowUsuarioForm(false);
            setEditingUsuario(null);
          }}
        />
      )}

      {showMemberForm && (
        <MemberForm
          member={editingMember}
          onSubmit={handleMemberSubmit}
          onCancel={() => {
            setShowMemberForm(false);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
};