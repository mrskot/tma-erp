// src/middleware/fakeTelegramAuth.js
module.exports = function fakeTelegramAuth(req, res, next) {
    console.log(`[AUTH] ${req.method} ${req.path}`);
    
    // ========== ПУБЛИЧНЫЕ ПУТИ (пропускаем без проверки) ==========
    const publicPaths = [
        // Статика
        '/telegram-simulator.html',
        '/admin/master.html',
        '/admin/applications.html',
        '/admin/otk.html',
        '/uploads/',
        '/css/',
        '/js/',
        '/favicon.ico',
        
        // API публичные (GET запросы)
        '/api/v1/lots',           // GET участки
        '/api/v1/products',       // GET продукты
        '/api/v1/applications',   // GET заявки
        '/api/v1/users',          // GET пользователи
        '/api/v1/stats',          // GET статистика
        
        // Вебхуки
        '/api/v1/bitrix/webhook',
        
        // Тестовые
        '/api/v1/test',
        '/api/v1/debug'
    ];
    
    // Проверяем публичный ли путь
    const isPublicPath = publicPaths.some(path => 
        req.path === path || 
        req.path.startsWith(path + '/')
    );
    
    // Особое правило: GET запросы на API пропускаем
    const isGetApi = req.method === 'GET' && req.path.startsWith('/api/v1/');
    
    if (isPublicPath || isGetApi) {
        console.log(`[AUTH] Пропускаем: ${req.method} ${req.path}`);
        
        // Пробуем установить пользователя если есть заголовок
        if (req.headers['x-fake-telegram-user']) {
            try {
                req.user = JSON.parse(req.headers['x-fake-telegram-user']);
                console.log(`[AUTH] Пользователь из заголовка: ${req.user.username}`);
            } catch (e) {
                // игнорируем
            }
        }
        
        return next();
    }
    
    // ========== ЗАЩИЩЕННЫЕ ПУТИ (POST/PUT/DELETE) ==========
    if (req.path.startsWith('/api/v1/')) {
        const fakeUserHeader = req.headers['x-fake-telegram-user'];
        
        if (fakeUserHeader) {
            try {
                req.user = JSON.parse(fakeUserHeader);
                console.log(`[AUTH] Авторизован: ${req.user.username || req.user.id} (${req.user.role})`);
                return next();
            } catch (error) {
                console.error('[AUTH] Ошибка парсинга заголовка:', error);
            }
        }
        
        // Для POST /applications пробуем из body
        if (req.path === '/api/v1/applications' && req.method === 'POST') {
            console.log('[AUTH] Пробуем получить creator_telegram_id из body');
            // Express body-parser уже должен был распарсить
            if (req.body && req.body.creator_telegram_id) {
                req.user = {
                    telegram_id: req.body.creator_telegram_id,
                    role: 'master'
                };
                console.log(`[AUTH] Авторизован через body: ${req.body.creator_telegram_id}`);
                return next();
            }
        }
        
        // Нет авторизации
        console.log(`[AUTH] 401 для: ${req.method} ${req.path}`);
        console.log('[AUTH] Заголовки:', Object.keys(req.headers));
        console.log('[AUTH] Body:', req.body);
        
        return res.status(401).json({
            success: false,
            error: 'Требуется авторизация',
            details: `Для ${req.method} ${req.path} нужен заголовок X-Fake-Telegram-User`,
            example_header: 'X-Fake-Telegram-User: {"id":"1001","role":"master"}'
        });
    }
    
    // Для всего остального (HTML страниц) пропускаем
    next();
};