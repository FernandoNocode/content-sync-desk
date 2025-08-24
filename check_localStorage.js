// Script para verificar e configurar localStorage para membros
console.log('=== Verificando localStorage ===');

// Verificar se existe dev_members
const devMembers = localStorage.getItem('dev_members');
console.log('dev_members no localStorage:', devMembers);

if (devMembers) {
  const members = JSON.parse(devMembers);
  console.log('Membros encontrados:', members);
  
  // Procurar pelo membro específico
  const targetMember = members.find(m => 
    m.username === 'fernandomineiro' || 
    m.email === 'fernandonocode@gmail.com'
  );
  
  if (targetMember) {
    console.log('Membro encontrado:', targetMember);
  } else {
    console.log('Membro não encontrado!');
  }
} else {
  console.log('Nenhum membro no localStorage');
}

// Criar membro manualmente se não existir
function createTestMember() {
  const existingMembers = JSON.parse(localStorage.getItem('dev_members') || '[]');
  
  // Verificar se já existe
  const exists = existingMembers.find(m => 
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
}

// Executar criação
createTestMember();

// Verificar novamente
const updatedMembers = JSON.parse(localStorage.getItem('dev_members') || '[]');
console.log('Membros após criação:', updatedMembers);

console.log('=== Script concluído ===');