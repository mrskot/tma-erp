const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Lot {
  // Получить все участки
  static async findAll() {
    return db('lots')
      .select('*')
      .orderBy('priority_level', 'asc')
      .orderBy('name', 'asc');
  }

  // Найти участок по ID
  static async findById(id) {
    return db('lots').where({ id }).first();
  }

  // Найти участки по мастеру (основному или заместителю)
  static async findByManager(telegramId) {
    return db('lots')
      .where('manager_telegram_id', telegramId)
      .orWhere('substitute_telegram_id', telegramId)
      .orderBy('priority_level', 'asc');
  }

  // Создать участок
  static async create(lotData) {
    const [lot] = await db('lots')
      .insert({
        name: lotData.name,
        description: lotData.description || null,
        manager_telegram_id: lotData.manager_telegram_id,
        substitute_telegram_id: lotData.substitute_telegram_id || null,
        priority_level: lotData.priority_level || 3,
        distance_to_otk_meters: lotData.distance_to_otk_meters || null
      })
      .returning('*');
    
    return lot;
  }

  // Обновить участок
  static async update(id, updates) {
    updates.updated_at = new Date();
    
    await db('lots')
      .where({ id })
      .update(updates);
    
    return this.findById(id);
  }

  // Удалить участок
  static async delete(id) {
    return db('lots').where({ id }).delete();
  }

  // Получить участки с приоритетом для ОТК
  static async getForOTK() {
    return db('lots')
      .select('*')
      .orderBy('priority_level', 'asc')
      .orderBy('distance_to_otk_meters', 'asc');
  }

  // Назначить заместителя
  static async assignSubstitute(lotId, telegramId) {
    return db('lots')
      .where({ id: lotId })
      .update({
        substitute_telegram_id: telegramId,
        updated_at: new Date()
      });
  }

  // Статистика по участку
  static async getStats(lotId) {
    const lot = await this.findById(lotId);
    
    if (!lot) return null;
    
    // Позже добавим статистику по заявкам
    return {
      id: lot.id,
      name: lot.name,
      manager: lot.manager_telegram_id,
      substitute: lot.substitute_telegram_id,
      priority: lot.priority_level,
      distance_to_otk: lot.distance_to_otk_meters,
      created_at: lot.created_at,
      updated_at: lot.updated_at
    };
  }
}

module.exports = Lot;
