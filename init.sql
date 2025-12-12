-- Инициализация базы данных TMA-ERP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создаем схему если нужно
-- CREATE SCHEMA IF NOT EXISTS tma_erp;
-- SET search_path TO tma_erp;

-- Логируем создание
DO $$ 
BEGIN
    RAISE NOTICE 'База данных TMA-ERP инициализирована: %', current_timestamp;
END $$;
