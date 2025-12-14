const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Application {
  // Получить все заявки с данными участков и изделий
  static async findAll(limit = 100) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.type as product_type',
        'p.unit as product_unit'  // Убрали drawing_number, добавили type и unit
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
        'p.name as product_name',
        'p.type as product_type',
        'p.unit as product_unit',
        'p.inspection_time_minutes as product_inspection_time'
      )
      .where('a.id', id)
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

  // Создать заявку
  static async create(applicationData) {
    const [application] = await db('applications')
      .insert({
        application_number: applicationData.application_number,
        lot_id: applicationData.lot_id,
        product_id: applicationData.product_id,
        creator_telegram_id: applicationData.creator_telegram_id,
        status: applicationData.status || 'new',
        desired_inspection_time: applicationData.desired_inspection_time || null,
        quantity: applicationData.quantity || 1,
        batch_number: applicationData.batch_number || null,
        notes: applicationData.notes || null,
        otk_inspector_telegram_id: applicationData.otk_inspector_telegram_id || null,
        sla_response_minutes: applicationData.sla_response_minutes || null,
        sla_inspection_minutes: applicationData.sla_inspection_minutes || null,
        discrepancy_count: applicationData.discrepancy_count || 0,
        resolution_summary: applicationData.resolution_summary || '{"fixed": 0, "kr_pending": 0, "defect": 0, "political": 0}',
        bitrix24_id: applicationData.bitrix24_id || null,
        bitrix24_process_stage: applicationData.bitrix24_process_stage || null
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

  // Удалить заявку
  static async delete(id) {
    return db('applications').where({ id }).delete();
  }

  // Получить статистику по заявкам
  static async getStats() {
    const stats = await db('applications')
      .select(db.raw('COUNT(*) as total'))
      .select(db.raw('COUNT(CASE WHEN status = \'accepted\' THEN 1 END) as accepted'))
      .select(db.raw('COUNT(CASE WHEN status = \'rejected\' THEN 1 END) as rejected'))
      .select(db.raw('COUNT(CASE WHEN status = \'new\' THEN 1 END) as new'))
      .select(db.raw('COUNT(CASE WHEN status = \'in_progress\' THEN 1 END) as in_progress'))
      .first();
    
    return stats;
  }

  // Получить заявки для контролёра ОТК
  static async getForInspector(telegramId) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'l.priority_level as lot_priority',
        'l.distance_to_otk_meters as lot_distance',
        'p.name as product_name',
        'p.inspection_time_minutes as product_inspection_time'
      )
      .where('a.otk_inspector_telegram_id', telegramId)
      .whereIn('a.status', ['assigned_to_otk', 'in_progress'])
      .orderBy('l.priority_level', 'asc')
      .orderBy('a.created_at', 'asc');
  }

  // Получить необработанные заявки для назначения
  static async getUnassigned() {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'l.priority_level as lot_priority',
        'l.distance_to_otk_meters as lot_distance',
        'p.name as product_name',
        'p.inspection_time_minutes as product_inspection_time'
      )
      .where('a.status', 'new')
      .orderBy('l.priority_level', 'asc')
      .orderBy('a.created_at', 'asc');
  }

  // Обновить статистику несоответствий
  static async updateDiscrepancyStats(applicationId) {
    const stats = await db('discrepancies')
      .where('application_id', applicationId)
      .select(db.raw('COUNT(*) as total'))
      .select(db.raw('COUNT(CASE WHEN resolution_type = \'fixed\' THEN 1 END) as fixed'))
      .select(db.raw('COUNT(CASE WHEN resolution_type = \'kr_approved\' THEN 1 END) as kr_pending'))
      .select(db.raw('COUNT(CASE WHEN resolution_type = \'defect\' THEN 1 END) as defect'))
      .select(db.raw('COUNT(CASE WHEN resolution_type = \'political_close\' THEN 1 END) as political'))
      .first();
    
    await db('applications')
      .where('id', applicationId)
      .update({
        discrepancy_count: stats.total || 0,
        resolution_summary: {
          fixed: stats.fixed || 0,
          kr_pending: stats.kr_pending || 0,
          defect: stats.defect || 0,
          political: stats.political || 0
        }
      });
    
    return stats;
  }
}

module.exports = Application;