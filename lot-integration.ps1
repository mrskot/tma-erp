Write-Host "🚀 Интеграция модели Lot..." -ForegroundColor Cyan

# 1. Создаём файлы
Write-Host "`n1. Создание файлов модели, контроллера и роутов..." -ForegroundColor Yellow

# (Коды файлов выше)

Write-Host "   ✅ Файлы созданы" -ForegroundColor Green

# 2. Обновляем server.js
Write-Host "`n2. Обновление server.js..." -ForegroundColor Yellow
# (Код обновления выше)

Write-Host "   ✅ server.js обновлён" -ForegroundColor Green

# 3. Запускаем миграции
Write-Host "`n3. Запуск миграций..." -ForegroundColor Yellow
npx knex migrate:latest 2>$null

Write-Host "   ✅ Миграции выполнены" -ForegroundColor Green

# 4. Запускаем seed данные
Write-Host "`n4. Создание тестовых данных..." -ForegroundColor Yellow
npx knex seed:run --specific=002_lots.js 2>$null

Write-Host "   ✅ Тестовые данные созданы" -ForegroundColor Green

# 5. Перезапускаем сервер
Write-Host "`n5. Перезапуск сервера..." -ForegroundColor Yellow
$process = Get-Process node -ErrorAction SilentlyContinue
if ($process) { $process | Stop-Process -Force }
Start-Sleep -Seconds 1

# Запускаем в фоне
Start-Process node -ArgumentList "server.js" -WindowStyle Hidden
Start-Sleep -Seconds 3

# 6. Тестируем
Write-Host "`n6. Тестирование API..." -ForegroundColor Yellow
$endpoints = @(
    "/api/v1/lots",
    "/api/v1/lots/otk", 
    "/api/v1/lots/1"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000$endpoint" -Method GET -ErrorAction Stop
        Write-Host "   ✅ $endpoint" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $endpoint: $_" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Интеграция Lot завершена!" -ForegroundColor Green
Write-Host "📊 Доступные endpoints:" -ForegroundColor Cyan
Write-Host "   GET    /api/v1/lots" -ForegroundColor White
Write-Host "   GET    /api/v1/lots/otk" -ForegroundColor White
Write-Host "   GET    /api/v1/lots/:id" -ForegroundColor White
Write-Host "   GET    /api/v1/lots/:id/stats" -ForegroundColor White
Write-Host "   POST   /api/v1/lots" -ForegroundColor White
Write-Host "   PUT    /api/v1/lots/:id" -ForegroundColor White
Write-Host "   DELETE /api/v1/lots/:id" -ForegroundColor White
