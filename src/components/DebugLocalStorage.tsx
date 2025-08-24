import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DebugLocalStorage: React.FC = () => {
  const [devMembers, setDevMembers] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const members = JSON.parse(localStorage.getItem('dev_members') || '[]');
    setDevMembers(members);
  }, [refreshKey]);

  const createTestMember = () => {
    const existingMembers = JSON.parse(localStorage.getItem('dev_members') || '[]');
    
    // Verificar se já existe
    const exists = existingMembers.find((m: any) => 
      m.username === 'fernandomineiro' || 
      m.email === 'fernandonocode@gmail.com'
    );
    
    if (!exists) {
      const newMember = {
        id: Date.now().toString(),
        admin_id: 'admin_123',
        username: 'fernandomineiro',
        password: '123456', // Senha em texto simples para desenvolvimento
        nome: 'Fernando Mineiro',
        email: 'fernandonocode@gmail.com',
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      existingMembers.push(newMember);
      localStorage.setItem('dev_members', JSON.stringify(existingMembers));
      console.log('Membro criado:', newMember);
    } else {
      console.log('Membro já existe:', exists);
    }
    
    setRefreshKey(prev => prev + 1);
  };

  const clearMembers = () => {
    localStorage.removeItem('dev_members');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Debug LocalStorage - Membros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={createTestMember}>Criar Membro Teste</Button>
          <Button onClick={clearMembers} variant="destructive">Limpar Membros</Button>
          <Button onClick={() => setRefreshKey(prev => prev + 1)} variant="outline">Atualizar</Button>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Membros no localStorage ({devMembers.length}):</h3>
          {devMembers.length === 0 ? (
            <p className="text-gray-500">Nenhum membro encontrado</p>
          ) : (
            <div className="space-y-2">
              {devMembers.map((member, index) => (
                <div key={index} className="p-3 border rounded bg-gray-50">
                  <p><strong>ID:</strong> {member.id}</p>
                  <p><strong>Username:</strong> {member.username}</p>
                  <p><strong>Email:</strong> {member.email}</p>
                  <p><strong>Nome:</strong> {member.nome}</p>
                  <p><strong>Senha:</strong> {member.password}</p>
                  <p><strong>Ativo:</strong> {member.is_active ? 'Sim' : 'Não'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h4 className="font-semibold">Instruções:</h4>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Clique em "Criar Membro Teste" para adicionar o membro fernandomineiro</li>
            <li>Vá para a página de login de membros (/member-login)</li>
            <li>Tente fazer login com:</li>
            <ul className="list-disc list-inside ml-4">
              <li>Username: fernandomineiro</li>
              <li>Senha: 123456</li>
            </ul>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugLocalStorage;