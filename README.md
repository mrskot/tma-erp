# TMA-ERP - Система управления качеством производства

## Быстрый старт
```bash
# Клонировать репозиторий
git clone https://github.com/mrskot/tma-erp.git
cd tma-erp

# Установить зависимости
npm install

# Настроить окружение
cp .env.example .env
# отредактировать .env

# Запустить PostgreSQL (Docker)
docker-compose up -d

# Выполнить миграции
npm run migrate

# Заполнить тестовыми данными
npm run seed

# Запустить сервер
npm run dev