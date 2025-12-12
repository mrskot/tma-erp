-- Создаём базу данных если не существует
SELECT 'CREATE DATABASE tma_erp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'tma_erp')\gexec

-- Подключаемся к созданной БД
\c tma_erp

-- Создаём расширение для UUID если нужно
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
