const axios = require('axios');
const readline = require('readline-sync');
///teste
const API_TOKEN = 'uTruXGyrzwCOR2zARrjlfS8_eX6i8lgqpMtssDMbq0p0XdF-_Gk';
const BASE_URL = 'https://api.pandascore.co';
///teste
async function buscarTime(nomeTime) {
  try {
    console.log(`\n🔍 Buscando: "${nomeTime}"...\n`);
    
    const response = await axios.get(`${BASE_URL}/csgo/teams`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      params: {
        'search[name]': nomeTime
      }
    });
    
    if (response.data.length === 0) {
      console.log('❌ Time não encontrado');
      return;
    }
    
    console.log(`✅ Encontrado ${response.data.length} time(s):\n`);
    
    response.data.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (${team.acronym || 'N/A'})`);
      console.log(`   ID: ${team.id}`);
      console.log(`   País: ${team.location || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}
///teste
// Input interativo
console.log('🎮 Buscar Times de Counter-Strike\n');
const nomeTime = readline.question('Digite o nome do time: ');

if (nomeTime.trim() === '') {
  console.log('❌ Você precisa digitar um nome!');
  process.exit(1);
}
///teste
///teste
buscarTime(nomeTime);