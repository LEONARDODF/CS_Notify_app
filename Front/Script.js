// Estado da aplicação
const appState = {
    favorites: JSON.parse(localStorage.getItem('cs2_favorites')) || [],
    notifications: JSON.parse(localStorage.getItem('cs2_notifications')) || []
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initFavorites();
    initNotifications();
    initModal();
    updateFavoritesDisplay();
});

// Navegação
function initNavigation() {
    // Top navigation
    const topNavLinks = document.querySelectorAll('.nav-tabs-custom .nav-link');
    topNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');

            topNavLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            navigateToPage(page);
        });
    });

    // Bottom navigation
    const bottomNavLinks = document.querySelectorAll('.bottom-nav .nav-item[data-page]');
    bottomNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');

            bottomNavLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            navigateToPage(page);
        });
    });
}

function navigateToPage(page) {
    const matchesSection = document.getElementById('matches-section');
    const favoritesSection = document.getElementById('favorites-section');

    // Esconder todas as seções
    matchesSection.style.display = 'none';
    favoritesSection.style.display = 'none';

    switch(page) {
        case 'matches':
            matchesSection.style.display = 'block';
            showAllMatches();
            break;
        case 'live':
            matchesSection.style.display = 'block';
            filterMatches('live');
            break;
        case 'upcoming':
            matchesSection.style.display = 'block';
            filterMatches('upcoming');
            break;
        case 'favorites':
            favoritesSection.style.display = 'block';
            updateFavoritesDisplay();
            break;
        case 'notifications':
            showNotifications();
            break;
        case 'config':
            showConfig();
            break;
    }
}

function showAllMatches() {
    const allCards = document.querySelectorAll('.match-card');
    allCards.forEach(card => card.style.display = 'block');
}

function filterMatches(type) {
    const allCards = document.querySelectorAll('.match-card');

    allCards.forEach(card => {
        if (type === 'live' && card.classList.contains('live-match')) {
            card.style.display = 'block';
        } else if (type === 'upcoming' && !card.classList.contains('live-match')) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Sistema de Favoritos
function initFavorites() {
    const favoriteButtons = document.querySelectorAll('.btn-favorite');

    favoriteButtons.forEach(button => {
        const team = button.getAttribute('data-team');

        // Verificar se já está nos favoritos
        if (appState.favorites.includes(team)) {
            button.classList.add('active');
            button.innerHTML = '<i class="bi bi-star-fill"></i>';
        }

        button.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFavorite(team, button);
        });
    });
}

function toggleFavorite(team, button) {
    const index = appState.favorites.indexOf(team);

    if (index === -1) {
        // Adicionar aos favoritos
        appState.favorites.push(team);
        button.classList.add('active');
        button.innerHTML = '<i class="bi bi-star-fill"></i>';
        showToast(`${team} adicionado aos favoritos! ⭐`);
    } else {
        // Remover dos favoritos
        appState.favorites.splice(index, 1);
        button.classList.remove('active');
        button.innerHTML = '<i class="bi bi-star"></i>';
        showToast(`${team} removido dos favoritos`);
    }

    // Salvar no localStorage
    localStorage.setItem('cs2_favorites', JSON.stringify(appState.favorites));

    // Atualizar display de favoritos
    updateFavoritesDisplay();
}

function updateFavoritesDisplay() {
    const favoritesList = document.getElementById('favorites-list');
    const favoritesEmpty = document.querySelector('.favorites-empty');

    if (!favoritesList) return;

    if (appState.favorites.length === 0) {
        favoritesEmpty.style.display = 'block';
        favoritesList.innerHTML = '';
        return;
    }

    favoritesEmpty.style.display = 'none';

    favoritesList.innerHTML = appState.favorites.map(team => `
        <div class="favorite-team">
            <div class="team-info">
                <div class="team-logo">${team.charAt(0)}</div>
                <div>
                    <div class="team-name">${team}</div>
                    <small class="text-muted">Recebendo notificações</small>
                </div>
            </div>
            <button class="btn-remove" onclick="removeFavorite('${team}')">
                <i class="bi bi-trash"></i> Remover
            </button>
        </div>
    `).join('');
}

function removeFavorite(team) {
    const index = appState.favorites.indexOf(team);
    if (index !== -1) {
        appState.favorites.splice(index, 1);
        localStorage.setItem('cs2_favorites', JSON.stringify(appState.favorites));
        updateFavoritesDisplay();

        // Atualizar botões de favorito
        const buttons = document.querySelectorAll(`.btn-favorite[data-team="${team}"]`);
        buttons.forEach(button => {
            button.classList.remove('active');
            button.innerHTML = '<i class="bi bi-star"></i>';
        });

        showToast(`${team} removido dos favoritos`);
    }
}

// Sistema de Notificações
function initNotifications() {
    const notifyButtons = document.querySelectorAll('.btn-notify');

    notifyButtons.forEach(button => {
        const matchId = button.getAttribute('data-match');

        // Verificar se já está ativado
        if (appState.notifications.includes(matchId)) {
            button.classList.add('active');
            button.innerHTML = '<i class="bi bi-bell-fill"></i> Ativado';
        }

        button.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleNotification(matchId, button);
        });
    });
}

function toggleNotification(matchId, button) {
    const index = appState.notifications.indexOf(matchId);

    if (index === -1) {
        // Ativar notificação
        appState.notifications.push(matchId);
        button.classList.add('active');
        button.innerHTML = '<i class="bi bi-bell-fill"></i> Ativado';
        showToast('Notificação ativada! 🔔');

        // Simular permissão de notificação
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    } else {
        // Desativar notificação
        appState.notifications.splice(index, 1);
        button.classList.remove('active');
        button.innerHTML = '<i class="bi bi-bell"></i> Notificar';
        showToast('Notificação desativada');
    }

    // Salvar no localStorage
    localStorage.setItem('cs2_notifications', JSON.stringify(appState.notifications));
}

function showNotifications() {
    const matchesSection = document.getElementById('matches-section');
    matchesSection.style.display = 'block';

    matchesSection.innerHTML = `
        <div class="section-title">
            <h3><i class="bi bi-bell-fill"></i> Configurar Notificações</h3>
        </div>
        <div class="match-card">
            <div class="match-header">
                <h5>Notificações Push</h5>
            </div>
            <div class="match-body">
                <p class="text-muted">Receba alertas quando suas partidas favoritas começarem</p>
            </div>
            <div class="match-footer">
                <button class="btn-notify active" onclick="requestNotificationPermission()">
                    <i class="bi bi-bell-fill"></i> ${appState.notifications.length} partidas ativas
                </button>
            </div>
        </div>

        <div class="section-title mt-4">
            <h3><i class="bi bi-clock-history"></i> Tempo de Antecedência</h3>
        </div>
        <div class="match-card">
            <div class="match-body">
                <p class="text-muted">Receba notificação antes da partida começar</p>
                <select class="form-select bg-dark text-white" onchange="updateNotificationTime(this.value)">
                    <option value="5">5 minutos antes</option>
                    <option value="15">15 minutos antes</option>
                    <option value="30" selected>30 minutos antes</option>
                    <option value="60">1 hora antes</option>
                </select>
            </div>
        </div>
    `;
}

function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notificações ativadas! 🔔');
            } else {
                showToast('Permissão de notificação negada');
            }
        });
    } else {
        showToast('Seu navegador não suporta notificações');
    }
}

function updateNotificationTime(minutes) {
    showToast(`Antecedência configurada para ${minutes} minutos`);
}

function showConfig() {
    const matchesSection = document.getElementById('matches-section');
    matchesSection.style.display = 'block';

    matchesSection.innerHTML = `
        <div class="section-title">
            <h3><i class="bi bi-gear-fill"></i> Configurações</h3>
        </div>

        <div class="match-card">
            <div class="match-header">
                <h5>Notificações</h5>
            </div>
            <div class="match-body d-flex justify-content-between align-items-center">
                <div>
                    <p class="mb-1">Todas as Partidas</p>
                    <small class="text-muted">Receber notificações de todas as partidas</small>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="allMatches" checked>
                </div>
            </div>
        </div>

        <div class="match-card">
            <div class="match-body d-flex justify-content-between align-items-center">
                <div>
                    <p class="mb-1">Apenas S-Tier</p>
                    <small class="text-muted">Somente campeonatos principais</small>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="onlySTier">
                </div>
            </div>
        </div>

        <div class="match-card">
            <div class="match-body d-flex justify-content-between align-items-center">
                <div>
                    <p class="mb-1">Início das Lives</p>
                    <small class="text-muted">Notificar quando a partida começar</small>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="liveStart" checked>
                </div>
            </div>
        </div>

        <div class="match-card">
            <div class="match-body d-flex justify-content-between align-items-center">
                <div>
                    <p class="mb-1">E-mail</p>
                    <small class="text-muted">Receber notificações por e-mail</small>
                </div>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="emailNotif" checked>
                </div>
            </div>
        </div>

        <div class="section-title mt-4">
            <h3><i class="bi bi-palette-fill"></i> Aparência</h3>
        </div>

        <div class="match-card">
            <div class="match-body">
                <p class="mb-3">Tema</p>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-light flex-fill active">
                        <i class="bi bi-moon-fill"></i> Escuro
                    </button>
                    <button class="btn btn-outline-light flex-fill" disabled>
                        <i class="bi bi-sun-fill"></i> Claro
                    </button>
                </div>
            </div>
        </div>

        <div class="section-title mt-4">
            <h3><i class="bi bi-info-circle-fill"></i> Sobre</h3>
        </div>

        <div class="match-card">
            <div class="match-body text-center">
                <h4 class="mb-3">CS2 Notifier</h4>
                <p class="text-muted">Versão 1.0.0</p>
                <p class="text-muted mb-3">Nunca perca uma partida do seu time favorito</p>
                <button class="btn btn-outline-light">
                    <i class="bi bi-github"></i> GitHub
                </button>
            </div>
        </div>
    `;

    // Adicionar event listeners aos switches
    document.querySelectorAll('.form-check-input').forEach(input => {
        input.addEventListener('change', function() {
            const label = this.parentElement.previousElementSibling.querySelector('p').textContent;
            showToast(`${label}: ${this.checked ? 'Ativado' : 'Desativado'}`);
        });
    });
}

// Modal
function initModal() {
    const addBtn = document.getElementById('add-btn');
    const modal = new bootstrap.Modal(document.getElementById('addTeamModal'));

    addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.show();
    });

    // Team suggestions
    const teamSuggestions = document.querySelectorAll('.team-suggestion');
    teamSuggestions.forEach(suggestion => {
        suggestion.addEventListener('click', function() {
            const team = this.getAttribute('data-team');

            if (!appState.favorites.includes(team)) {
                appState.favorites.push(team);
                localStorage.setItem('cs2_favorites', JSON.stringify(appState.favorites));
                showToast(`${team} adicionado aos favoritos! ⭐`);
                updateFavoritesDisplay();

                // Atualizar botões de favorito
                const buttons = document.querySelectorAll(`.btn-favorite[data-team="${team}"]`);
                buttons.forEach(button => {
                    button.classList.add('active');
                    button.innerHTML = '<i class="bi bi-star-fill"></i>';
                });
            } else {
                showToast(`${team} já está nos favoritos`);
            }

            modal.hide();
        });
    });

    // Search functionality
    const searchInput = document.getElementById('teamSearch');
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        teamSuggestions.forEach(suggestion => {
            const teamName = suggestion.textContent.toLowerCase();
            suggestion.style.display = teamName.includes(query) ? 'flex' : 'none';
        });
    });
}

// Toast notifications
function showToast(message) {
    // Remover toast anterior se existir
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #ff6b35 0%, #ff8c61 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        font-weight: 600;
        font-size: 0.9rem;
        z-index: 10000;
        box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
        animation: slideDown 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }

    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }

    .form-check-input:checked {
        background-color: #ff6b35;
        border-color: #ff6b35;
    }

    .form-check-input:focus {
        border-color: #ff6b35;
        box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
    }
`;
document.head.appendChild(style);

// Atualizar contagem de partidas ao vivo
function updateLiveCount() {
    const liveMatches = document.querySelectorAll('.live-match').length;
    const liveCountElement = document.querySelector('.live-count');
    if (liveCountElement) {
        liveCountElement.textContent = liveMatches;
    }
}

updateLiveCount();