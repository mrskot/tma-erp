const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

const fakeTelegramAuth = require('./src/middleware/fakeTelegramAuth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fakeTelegramAuth);

// Статические файлы (ВСЕГДА ПЕРВЫМИ!)
app.use(express.static(path.join(__dirname, "public")));

// Импорт API роутов
const userRoutes = require("./src/routes/userRoutes");
const lotRoutes = require("./src/routes/lotRoutes");
const productRoutes = require("./src/routes/productRoutes");
const applicationRoutes = require("./src/routes/applicationRoutes");
const discrepancyRoutes = require("./src/routes/discrepancyRoutes");

// API Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/lots", lotRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/discrepancies", discrepancyRoutes);

// Health check
app.get("/api/v1/health", (req, res) => {
  res.json({
    success: true,
    message: "TMA-ERP API работает",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      name: process.env.DB_NAME,
      status: "connected",
    },
    endpoints: {
      users: "/api/v1/users",
      lots: "/api/v1/lots",
      products: "/api/v1/products",
      applications: "/api/v1/applications",
      discrepancies: "/api/v1/discrepancies",
      health: "/api/v1/health",
    },
  });
});

// Главная страница
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Админ-панель
app.get("/admin", (req, res) => {
  const adminPath = path.join(__dirname, "public/admin/index.html");
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send(`
      <h1>Админ-панель не найдена</h1>
      <p>Файл index.html в папке admin не существует</p>
      <a href="/">На главную</a>
    `);
  }
});

// Страницы админки
app.get("/admin/:page", (req, res) => {
  const page = req.params.page;
  const allowedPages = ["users", "lots", "products", "applications", "discrepancies"];
  
  if (allowedPages.includes(page)) {
    const filePath = path.join(__dirname, `public/admin/${page}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send(`
        <h1>Страница не найдена</h1>
        <p>Файл ${page}.html не существует</p>
        <a href="/admin">Вернуться в админку</a>
      `);
    }
  } else {
    res.status(404).send(`
      <h1>Страница не найдена</h1>
      <p>Страница /admin/${page} не существует</p>
      <p>Доступные страницы: ${allowedPages.join(", ")}</p>
      <a href="/admin">Вернуться в админку</a>
    `);
  }
});

// Welcome page (старая версия)
app.get("/welcome", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TMA-ERP System</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .endpoint { background: #e8f5e8; padding: 10px; margin: 5px 0; border-left: 4px solid #4CAF50; }
        code { background: #eee; padding: 2px 5px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 TMA-ERP System</h1>
        <p>Система управления качеством производства</p>
        
        <div class="card">
          <h2>📊 Статус системы</h2>
          <p>API: <a href="/api/v1/health">/api/v1/health</a></p>
          <p>База данных: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}</p>
          <p>Режим: ${process.env.NODE_ENV}</p>
          <p>Интерфейсы: 
            <a href="/">Главная</a>, 
            <a href="/admin">Админка</a>
          </p>
        </div>
        
        <div class="card">
          <h2>🔧 Доступные API endpoints</h2>
          <div class="endpoint">
            <code>GET /api/v1/health</code> - Проверка работы API
          </div>
          <div class="endpoint">
            <code>GET /api/v1/users</code> - Пользователи
          </div>
          <div class="endpoint">
            <code>GET /api/v1/lots</code> - Участки
          </div>
          <div class="endpoint">
            <code>GET /api/v1/products</code> - Изделия
          </div>
          <div class="endpoint">
            <code>GET /api/v1/applications</code> - Заявки на приёмку
          </div>
          <div class="endpoint">
            <code>GET /api/v1/discrepancies</code> - Несоответствия
          </div>
          <div class="endpoint">
            <code>GET /api/v1/lots/otk</code> - Участки для ОТК (сортировка)
          </div>
        </div>
        
        <div class="card">
          <h2>🚀 Быстрый старт</h2>
          <p><a href="/admin">Перейти в админ-панель</a> для управления системой</p>
          <p><a href="/api/v1/users">Проверить пользователей</a> через API</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// 404 handler для API
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({
      success: false,
      error: "Маршрут не найден",
      available_routes: [
        "GET /api/v1/health",
        "GET /api/v1/users",
        "GET /api/v1/lots",
        "GET /api/v1/products",
        "GET /api/v1/applications",
        "GET /api/v1/discrepancies",
        "GET /api/v1/lots/otk",
      ],
    });
  } else {
    next(); // Передаем дальше для обработки статикой
  }
});

// 404 handler для HTML
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Страница не найдена</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 40px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          color: white;
          text-align: center;
        }
        .container {
          max-width: 600px;
          margin: 100px auto;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 48px; margin-bottom: 20px; }
        p { font-size: 18px; margin-bottom: 30px; }
        .links { display: flex; gap: 15px; justify-content: center; }
        .btn {
          display: inline-block;
          padding: 12px 25px;
          background: white;
          color: #667eea;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404</h1>
        <p>Страница <strong>${req.path}</strong> не найдена</p>
        <div class="links">
          <a href="/" class="btn">🏠 На главную</a>
          <a href="/admin" class="btn">👨‍💼 В админку</a>
          <a href="/api/v1/health" class="btn">🔧 Проверить API</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 TMA-ERP запущен!`);
  console.log(`📡 Порт: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🌐 Админка: http://localhost:${PORT}/admin`);
  console.log(`🔧 Режим: ${process.env.NODE_ENV || "development"}`);
  console.log(`🗄️  База: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  console.log(`📊 API: http://localhost:${PORT}/api/v1/health`);
  console.log(`🕐 ${new Date().toLocaleString("ru-RU")}`);
});