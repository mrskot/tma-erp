const path = require('path');
require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5433,  // ПОРТ 5433!
      database: process.env.DB_NAME || 'tma_erp',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password123'
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.join(__dirname, 'seeds')
    }
  }
};
