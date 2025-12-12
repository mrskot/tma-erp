// Общие функции для админ-панели
async function loadAdminStats() {
    try {
        const stats = await Promise.all([
            fetch('/api/v1/users').then(r => r.json()),
            fetch('/api/v1/lots').then(r => r.json()),
            fetch('/api/v1/products').then(r => r.json()),
            fetch('/api/v1/applications').then(r => r.json()),
            fetch('/api/v1/discrepancies?status=in_resolution').then(r => r.json())
        ]);

        if (stats[0].success) document.getElementById('stat-users').textContent = stats[0].count;
        if (stats[1].success) document.getElementById('stat-lots').textContent = stats[1].count;
        if (stats[2].success) document.getElementById('stat-products').textContent = stats[2].count;
        if (stats[3].success) document.getElementById('stat-applications').textContent = stats[3].count;
        if (stats[4].success) document.getElementById('stat-discrepancies').textContent = stats[4].count;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Модальные окна
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU');
}

// Перевод ролей
function translateRole(role) {
    const roles = {
        'worker': 'Рабочий',
        'master': 'Мастер',
        'otk_inspector': 'Контролёр ОТК',
        'admin': 'Администратор',
        'quality_director': 'Директор качества',
        'super_admin': 'Супер-админ'
    };
    return roles[role] || role;
}

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Стили для уведомлений
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    z-index: 1000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-width: 300px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
}

.notification-success {
    background: #40c057;
}

.notification-error {
    background: #fa5252;
}

.notification-warning {
    background: #fab005;
}

.notification button {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    margin-left: 15px;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;
document.head.appendChild(style);

// Загрузка данных при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('stat-users')) {
        loadAdminStats();
    }
});

// Экспортируем функции
window.showModal = showModal;
window.closeModal = closeModal;
window.formatDate = formatDate;
window.translateRole = translateRole;
window.showNotification = showNotification;