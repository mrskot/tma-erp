#!/bin/bash
set -e

echo "🔧 Начинаем инициализацию базы данных TMA-ERP..."

# Ждём запуска PostgreSQL
sleep 5

# Создаём пользователя и базу
psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "postgres" <<-EOSQL
    -- Создаём пользователя tma_erp_user
    CREATE USER tma_erp_user WITH PASSWORD 'tma_erp_password';
    
    -- Создаём базу данных
    CREATE DATABASE tma_erp_dev OWNER tma_erp_user;
    
    -- Подключаемся к новой базе
    \c tma_erp_dev;
    
    -- Даём все права пользователю
    GRANT ALL PRIVILEGES ON DATABASE tma_erp_dev TO tma_erp_user;
    GRANT ALL ON SCHEMA public TO tma_erp_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tma_erp_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tma_erp_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO tma_erp_user;
    
    -- Включаем расширения
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Логируем успех
    DO \$\$ 
    BEGIN
        RAISE NOTICE '✅ База данных TMA-ERP успешно инициализирована!';
    END \$\$;
EOSQL

echo "✅ Инициализация завершена!"
echo "📊 Пользователь: tma_erp_user"
echo "🗄️  База данных: tma_erp_dev"
