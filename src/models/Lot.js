const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Lot {
  // === CRUD ОПЕРАЦИИ ===
  
  // 1. Получить ВСЕ участки
  static async findAll(includeInactive = false) {
    const query = db('lots').select('*').orderBy('priority_level', 'asc').orderBy('name', 'asc');
    
    if (!includeInactive) {
      query.where('is_active', true);
    }
    
    return query;
  }
  
  // 2. Найти участок по ID
  static async findById(id) {
    return db('lots').where({ id }).first();
  }
  
  // 3. Найти участки по Telegram ID мастера (основного или заместителя)
  static async findByMaster(telegramId) {
    return db('lots')
      .where('manager_telegram_id', telegramId)
      .orWhere('deputy_manager_telegram_id', telegramId)
      .where('is_active', true)
      .orderBy('priority_level', 'asc');
  }
  
  // 4. Найти участки по приоритету
  static async findByPriority(priority) {
    return db('lots')
      .where('priority_level', priority)
      .where('is_active', true)
      .orderBy('name', 'asc');
  }
  
  // 5. Создать участок
  static async create(lotData) {
    const [lot] = await db('lots')
      .insert({
        name: lotData.name,
        description: lotData.description || null,
        manager_telegram_id: lotData.manager_telegram_id,
        deputy_manager_telegram_id: lotData.deputy_manager_telegram_id || null,
        priority_level: lotData.priority_level || 3,
        distance_to_otk_meters: lotData.distance_to_otk_meters || null,
        working_hours_start: lotData.working_hours_start || '08:00:00',
        working_hours_end: lotData.working_hours_end || '20:00:00',
        is_active: lotData.is_active !== undefined ? lotData.is_active : true,
        requires_urgent_attention: lotData.requires_urgent_attention || false,
        bitrix24_id: lotData.bitrix24_id || null,
        is_synced_with_bitrix24: lotData.is_synced_with_bitrix24 || false
      })
      .returning('*');
    
    return lot;
  }
  
  // 6. Обновить участок
  static async update(id, updates) {
    updates.updated_at = new Date();
    
    await db('lots')
      .where({ id })
      .update(updates);
    
    return this.findById(id);
  }
  
  // 7. Мягкое удаление (деактивация)
  static async delete(id) {
    return db('lots')
      .where({ id })
      .update({ 
        is_active: false, 
        updated_at: new Date(),
        requires_urgent_attention: false 
      });
  }
  
  // 8. Полное удаление (только для админов)
  static async hardDelete(id) {
    return db('lots').where({ id }).delete();
  }
  
  // === БИЗНЕС-ЛОГИКА ===
  
  // 9. Получить участки для ОТК (сортировка по приоритету и расстоянию)
  static async getForOTK() {
    return db('lots')
      .select('*')
      .where('is_active', true)
      .orderBy('priority_level', 'asc')
      .orderBy('distance_to_otk_meters', 'asc')
      .orderBy('requires_urgent_attention', 'desc');
  }
  
  // 10. Назначить заместителя
  static async assignDeputy(lotId, telegramId) {
    return db('lots')
      .where({ id: lotId })
      .update({
        deputy_manager_telegram_id: telegramId,
        updated_at: new Date()
      });
  }
  
  // 11. Снять заместителя
  static async removeDeputy(lotId) {
    return db('lots')
      .where({ id: lotId })
      .update({
        deputy_manager_telegram_id: null,
        updated_at: new Date()
      });
  }
  
  // 12. Получить статистику по участку
  static async getStats(lotId) {
    const lot = await this.findById(lotId);
    
    if (!lot) return null;
    
    // TODO: Добавить статистику по заявкам, несоответствиям
    return {
      basic_info: {
        id: lot.id,
        name: lot.name,
        description: lot.description,
        priority: lot.priority_level,
        distance_to_otk: lot.distance_to_otk_meters
      },
      management: {
        manager: lot.manager_telegram_id,
        deputy: lot.deputy_manager_telegram_id
      },
      schedule: {
        working_hours: `${lot.working_hours_start} - ${lot.working_hours_end}`,
        is_active: lot.is_active,
        requires_urgent_attention: lot.requires_urgent_attention
      },
      integration: {
        bitrix24_id: lot.bitrix24_id,
        is_synced: lot.is_synced_with_bitrix24
      },
      timestamps: {
        created: lot.created_at,
        updated: lot.updated_at
      }
    };
  }
  
  // 13. Получить участки, требующие срочного внимания
  static async getUrgentLots() {
    return db('lots')
      .select('*')
      .where('requires_urgent_attention', true)
      .where('is_active', true)
      .orderBy('priority_level', 'asc');
  }
}

module.exports = Lot;