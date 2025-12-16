const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Discrepancy {
  // Получить все несоответствия с данными заявок и изделий
  static async findAll(limit = 100) {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'p.name as product_name',
        'p.type as product_type'
      )
      .orderBy('d.created_at', 'desc')
      .limit(limit);
  }

  // Найти несоответствие по ID
  static async findById(id) {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'a.lot_id',
        'a.creator_telegram_id',
        'p.name as product_name',
        'p.type as product_type',
        'p.unit as product_unit'
      )
      .where('d.id', id)
      .first();
  }

  // Найти несоответствия по статусу
  static async findByStatus(status, limit = 50) {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('d.status', status)
      .orderBy('d.created_at', 'desc')
      .limit(limit);
  }

  // Найти несоответствия по ответственному мастеру
  static async findByMaster(telegramId, limit = 50) {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('d.responsible_master_telegram_id', telegramId)
      .orderBy('d.created_at', 'desc')
      .limit(limit);
  }

  // Найти несоответствия по заявке
  static async findByApplication(applicationId) {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('d.application_id', applicationId)
      .orderBy('d.created_at', 'asc');
  }

  // Создать несоответствие
  static async create(discrepancyData) {
    const [discrepancy] = await db('discrepancies')
      .insert({
        application_id: discrepancyData.application_id,
        discrepancy_number: discrepancyData.discrepancy_number,
        description: discrepancyData.description,
        type: discrepancyData.type || 'fix',
        responsible_master_telegram_id: discrepancyData.responsible_master_telegram_id,
        defect_code: discrepancyData.defect_code || null,
        defect_category: discrepancyData.defect_category || null,
        defect_type_code: discrepancyData.defect_type_code || null,
        defect_cause: discrepancyData.defect_cause || null,
        defect_severity: discrepancyData.defect_severity || null,
        status: discrepancyData.status || 'new',
        resolution_type: discrepancyData.resolution_type || null,
        resolution_notes: discrepancyData.resolution_notes || null,
        location_in_product: discrepancyData.location_in_product || null,
        photo_urls: discrepancyData.photo_urls || null,
        priority: discrepancyData.priority || 3
      })
      .returning('*');
    
    return discrepancy;
  }

  // Обновить несоответствие
  static async update(id, updates) {
    updates.updated_at = new Date();
    
    await db('discrepancies')
      .where({ id })
      .update(updates);
    
    return this.findById(id);
  }

  // Удалить несоответствие
  static async delete(id) {
    return db('discrepancies').where({ id }).delete();
  }

  // Получить статистику по несоответствиям
  static async getStats() {
    const stats = await db('discrepancies')
      .select(db.raw('COUNT(*) as total'))
      .select(db.raw('COUNT(CASE WHEN status = \'new\' THEN 1 END) as new'))
      .select(db.raw('COUNT(CASE WHEN status = \'in_resolution\' THEN 1 END) as in_resolution'))
      .select(db.raw('COUNT(CASE WHEN status = \'closed\' THEN 1 END) as closed'))
      .select(db.raw('COUNT(CASE WHEN type = \'fix\' THEN 1 END) as fix_count'))
      .select(db.raw('COUNT(CASE WHEN type = \'kr_agreement\' THEN 1 END) as kr_count'))
      .select(db.raw('COUNT(CASE WHEN type = \'defect\' THEN 1 END) as defect_count'))
      .first();
    
    return stats;
  }

  // Получить несоответствия для контроля (готовые к проверке)
  static async getForControl() {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('d.status', 'ready_for_control')
      .orderBy('d.priority', 'asc')
      .orderBy('d.created_at', 'asc');
  }

  // Получить несоответствия на согласовании КР
  static async getKRPending() {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'p.name as product_name',
        'p.type as product_type'
      )
      .where('d.status', 'kr_pending')
      .orderBy('d.created_at', 'asc');
  }
}

module.exports = Discrepancy;