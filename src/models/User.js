const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class User {
  // Найти по Telegram ID
  static async findByTelegramId(telegramId) {
    return db('users').where({ telegram_id: telegramId }).first();
  }

  // Создать пользователя
  static async create(userData) {
    const [user] = await db('users')
      .insert({
        telegram_id: userData.telegram_id,
        username: userData.username || null,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        pin_code: userData.pin_code || null,
        role: userData.role || 'worker',
        is_active: true
      })
      .returning('*');
    
    return user;
  }

  // Все активные пользователи
  static async findAll() {
    return db('users')
      .where({ is_active: true })
      .select('id', 'telegram_id', 'username', 'first_name', 'last_name', 'role', 'created_at')
      .orderBy('created_at', 'desc');
  }

  // Обновить пользователя
  static async update(telegramId, updates) {
    updates.updated_at = new Date();
    
    await db('users')
      .where({ telegram_id: telegramId })
      .update(updates);
    
    return this.findByTelegramId(telegramId);
  }

  // Проверить PIN
  static async verifyPin(telegramId, pinCode) {
    const user = await db('users')
      .where({
        telegram_id: telegramId,
        pin_code: pinCode,
        is_active: true
      })
      .first();
    
    return !!user;
  }
}

module.exports = User;
