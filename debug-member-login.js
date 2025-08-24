// Script para debugar e testar o sistema de login de membros
console.log('=== DEBUG MEMBER LOGIN SYSTEM ===');

// 1. Verificar localStorage
console.log('\n1. Verificando localStorage...');
const devMembers = localStorage.getItem('dev_members');
console.log('dev_members existe:', !!devMembers);

if (devMembers) {
    try {
        const members = JSON.parse(devMembers);
        console.log('Número de membros:', members.length);
        console.log('Membros encontrados:', members);
        
        // Procurar pelo membro específico
        const targetMember = members.find(m => 
            m.username === 'fernandomineiro' || 
            m.email === 'fernandonocode@gmail.com'
        );
        
        if (targetMember) {
            console.log('✅ Membro fernandomineiro encontrado:', targetMember);
        } else {
            console.log('❌ Membro fernandomineiro NÃO encontrado');
        }
    } catch (error) {
        console.error('Erro ao parsear dev_members:', error);
    }
} else {
    console.log('❌ dev_members não existe no localStorage');
}

// 2. Criar membro de teste se não existir
console.log('\n2. Criando/Atualizando membro de teste...');

const testMember = {
    id: 'test-member-fernandomineiro',
    username: 'fernandomineiro',
    email: 'fernandonocode@gmail.com',
    password: '123456',
    nome: 'Fernando Mineiro',
    is_active: true,
    admin_id: 'test-admin-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

let members = [];
if (devMembers) {
    try {
        members = JSON.parse(devMembers);
    } catch (error) {
        console.error('Erro ao parsear membros existentes:', error);
        members = [];
    }
}

// Remover membro existente se houver
const existingIndex = members.findIndex(m => 
    m.username === 'fernandomineiro' || 
    m.email === 'fernandonocode@gmail.com'
);

if (existingIndex >= 0) {
    members[existingIndex] = testMember;
    console.log('✅ Membro atualizado');
} else {
    members.push(testMember);
    console.log('✅ Novo membro adicionado');
}

// Salvar no localStorage
localStorage.setItem('dev_members', JSON.stringify(members));
console.log('✅ Membros salvos no localStorage');
console.log('Total de membros agora:', members.length);

// 3. Testar função de login
console.log('\n3. Testando lógica de login...');

function testLocalLogin(username, password) {
    console.log(`Testando login: ${username} / ${password}`);
    
    const devMembers = localStorage.getItem('dev_members');
    if (!devMembers) {
        console.error('❌ dev_members não encontrado');
        return false;
    }
    
    try {
        const members = JSON.parse(devMembers);
        console.log('Membros carregados:', members.length);
        
        // Buscar membro
        const member = members.find(m => 
            m.username === username || m.email === username
        );
        
        if (!member) {
            console.error('❌ Membro não encontrado');
            return false;
        }
        
        console.log('✅ Membro encontrado:', member);
        
        // Verificar senha
        if (member.password !== password) {
            console.error(`❌ Senha incorreta. Esperado: ${member.password}, Recebido: ${password}`);
            return false;
        }
        
        console.log('✅ Senha correta');
        
        // Verificar se está ativo
        if (!member.is_active) {
            console.error('❌ Membro inativo');
            return false;
        }
        
        console.log('✅ Membro ativo');
        
        // Criar sessão local
        const sessionToken = `local_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        const localSession = {
            id: `session_${Date.now()}`,
            member_id: member.id,
            session_token: sessionToken,
            expires_at: expiresAt,
            member: member
        };
        
        localStorage.setItem('member_session_token', sessionToken);
        localStorage.setItem('member_local_session', JSON.stringify(localSession));
        
        console.log('✅ Sessão criada:', sessionToken);
        console.log('✅ LOGIN REALIZADO COM SUCESSO!');
        
        return true;
    } catch (error) {
        console.error('❌ Erro no teste de login:', error);
        return false;
    }
}

// Testar com diferentes combinações
console.log('\n--- Teste 1: Username ---');
testLocalLogin('fernandomineiro', '123456');

console.log('\n--- Teste 2: Email ---');
testLocalLogin('fernandonocode@gmail.com', '123456');

console.log('\n--- Teste 3: Senha incorreta ---');
testLocalLogin('fernandomineiro', 'senha_errada');

console.log('\n=== FIM DO DEBUG ===');

// 4. Verificar sessão atual
console.log('\n4. Verificando sessão atual...');
const currentSessionToken = localStorage.getItem('member_session_token');
const currentLocalSession = localStorage.getItem('member_local_session');

console.log('Session token atual:', currentSessionToken);
console.log('Local session atual:', currentLocalSession);

if (currentLocalSession) {
    try {
        const sessionData = JSON.parse(currentLocalSession);
        console.log('Dados da sessão:', sessionData);
        
        const expiresAt = new Date(sessionData.expires_at);
        const now = new Date();
        console.log('Sessão expira em:', expiresAt);
        console.log('Agora:', now);
        console.log('Sessão válida:', expiresAt > now);
    } catch (error) {
        console.error('Erro ao parsear sessão local:', error);
    }
}