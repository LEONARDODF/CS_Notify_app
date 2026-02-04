const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline-sync');

const API_TOKEN = 'uTruXGyrzwCOR2zARrjlfS8_eX6i8lgqpMtssDMbq0p0XdF-_Gk';
const BASE_URL = 'https://api.pandascore.co';

async function baixarLogo(team) {

  if (!team.image_url) {
    console.log("Esse time não possui logo cadastrada");
    return;
  }

  const nomeArquivo = `${team.name.replace(/\s/g, '_')}_${team.id}.png`;
  const pasta = './logos';
  const caminhoimg = path.join(pasta, nomeArquivo);

  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta);
  }

  if (fs.existsSync(caminhoimg)) {
    console.log(`A logo já existe em: ${caminhoimg}`);
    const resposta = readline.question('Baixar novamente? (s/n):');

    if (resposta.toLowerCase() !== 's') {
      console.log('❌ Download cancelado');
      return;
    }
  }


  console.log('Baixando logo');
  const response = await axios.get(team.image_url, { responseType: 'stream' });

  const writer = fs.createWriteStream(caminhoimg);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log(`Logo salva em: ${caminhoimg}`);

}

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

async function buscarPeloId(IdTime) {
  try {
    console.log(`\n🔍 Buscando time com ID: "${IdTime}"...\n`);

    const response = await axios.get(`${BASE_URL}/csgo/teams`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      params: {
        'filter[id]': IdTime
      }
    });

    if (response.data.length === 0) {
      console.log('❌ Time não encontrado com este ID');
      return;
    }

    const team = response.data[0];

    console.log(`✅ Time Encontrado\n`);
    console.log(`Nome: ${team.name} (${team.acronym || 'N/A'})`);
    console.log(`Logo URL: ${team.image_url || 'Não disponível'}`);
    console.log(`ID: ${team.id}`);
    console.log(`País: ${team.location || 'N/A'}`);
    console.log('');
    await baixarLogo(team);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}
///running pt
async function buscarPartida(IdPt) {
  try {
    console.log(`\n🔍 Buscando Partidas com ID: "${IdPt}"...\n`);

    const response = await axios.get(`${BASE_URL}/csgo/matches/upcoming`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      params: {
        'filter[opponent_id]': IdPt
      }
    });

    if (response.data.length === 0) {
      console.log('❌ Partida não encontrada com este ID');
      return;
    }

    const match = response.data[0];

    console.log(`✅ Partida Encontrada\n`);
    console.log(`Nome: ${match.name}`);
    console.log(`Status: ${match.status}`);
    console.log(`Liga: ${match.league?.name}`);
    console.log(`Torneio: ${match.tournament?.name}`);
    console.log(`Série: ${match.serie?.full_name}`);
    console.log(`Times que vão jogar:`);
    if (match.opponents && match.opponents.length >= 2) {
      const time1 = match.opponents[0].opponent.name;
      const time2 = match.opponents[1].opponent.name;
      console.log(`${time1} vs ${time2}`);
    }
    const dateAPI = match.scheduled_at;
    const data = new Date(dateAPI);
    console.log(`Horário: ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}`);

    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function main() {

  console.log('O que deseja fazer?\n',
    '1: Buscar time pelo nome\n',
    '2: Buscar time pelo id\n',
    '3: Buscar partidas do time pelo id\n',
    '4: Encerrar programa\n'
  );
  const opcao = readline.question('Escolha uma opcao: ');

  if (opcao.trim() === '1') {
    op1();
  } else if (opcao.trim() === '2') {
    op2();
  } else if (opcao.trim() === '3') {
    op3();
  } else if (opcao.trim() === '4') {
    console.log(' Programa encerrado!');
    process.exit(0);
  } else { console.log('❌ Opcao invalida, programa encerrado'); return; }
}


async function op1() {

  while (true) {

    console.log('🎮 Buscar Times de Counter-Strike\n');
    const nomeTime = readline.question('Digite o nome do time: ');

    if (nomeTime.trim() === '') {
      console.log('❌ Você precisa digitar um nome!');
      continue;
    } else if (nomeTime.trim() === '0') {
      console.log('❌ Encerrando pesquisa!');
      break;
    }
    await buscarTime(nomeTime);
    console.log('\n---\n');
  }
}

async function op2() {

  while (true) {

    console.log('🎮 Buscar Times de Counter-Strike\n');
    const IdTime = readline.question('Digite o Id do time: ');

    if (IdTime.trim() === '') {
      console.log('❌ Você precisa digitar um Id!');
      continue;
    } else if (IdTime.trim() === '0') {
      console.log('❌ Encerrando pesquisa!');
      break;
    }
    await buscarPeloId(IdTime);
    console.log('\n---\n');
  }
}

async function op3() {

  while (true) {

    console.log('🎮 Buscar partida através do Id de Times de Counter-Strike\n');
    const IdPt = readline.question('Digite o Id do time: ');

    if (IdPt.trim() === '') {
      console.log('❌ Você precisa digitar um Id!');
      continue;
    } else if (IdPt.trim() === '0') {
      console.log('❌ Encerrando pesquisa!');
      break;
    }
    await buscarPartida(IdPt);
    console.log('\n---\n');
  }
}

main();

