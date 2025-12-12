// Конфигурация
const API_BASE_URL = '/api/v1';

// Загрузка статистики при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Проверка API
        const healthRes = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthRes.json();
        document.getElementById('api-status').innerHTML = '✅ Работает';
        document.getElementById('api-status').style.color = '#40c057';

        // Загрузка счетчиков
        await loadCounters();
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        document.getElementById('api-status').innerHTML = '❌ Ошибка';
        document.getElementById('api-status').style.color = '#fa5252';
    }
});

// Загрузка счетчиков
async function loadCounters() {
    try {
        // Пользователи
        const usersRes = await fetch(`${API_BASE_URL}/users`);
        const usersData = await usersRes.json();
        if (usersData.success) {
            document.getElementById('users-count').textContent = `${usersData.count} пользователей`;
        }

        // Участки
        const lotsRes = await fetch(`${API_BASE_URL}/lots`);
        const lotsData = await lotsRes.json();
        if (lotsData.success) {
            document.getElementById('lots-count').textContent = `${lotsData.count} участков`;
        }

        // Изделия
        const productsRes = await fetch(`${API_BASE_URL}/products`);
        const productsData = await productsRes.json();
        if (productsData.success) {
            document.getElementById('products-count').textContent = `${productsData.count} изделий`;
        }

        // Заявки
        const applicationsRes = await fetch(`${API_BASE_URL}/applications`);
        const applicationsData = await applicationsRes.json();
        if (applicationsData.success) {
            document.getElementById('applications-count').textContent = `${applicationsData.count} заявок`;
        }
    } catch (error) {
        console.error('Ошибка при загрузке счетчиков:', error);
    }
}

// Функции быстрых действий
function createApplication() {
    alert('Функция создания заявки в разработке');
    // Откроем модальное окно для создания заявки
}

function viewDiscrepancies() {
    window.open(`${API_BASE_URL}/discrepancies`, '_blank');
}

function openStats() {
    alert('Функция статистики в разработке');
}

// Утилиты для работы с API
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        return { success: false, error: error.message };
    }
}

// Экспортируем для использования в других файлах
window.apiRequest = apiRequest;
window.API_BASE_URL = API_BASE_URL;