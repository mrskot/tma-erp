const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Application {
  // ================ ГЕНЕРАЦИЯ И ПОИСК ================

  // Генерация номера заявки
  static async generateApplicationNumber() {
    const count = await db('applications')
      .count('id as count')
      .first();
    
    const nextId = 100000 + (parseInt(count.count) + 1);
    return `TMA-${nextId}`;
  }

  // Получить все заявки с данными участков и изделий
  static async findAll(limit = 100) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'l.manager_telegram_id as lot_manager',
        'l.priority_level as lot_priority',
        'p.name as product_name',
        'p.type as product_type',
        'p.unit as product_unit',
        'p.checklist_text as product_checklist',
        'p.inspection_time_minutes as product_inspection_time'
      )
      .orderBy('a.created_at', 'desc')
      .limit(limit);
  }

  // Найти заявку по ID с полными данными
  static async findById(id) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'l.manager_telegram_id as lot_manager',
        'l.priority_level as lot_priority',
        'l.distance_to_otk_meters as lot_distance',
        'p.name as product_name',
        'p.type as product_type',
        'p.unit as product_unit',
        'p.inspection_time_minutes as product_inspection_time',
        'p.checklist_text as product_checklist'
      )
      .where('a.id', id)
      .first();
  }

  // Найти заявку по номеру
  static async findByNumber(applicationNumber) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'l.manager_telegram_id as lot_manager',
        'p.name as product_name',
        'p.type as product_type',
        'p.unit as product_unit'
      )
      .where('a.application_number', applicationNumber)
      .first();
  }

  // Найти заявки по статусу
  static async findByStatus(status) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('a.status', status)
      .orderBy('a.created_at', 'desc');
  }

  // Найти заявки по Telegram ID создателя
  static async findByCreator(telegramId, limit = 50) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('a.creator_telegram_id', telegramId)
      .orderBy('a.created_at', 'desc')
      .limit(limit);
  }

  // Найти заявки по участку
  static async findByLot(lotId, limit = 50) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('a.lot_id', lotId)
      .orderBy('a.created_at', 'desc')
      .limit(limit);
  }

  // Найти заявки по изделию
  static async findByProduct(productId, limit = 50) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('a.product_id', productId)
      .orderBy('a.created_at', 'desc')
      .limit(limit);
  }

  // ================ CRUD ОПЕРАЦИИ ================

  // Создать заявку
  static async create(applicationData) {
    const [application] = await db('applications')
      .insert({
        application_number: applicationData.application_number,
        lot_id: applicationData.lot_id,
        product_id: applicationData.product_id,
        creator_telegram_id: applicationData.creator_telegram_id,
        drawing_number: applicationData.drawing_number || null,
        product_serial_number: applicationData.product_serial_number || null,
        transformer_type: applicationData.transformer_type || null,
        status: applicationData.status || 'new',
        desired_inspection_time: applicationData.desired_inspection_time || null,
        quantity: applicationData.quantity || 1,
        batch_number: applicationData.batch_number || null,
        notes: applicationData.notes || null,
        otk_inspector_telegram_id: applicationData.otk_inspector_telegram_id || null,
        has_mki_photos: applicationData.has_mki_photos || false,
        mki_photo_ids: applicationData.mki_photo_ids || '[]'
      })
      .returning('*');
    
    return application;
  }

  // Обновить заявку
  static async update(id, updates) {
    updates.updated_at = new Date();
    
    await db('applications')
      .where({ id })
      .update(updates);
    
    return this.findById(id);
  }

  // Удалить заявку из БД (хард делет)
  static async hardDelete(id) {
    return db('applications').where({ id }).delete();
  }

  // ================ БИЗНЕС-ЛОГИКА ================

  // Получить новые заявки для ОТК
  static async getNewForOTK() {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'l.priority_level as lot_priority',
        'p.name as product_name'
      )
      .where('a.status', 'new')
      .orderBy('l.priority_level', 'asc')
      .orderBy('a.created_at', 'asc');
  }

  // Получить заявки для конкретного контролёра ОТК
  static async getForInspector(telegramId, status = null) {
    let query = db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name'
      )
      .where('a.otk_inspector_telegram_id', telegramId);
    
    if (status) {
      query = query.where('a.status', status);
    }
    
    return query.orderBy('a.created_at', 'desc');
  }

  // ================ СТАТИСТИКА ================

  // Получить статистику по заявкам
  static async getStats() {
    const stats = await db('applications')
      .select(db.raw('COUNT(*) as total'))
      .select(db.raw('SUM(CASE WHEN status = \'accepted\' THEN 1 END) as accepted'))
      .select(db.raw('SUM(CASE WHEN status = \'rejected\' THEN 1 END) as rejected'))
      .select(db.raw('SUM(CASE WHEN status = \'new\' THEN 1 END) as new'))
      .select(db.raw('SUM(CASE WHEN status = \'in_progress\' THEN 1 END) as in_progress'))
      .select(db.raw('SUM(CASE WHEN status = \'assigned_to_otk\' THEN 1 END) as assigned'))
      .select(db.raw('SUM(CASE WHEN is_synced_with_bitrix24 = true THEN 1 END) as synced'))
      .first();
    
    return {
      total: parseInt(stats.total) || 0,
      accepted: parseInt(stats.accepted) || 0,
      rejected: parseInt(stats.rejected) || 0,
      new: parseInt(stats.new) || 0,
      in_progress: parseInt(stats.in_progress) || 0,
      assigned: parseInt(stats.assigned) || 0,
      synced: parseInt(stats.synced) || 0
    };
  }

  // ================ ИНТЕГРАЦИЯ ================

  // Обновить статус синхронизации
  static async updateSyncStatus(id, status, bitrixId = null, error = null) {
    const updates = {
      sync_status: status,
      updated_at: new Date()
    };
    
    if (bitrixId) {
      updates.bitrix24_id = bitrixId;
      updates.is_synced_with_bitrix24 = true;
    }
    
    if (error) {
      updates.sync_error = error;
    }
    
    await db('applications')
      .where({ id })
      .update(updates);
    
    return this.findById(id);
  }

  // Добавить задачу в очередь синхронизации
  static async addToSyncQueue(entityType, entityId, operation, payload, targetSystem = 'bitrix24') {
    try {
      await db('sync_queue').insert({
        entity_type: entityType,
        entity_id: entityId,
        operation: operation,
        payload: JSON.stringify(payload),
        target_system: targetSystem,
        status: 'pending',
        created_at: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Ошибка добавления в очередь:', error);
      return false;
    }
  }
  static async getSyncStats() {
      const stats = await db('applications')
        .select(
          db.raw('COUNT(*) as total'),
          db.raw('SUM(CASE WHEN is_synced_with_bitrix24 = true THEN 1 ELSE 0 END) as synced'),
          db.raw('SUM(CASE WHEN sync_status = ? THEN 1 ELSE 0 END) as pending', ['pending']),
          db.raw('SUM(CASE WHEN sync_status = ? THEN 1 ELSE 0 END) as failed', ['failed'])
        )
        .first();
      
      return {
        total: parseInt(stats.total) || 0,
        synced: parseInt(stats.synced) || 0,
        pending: parseInt(stats.pending) || 0,
        failed: parseInt(stats.failed) || 0
      };
    }

}

module.exports = Application;