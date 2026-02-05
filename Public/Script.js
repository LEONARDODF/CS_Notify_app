// Estado da aplicação
const appState = {
    favorites: JSON.parse(localStorage.getItem('cs2_favorites')) || [],
    notifications: JSON.parse(localStorage.getItem('cs2_notifications')) || [],
    matches: {
        live: [],
        upcoming: []
    }
};

appState.notifications = (appState.notifications || [])
    .filter(n => n && n.id);

localStorage.setItem(
    'cs2_notifications',
    JSON.stringify(appState.notifications)
);

// 🔥 FUNÇÕES AUXILIARES (ANTES das principais)
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #ff6b35; color: white; padding: 15px 25px; 
        border-radius: 25px; z-index: 10000; font-weight: 600;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Inicializando CS2 Notifier...');

    // Aplicar tema
    const theme = localStorage.getItem('cs2_theme') || 'dark';
    document.body.setAttribute('data-theme', theme);

    // Inicializar
    initNavigation();
    updateFavoritesDisplay();

    // Carregar partidas PRIMEIRO
    loadMatches();

    // Configurar auto-refresh
    const config = JSON.parse(localStorage.getItem('cs2_config') || '{}');
    const refreshTime = config.autoRefresh || 120;
    startAutoUpdate(refreshTime);

    console.log('✅ App pronto!');
});

function startAutoUpdate(seconds) {
    if (window.updateInterval) clearInterval(window.updateInterval);
    window.updateInterval = setInterval(() => {
        console.log('🔄 Auto-refresh...');
        loadMatches();
    }, seconds * 1000);
    console.log(`✅ Auto-refresh: ${seconds}s`);
}
// 🔥 Função para carregar partidas da API
// 🔥 VERSÃO FINAL - Carrega LIVE + UPCOMING
async function loadMatches() {
    console.log('🔥 Carregando TODAS as partidas...');
    try {
        // Loading state
        showLoadingState('live-matches-container', 'Carregando partidas ao vivo...');
        showLoadingState('upcoming-matches-container', 'Carregando próximas partidas...');

        // 🔥 PARALELAMENTE: Live + Upcoming
        const [liveResponse, upcomingResponse] = await Promise.all([
            fetch('/api/matches/running'),
            fetch('/api/matches/upcoming')
        ]);

        const liveData = await liveResponse.json();
        const upcomingData = await upcomingResponse.json();

        // Salvar dados
        appState.matches.live = liveData.matches || [];
        appState.matches.upcoming = upcomingData.matches || [];

        // Renderizar
        renderMatches();

        // Re-bind eventos
        if (typeof initFavorites === 'function') initFavorites();
        if (typeof initNotifications === 'function') initNotifications();

        showToast(`✅ ${appState.matches.live.length} ao vivo | ${appState.matches.upcoming.length} próximas`);

    } catch (error) {
        console.error('❌ Erro:', error);
        showErrorState('live-matches-container', 'Erro ao carregar ao vivo');
        showErrorState('upcoming-matches-container', 'Erro ao carregar próximas');
    }
}


function renderMatches() {
    console.log('🎨 Renderizando cards...');

    // 🔥 LIVE MATCHES
    const liveContainer = document.getElementById('live-matches-container');
    if (liveContainer) {
        if (appState.matches.live.length > 0) {
            liveContainer.innerHTML = appState.matches.live
                .map(match => createMatchCard(match, true))
                .join('');
        } else {
            liveContainer.innerHTML = getNoMatchesHTML('live');
        }
    }

    // 🔥 UPCOMING MATCHES
    const upcomingContainer = document.getElementById('upcoming-matches-container');
    if (upcomingContainer) {
        if (appState.matches.upcoming.length > 0) {
            upcomingContainer.innerHTML = appState.matches.upcoming
                .map(match => createMatchCard(match, false))
                .join('');
        } else {
            upcomingContainer.innerHTML = getNoMatchesHTML('upcoming');
        }
    }

    // 🔥 NÃO MEXA NA VISIBILIDADE AQUI - deixa pros filtros
}


function createMatchCard(match, isLive = false) {
    const [team1, team2] = (match.times || 'Team1 vs Team2').split(' vs ');
    const matchId = (match.id || match.times || '').toString();
    const tierBadge = getTierBadge(match);
    const statusBadge = isLive ? '<span class="badge-live">AO VIVO</span>' : '<span class="badge-live">EM BREVE</span>';


    return `
        <div class="match-card ${isLive ? 'live-match' : ''}" data-team1="${team1}" data-team2="${team2}">
            <div class="match-header">
                ${tierBadge}
                <span class="tournament-name">${match.torneio || match.liga || 'Torneio'}</span>
                ${statusBadge}
            </div>
            <div class="match-body">
                <div class="team">
                    <div class="team-logo">${team1.charAt(0) || 'T'}</div>
                    <div class="team-name">${team1}</div>
                </div>
                <div class="match-vs">
                    <span>VS</span>
                    <div class="match-time">${match.horario || 'Horário'}</div>
                </div>
                <div class="team">
                    <div class="team-logo">${team2.charAt(0) || 'T'}</div>
                    <div class="team-name">${team2}</div>
                </div>
            </div>
            <div class="match-footer">
                <button class="btn-notify" data-match="${matchId}">
                    <i class="bi bi-bell"></i> Notificar
                </button>
                <button class="btn-favorite ${appState.favorites.includes(team1) ? 'active' : ''}" data-team="${team1}">
                    <i class="bi ${appState.favorites.includes(team1) ? 'bi-star-fill' : 'bi-star'}"></i>
                </button>
                <button class="btn-favorite ${appState.favorites.includes(team2) ? 'active' : ''}" data-team="${team2}">
                    <i class="bi ${appState.favorites.includes(team2) ? 'bi-star-fill' : 'bi-star'}"></i>
                </button>
            </div>
        </div>
    `;
}

function getTierBadge(match) {
    const torneio = (match.torneio || match.liga || '').toLowerCase();
    if (torneio.includes('major') || torneio.includes('iem')) return '<span class="badge-tier s-tier">S-Tier</span>';
    if (torneio.includes('blast')) return '<span class="badge-tier a-tier">A-Tier</span>';
    return '<span class="badge-tier b-tier">B-Tier</span>';
}

function getNoMatchesHTML(type) {
    return type === 'live' ? `
        <div class="no-matches">
            <i class="bi bi-tv-off" style="font-size: 3rem; opacity: 0.5;"></i>
            <p>Nenhuma partida ao vivo no momento</p>
        </div>
    ` : `
        <div class="no-matches">
            <i class="bi bi-clock-history" style="font-size: 3rem; opacity: 0.5;"></i>
            <p>Próximas partidas em breve</p>
        </div>
    `;
}

function showLoadingState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <i class="bi bi-hourglass-split" style="font-size: 3rem; opacity: 0.5;"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

function showErrorState(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="no-matches text-danger">
                <i class="bi bi-exclamation-triangle" style="font-size: 3rem;"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

function navigateToPage(page) {

    const sections = [
        'matches-section',
        'favorites-section',
        'notifications-section',
        'config-section'
    ];

    sections.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    if (page === 'matches' || page === 'live' || page === 'upcoming') {
        document.getElementById('matches-section').style.display = 'block';
        filterMatches(page);
    }

    if (page === 'favorites') {
        document.getElementById('favorites-section').style.display = 'block';
    }

    if (page === 'notifications') {
        document.getElementById('notifications-section').style.display = 'block';
        showNotifications();
    }

    if (page === 'config') {
        document.getElementById('config-section').style.display = 'block';
        showConfig();
    }

    if (page === 'matches' || page === 'live' || page === 'upcoming') {

        const matches = document.getElementById('matches-section');
        const live = document.getElementById('live-section');
        const upcoming = document.getElementById('upcoming-section');

        if (matches) matches.style.display = 'block';
        if (live) live.style.display = 'block';
        if (upcoming) upcoming.style.display = 'block';

        filterMatches?.(page);
    }

    updateActiveNav(page);
}
// CSS necessário
const style = document.createElement('style');
style.textContent = `
    .loading-spinner, .no-matches {
        text-align: center; padding: 3rem 1rem; color: #6c757d;
    }
    .loading-spinner i, .no-matches i { display: block; margin: 0 auto 1rem; }
    .btn-favorite { background: none; border: none; cursor: pointer; color: #ffc107; }
    .btn-favorite.active { color: #ffc107 !important; }
`;
document.head.appendChild(style);

// Event delegation para novos cards (funciona mesmo sem suas funções originais)
document.addEventListener('click', function (e) {
    // IGNORA botões voltar
    if (e.target.closest('[data-back="true"], .back-btn')) {
        return;
    }

    // Favoritos
    if (e.target.closest('.btn-favorite')) {
        e.preventDefault();
        const btn = e.target.closest('.btn-favorite');
        const team = btn.dataset.team;
        toggleFavorite(team, btn);
    }

    // Notificações
    if (e.target.closest('.btn-notify')) {
        const btn = e.target.closest('.btn-notify');
        const matchId = btn.dataset.match;
        toggleNotification(matchId, btn);
    }
});

function toggleFavorite(team, button) {
    const index = appState.favorites.indexOf(team);
    if (index === -1) {
        appState.favorites.push(team);
        button.classList.add('active');
        button.innerHTML = '<i class="bi bi-star-fill"></i>';
        showToast(`${team} adicionado aos favoritos! ⭐`);
    } else {
        appState.favorites.splice(index, 1);
        button.classList.remove('active');
        button.innerHTML = '<i class="bi bi-star"></i>';
        showToast(`${team} removido dos favoritos`);
    }
    localStorage.setItem('cs2_favorites', JSON.stringify(appState.favorites));
}

function initNavigation() {
    document.addEventListener('click', function (e) {

        const nav = e.target.closest('[data-page]');
        if (!nav) return;

        e.preventDefault();

        document.querySelectorAll('[data-page].active')
            .forEach(el => el.classList.remove('active'));

        nav.classList.add('active');

        navigateToPage(nav.dataset.page);
    });
}

function showAllMatches() {
    console.log('📋 Mostrando TODAS as partidas');

    const liveSection = document.getElementById('live-section');
    const upcomingSection = document.getElementById('upcoming-section');

    // Mostra ambas seções completas
    if (liveSection) liveSection.style.display = 'block';
    if (upcomingSection) upcomingSection.style.display = 'block';
}

function showLiveOnly() {
    console.log('🔴 Mostrando APENAS AO VIVO');

    const liveSection = document.getElementById('live-section');
    const upcomingSection = document.getElementById('upcoming-section');

    // Mostra só live, esconde upcoming
    if (liveSection) liveSection.style.display = 'block';
    if (upcomingSection) upcomingSection.style.display = 'none';
}

function showUpcomingOnly() {
    console.log('📅 Mostrando APENAS FUTURAS');

    const liveSection = document.getElementById('live-section');
    const upcomingSection = document.getElementById('upcoming-section');

    // Esconde live, mostra só upcoming
    if (liveSection) liveSection.style.display = 'none';
    if (upcomingSection) upcomingSection.style.display = 'block';
}

function updateFavoritesDisplay() {
    const favoritesList = document.getElementById('favorites-list');
    const favoritesEmpty = document.querySelector('.favorites-empty');

    if (!favoritesList) return;

    if (appState.favorites.length === 0) {
        if (favoritesEmpty) favoritesEmpty.style.display = 'block';
        favoritesList.innerHTML = '';
        return;
    }

    if (favoritesEmpty) favoritesEmpty.style.display = 'none';

    favoritesList.innerHTML = appState.favorites.map(team => `
        <div class="match-card mb-3">
            <div class="match-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="team-logo me-3" style="width: 50px; height: 50px; font-size: 1.5rem;">
                            ${team.charAt(0)}
                        </div>
                        <div>
                            <h5 class="mb-0">${team}</h5>
                            <small class="text-muted">Recebendo notificações</small>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFavorite('${team}')">
                        <i class="bi bi-trash"></i> Remover
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function removeFavorite(team) {
    const index = appState.favorites.indexOf(team);
    if (index !== -1) {
        appState.favorites.splice(index, 1);
        localStorage.setItem('cs2_favorites', JSON.stringify(appState.favorites));
        updateFavoritesDisplay();

        // Atualiza botões nos cards
        document.querySelectorAll(`.btn-favorite[data-team="${team}"]`).forEach(button => {
            button.classList.remove('active');
            button.innerHTML = '<i class="bi bi-star"></i>';
        });

        showToast(`${team} removido dos favoritos`);
    }
}

function initNotifications() {

    if (!Array.isArray(appState.notifications)) return;

    document.querySelectorAll('.btn-notify').forEach(button => {

        const matchId = button.dataset.match;
        if (!matchId) return;

        const active = appState.notifications.some(n =>
            n &&
            n.id &&
            n.id.toString() === matchId.toString()
        );

        if (active) {
            button.classList.add('active');
            button.innerHTML = '<i class="bi bi-bell-fill"></i> Ativado';
        }

    });
}

function toggleNotification(matchId, button) {

    const id = matchId.toString();

    const match = [
        ...appState.matches.live,
        ...appState.matches.upcoming
    ].find(m => (m.id || '').toString() === id);

    if (!match) {
        showToast('❌ Partida não encontrada');
        return;
    }

    const index = appState.notifications.findIndex(n => n.id.toString() === id);

    if (index === -1) {

        appState.notifications.push({
            id: id,
            team1: (match.times || '').split(' vs ')[0] || 'Time 1',
            team2: (match.times || '').split(' vs ')[1] || 'Time 2',
            event: match.torneio || match.liga || 'Evento'
        });

        button.classList.add('active');
        button.innerHTML = '<i class="bi bi-bell-fill"></i> Ativado';
        showToast(`🔔 Notificação ativada`);

    } else {

        appState.notifications.splice(index, 1);
        button.classList.remove('active');
        button.innerHTML = '<i class="bi bi-bell"></i> Notificar';
        showToast('Notificação desativada');

    }

    localStorage.setItem('cs2_notifications', JSON.stringify(appState.notifications));
}

function updateNotificationTime(minutes) {
    localStorage.setItem('notificationTime', minutes);
    showToast(`⏰ Antecedência: ${minutes} minutos`);
}

function cancelNotification(matchId) {

    const index = appState.notifications.findIndex(n =>
        n.id.toString() === matchId.toString()
    );

    if (index === -1) return;

    appState.notifications.splice(index, 1);

    localStorage.setItem(
        'cs2_notifications',
        JSON.stringify(appState.notifications)
    );

    showNotifications();
    showToast('🔔 Notificação removida');
}

function showNotifications() {

    const section = document.getElementById('notifications-section');

    const notifications = appState.notifications;

    if (!notifications.length) {

        section.innerHTML = `
            <div class="no-matches">
                <i class="bi bi-bell-slash" style="font-size:3rem;opacity:.5"></i>
                <p>Nenhuma notificação ainda</p>
            </div>
        `;

        return;
    }

    section.innerHTML = notifications.map(match => {

        const team1 = match.team1 || 'Time 1';
        const team2 = match.team2 || 'Time 2';
        const event = match.event || 'Evento';

        return `
            <div class="match-card mb-3">

                <div class="match-header">
                    <span class="badge-tier a-tier">NOTIFICAÇÃO</span>
                    <span class="tournament-name">${event}</span>
                </div>

                <div class="match-body">
                    <div class="team">
                        <div class="team-logo">${team1.charAt(0)}</div>
                        <div class="team-name">${team1}</div>
                    </div>

                    <div class="match-vs">
                        <span>VS</span>
                        <div class="match-time">🔔 Ativa</div>
                    </div>

                    <div class="team">
                        <div class="team-logo">${team2.charAt(0)}</div>
                        <div class="team-name">${team2}</div>
                    </div>
                </div>

                <div class="match-footer">
                    <button class="btn btn-sm btn-outline-danger"
                        onclick="cancelNotification('${match.id}')">
                        <i class="bi bi-trash"></i> Remover
                    </button>
                </div>

            </div>
        `;

    }).join('');
}

function showConfig() {

    const configSection = document.getElementById('config-section');

    const config = JSON.parse(localStorage.getItem('cs2_config') || '{}');

    configSection.innerHTML = `
        
<div class="section-title d-flex justify-content-between align-items-center mb-4">
    <div>
        <h3><i class="bi bi-gear-fill text-info"></i> ⚙️ Configurações</h3>
        <small class="text-muted">Personalize sua experiência</small>
    </div>
    <button class="btn btn-sm btn-outline-light back-btn" onclick="navigateToPage('matches'); return false;">
        <i class="bi bi-arrow-left"></i> Voltar
    </button>
</div>

<div class="section-title mb-3">
    <h5><i class="bi bi-bell-fill text-primary"></i> Notificações</h5>
</div>

<div class="row g-3 mb-5">

<div class="col-md-6">
<div class="match-card">
<div class="match-body d-flex justify-content-between align-items-center p-3">
<div>
<strong>Todas as Partidas</strong>
<div class="text-muted small">Notificar todas as partidas</div>
</div>
<div class="form-check form-switch">
<input class="form-check-input config-switch" type="checkbox" id="allMatches" ${config.allMatches ? 'checked' : ''}>
</div>
</div>
</div>
</div>

<div class="col-md-6">
<div class="match-card">
<div class="match-body d-flex justify-content-between align-items-center p-3">
<div>
<strong>Apenas S-Tier</strong>
<div class="text-muted small">Só campeonatos principais</div>
</div>
<div class="form-check form-switch">
<input class="form-check-input config-switch" type="checkbox" id="onlySTier" ${config.onlySTier ? 'checked' : ''}>
</div>
</div>
</div>
</div>

<div class="col-md-6">
<div class="match-card">
<div class="match-body d-flex justify-content-between align-items-center p-3">
<div>
<strong>Início das Lives</strong>
<div class="text-muted small">Quando partida começar</div>
</div>
<div class="form-check form-switch">
<input class="form-check-input config-switch" type="checkbox" id="liveStart" ${config.liveStart !== false ? 'checked' : ''}>
</div>
</div>
</div>
</div>

<div class="col-md-6">
<div class="match-card">
<div class="match-body d-flex justify-content-between align-items-center p-3">
<div>
<strong>Notificações por E-mail</strong>
<div class="text-muted small">Receber por e-mail também</div>
</div>
<div class="form-check form-switch">
<input class="form-check-input config-switch" type="checkbox" id="emailNotif" ${config.emailNotif ? 'checked' : ''}>
</div>
</div>
</div>
</div>

</div>

<div class="section-title mb-3">
<h5><i class="bi bi-palette-fill text-warning"></i> Aparência</h5>
</div>

<div class="match-card mb-4 p-4">

<div class="mb-4">
<label class="form-label mb-2">Tema:</label>
<div class="d-flex gap-2">

<button class="btn flex-fill ${config.theme !== 'light' ? 'btn-outline-light active' : 'btn-light'}"
onclick="setTheme('dark'); return false;">
<i class="bi bi-moon-fill"></i><br><small>Escuro</small>
</button>

<button class="btn flex-fill ${config.theme === 'light' ? 'btn-light active' : 'btn-outline-light'}"
onclick="setTheme('light'); return false;">
<i class="bi bi-sun-fill"></i><br><small>Claro</small>
</button>

</div>
</div>

<div class="form-check">
<input class="form-check-input config-switch" type="checkbox" id="reduceMotion" ${config.reduceMotion ? 'checked' : ''}>
<label class="form-check-label" for="reduceMotion">
Reduzir animações (Acessibilidade)
</label>
</div>

</div>

<div class="section-title mb-3">
<h5><i class="bi bi-arrow-clockwise text-success"></i> Auto-refresh</h5>
</div>

<div class="match-card mb-5 p-4">

<label class="form-label mb-3">Intervalo de atualização:</label>

<select class="form-select" id="autoRefresh"
onchange="setAutoRefresh(this.value); return false;">

<option value="30" ${config.autoRefresh == 30 ? 'selected' : ''}>⚡ 30 segundos</option>
<option value="60" ${config.autoRefresh == 60 ? 'selected' : ''}>1 minuto</option>
<option value="120" ${config.autoRefresh == 120 ? 'selected' : ''}>2 minutos ⭐</option>
<option value="300" ${config.autoRefresh == 300 ? 'selected' : ''}>5 minutos</option>
<option value="600" ${config.autoRefresh == 600 ? 'selected' : ''}>10 minutos</option>
<option value="0">❌ Desativado</option>

</select>

</div>

<div class="section-title">
<h5><i class="bi bi-info-circle-fill text-secondary"></i> Sobre</h5>
</div>

<div class="match-card text-center p-4">

<div class="mb-4">
<h4 class="text-white mb-2">CS2 Notifier</h4>
<p class="text-muted mb-1">Versão 1.0.0</p>
<p class="text-muted">✅ Tudo funcionando perfeitamente!</p>
</div>

<div class="d-flex gap-2 justify-content-center flex-wrap">

<button class="btn btn-outline-light btn-sm"
onclick="exportConfig(); return false;">
<i class="bi bi-download"></i> Exportar Config
</button>

<button class="btn btn-outline-light btn-sm"
onclick="resetConfig(); return false;">
<i class="bi bi-arrow-clockwise"></i> Resetar Tudo
</button>

<button class="btn btn-outline-light btn-sm"
onclick="window.open('https://github.com', '_blank'); return false;">
<i class="bi bi-github"></i> GitHub
</button>

</div>

</div>
`;


    document.querySelectorAll('.config-switch').forEach(input => {
        input.onchange = function () {
            saveConfig();
        };
    });
}



function saveConfig() {
    const config = JSON.parse(localStorage.getItem('cs2_config') || '{}');
    ['allMatches', 'onlySTier', 'liveStart', 'emailNotif', 'reduceMotion'].forEach(id => {
        const el = document.getElementById(id);
        if (el) config[id] = el.checked;
    });
    const autoRefresh = document.getElementById('autoRefresh')?.value;
    if (autoRefresh) config.autoRefresh = parseInt(autoRefresh);
    localStorage.setItem('cs2_config', JSON.stringify(config));
}

function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('cs2_theme', theme);

    // Atualizar botões de tema
    document.querySelectorAll('[onclick="setTheme"]').forEach(btn => {
        btn.classList.remove('active', 'btn-light');
        if (theme === 'light' && btn.textContent.includes('Claro')) {
            btn.classList.add('btn-light', 'active');
        } else if (theme === 'dark' && btn.textContent.includes('Escuro')) {
            btn.classList.add('active');
        }
    });

    showToast(`Tema ${theme === 'light' ? 'Claro' : 'Escuro'} ativado! ✨`);
}

function exportConfig() {
    const config = JSON.parse(localStorage.getItem('cs2_config') || '{}');
    const dataStr = JSON.stringify(config, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cs2-config.json';
    a.click();
    showToast('Config exportada!');
}

function resetConfig() {
    if (confirm('Resetar todas as configurações?')) {
        localStorage.removeItem('cs2_config');
        localStorage.removeItem('cs2_theme');
        localStorage.removeItem('cs2_autoRefresh');
        navigateToPage('config');
        showToast('Configurações resetadas!');
    }
}

function setAutoRefresh(seconds) {
    localStorage.setItem('cs2_autoRefresh', seconds);
    if (window.updateInterval) clearInterval(window.updateInterval);

    if (parseInt(seconds) > 0) {
        window.updateInterval = setInterval(loadMatches, seconds * 1000);
        showToast(`Auto - refresh: ${seconds} s`);
    } else {
        showToast('Auto-refresh desativado');
    }
}

function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            showToast(permission === 'granted' ? '✅ Notificações OK!' : '❌ Permissão negada');
        });
    }
}

function filterMatches(page) {

    if (page === 'live') {
        showLiveOnly();
        return;
    }

    if (page === 'upcoming') {
        showUpcomingOnly();
        return;
    }

    showAllMatches();
}