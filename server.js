const express = require('express');
const cors = require('cors');
const readline = require('readline-sync');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const API_TOKEN = 'uTruXGyrzwCOR2zARrjlfS8_eX6i8lgqpMtssDMbq0p0XdF-_Gk';
const BASE_URL = 'https://api.pandascore.co';

// Middlewares
app.use(cors());
app.use(express.json());


app.use(express.static('public')); // Serve CSS, JS, imagens
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
}); 



async function baixarLogo(team) {
  if (!team.image_url) {
    console.log("Esse time não possui logo cadastrada");
    return { success: false, message: "Sem logo" };
  }

  const nomeArquivo = `${team.name.replace(/\s/g, '_')}_${team.id}.png`;
  const pasta = './logos';
  const caminhoimg = path.join(pasta, nomeArquivo);

  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta);
  }

  if (fs.existsSync(caminhoimg)) {
    console.log(`A logo já existe em: ${caminhoimg}`);
    console.log('❌ Download cancelado (auto)');
    return { success: false, message: `Logo já existe: ${caminhoimg}` };
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
  return { success: true, path: caminhoimg };
}

async function buscarTime(nomeTime) {
  try {
    console.log(`\n🔍 Buscando: "${nomeTime}"...\n`);

    const response = await axios.get(`${BASE_URL}/csgo/teams`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      params: { 'search[name]': nomeTime }
    });

    if (response.data.length === 0) {
      console.log('❌ Time não encontrado');
      return [];
    }

    console.log(`✅ Encontrado ${response.data.length} time(s):\n`);

    response.data.forEach((team, index) => {
      console.log(`${index + 1}. ${team.name} (${team.acronym || 'N/A'})`);
      console.log(`   ID: ${team.id}`);
      console.log(`   País: ${team.location || 'N/A'}`);
      console.log('');
    });

    return response.data;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return [];
  }
}

async function buscarPeloId(IdTime) {
  try {
    console.log(`\n🔍 Buscando time com ID: "${IdTime}"...\n`);

    const response = await axios.get(`${BASE_URL}/csgo/teams`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      params: { 'filter[id]': IdTime }
    });

    if (response.data.length === 0) {
      console.log('❌ Time não encontrado com este ID');
      return null;
    }

    const team = response.data[0];

    console.log(`✅ Time Encontrado\n`);
    console.log(`Nome: ${team.name} (${team.acronym || 'N/A'})`);
    console.log(`Logo URL: ${team.image_url || 'Não disponível'}`);
    console.log(`ID: ${team.id}`);
    console.log(`País: ${team.location || 'N/A'}`);
    console.log('');

    const logoResult = await baixarLogo(team);
    return { team, logo: logoResult };
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return null;
  }
}

async function buscarPartida(IdPt) {
  try {
    console.log(`\n🔍 Buscando Partidas com ID: "${IdPt}"...\n`);

    const response = await axios.get(`${BASE_URL}/csgo/matches/upcoming`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` },
      params: { 'filter[opponent_id]': IdPt }
    });

    if (response.data.length === 0) {
      console.log('❌ Partida não encontrada com este ID');
      return [];
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
    return response.data;
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return [];
  }
}

// TODAS AS ROTAS FILTRADAS (igual ao console local)
app.get('/api/teams/search', async (req, res) => {
  const nomeTime = req.query.name;
  if (!nomeTime) return res.status(400).json({ error: 'Nome obrigatório' });
  
  const teams = await buscarTime(nomeTime);
  
  // FILTRA como no seu console.log
  const teamsFiltrados = teams.map(team => ({
    name: team.name,
    acronym: team.acronym || 'N/A',
    id: team.id,
    location: team.location || 'N/A'
  }));

  res.json({
    message: `✅ Encontrado ${teams.length} time(s)`,
    teams: teamsFiltrados
  });
});

app.get('/api/teams/:id', async (req, res) => {
  const IdTime = req.params.id;
  const result = await buscarPeloId(IdTime);
  
  if (!result) return res.status(404).json({ error: 'Time não encontrado' });

  // FILTRA exatamente como no seu console.log
  const teamFiltrado = {
    name: result.team.name,
    acronym: result.team.acronym || 'N/A',
    id: result.team.id,
    location: result.team.location || 'N/A',
    logo_url: result.team.image_url || 'Não disponível'
  };

  res.json({
    message: `✅ Time Encontrado`,
    time: teamFiltrado,
    logo: result.logo
  });
});

app.get('/api/teams/:id/matches', async (req, res) => {
  const IdPt = req.params.id;
  const matches = await buscarPartida(IdPt);
  
  if (matches.length === 0) return res.json({ message: '❌ Partida não encontrada com este ID', matches: [] });

  // FILTRA primeira partida como no seu console.log
  const match = matches[0];
  const time1 = match.opponents?.[0]?.opponent?.name || 'N/A';
  const time2 = match.opponents?.[1]?.opponent?.name || 'N/A';
  const dateAPI = match.scheduled_at;
  const data = new Date(dateAPI);

  const matchFiltrado = {
    name: match.name,
    status: match.status,
    liga: match.league?.name || 'N/A',
    torneio: match.tournament?.name || 'N/A',
    serie: match.serie?.full_name || 'N/A',
    times: `${time1} vs ${time2}`,
    horario: `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}`
  };

  res.json({
    message: `✅ Partida Encontrada`,
    match: matchFiltrado,
    total: matches.length
  });
});

app.get('/api/matches/running', async (req, res) => {
  try {
    console.log('\n🔴 Buscando partidas ao vivo...\n');

    const response = await axios.get(`${BASE_URL}/csgo/matches/running`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });

    if (response.data.length === 0) {
      console.log('❌ Nenhuma partida ao vivo no momento');
      return res.json({ message: 'Nenhuma partida ao vivo', matches: [] });
    }

    console.log(`✅ ${response.data.length} partida(s) ao vivo\n`);

    // Filtra as partidas
    const matchesFiltradas = response.data.map(match => {
      const time1 = match.opponents?.[0]?.opponent?.name || 'N/A';
      const time2 = match.opponents?.[1]?.opponent?.name || 'N/A';
      const dateAPI = match.scheduled_at;
      const data = new Date(dateAPI);

      console.log(`${match.name} - ${time1} vs ${time2}`);
      console.log(`Liga: ${match.league?.name}`);
      console.log(`Status: ${match.status}\n`);

      return {
        name: match.name,
        status: match.status,
        liga: match.league?.name || 'N/A',
        torneio: match.tournament?.name || 'N/A',
        serie: match.serie?.full_name || 'N/A',
        times: `${time1} vs ${time2}`,
        horario: `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}`,
        id: match.id,
      };
    });

    res.json({
      message: `✅ ${response.data.length} partida(s) ao vivo`,
      matches: matchesFiltradas
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/matches/upcoming', async (req, res) => {
  try {
    console.log('\n🔴 Buscando partidas futuras...\n');

    const response = await axios.get(`${BASE_URL}/csgo/matches/upcoming`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });

    if (response.data.length === 0) {
      console.log('❌ Nenhuma partida futura no momento');
      return res.json({ message: 'Nenhuma partida futura', matches: [] });
    }

    console.log(`✅ ${response.data.length} partida(s) futura(s)\n`);

    // Filtra as partidas
    const matchesFiltradas = response.data.map(match => {
      const time1 = match.opponents?.[0]?.opponent?.name || 'N/A';
      const time2 = match.opponents?.[1]?.opponent?.name || 'N/A';
      const dateAPI = match.scheduled_at;
      const data = new Date(dateAPI);

      console.log(`${match.name} - ${time1} vs ${time2}`);
      console.log(`Liga: ${match.league?.name}`);
      console.log(`Status: ${match.status}\n`);

      return {
        name: match.name,
        status: match.status,
        liga: match.league?.name || 'N/A',
        torneio: match.tournament?.name || 'N/A',
        serie: match.serie?.full_name || 'N/A',
        times: `${time1} vs ${time2}`,
        horario: `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}`,
        id: match.id,
      };
    });

    res.json({
      message: `✅ ${response.data.length} partida(s) futura(s)`,
      matches: matchesFiltradas
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ 
    message: '🎮 API CS:GO - Filtrada como no console local!',
    rotas: [
      'GET /api/teams/search?name=furia',
      'GET /api/teams/124530', 
      'GET /api/teams/124530/matches'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
