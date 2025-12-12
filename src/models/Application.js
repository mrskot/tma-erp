// src/models/Application.js
const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Application {
  // Генерация номера заявки
  static generateApplicationNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `APP-${year}${month}${day}-${random}`;
  }

  // Получить все заявки
  static async findAll() {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.drawing_number'
      )
      .orderBy('a.created_at', 'desc');
  }

  // Найти заявку по ID
  static async findById(id) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'l.manager_telegram_id as lot_manager',
        'p.name as product_name',
        'p.drawing_number',
        'p.type as product_type'
      )
      .where('a.id', id)
      .first();
  }

  // Найти заявку по номеру
  static async findByNumber(appNumber) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.drawing_number'
      )
      .where('a.application_number', appNumber)
      .first();
  }

  // Создать заявку
  static async create(applicationData) {
    const applicationNumber = this.generateApplicationNumber();
    
    const [application] = await db('applications')
      .insert({
        application_number: applicationNumber,
        lot_id: applicationData.lot_id,
        product_id: applicationData.product_id,
        creator_telegram_id: applicationData.creator_telegram_id,
        status: 'new',
        quantity: applicationData.quantity || 1,
        batch_number: applicationData.batch_number || null,
        notes: applicationData.notes || null,
        desired_inspection_time: applicationData.desired_inspection_time || null
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

  // Назначить ОТК контролёра
  static async assignToOTK(id, inspectorTelegramId) {
    return db('applications')
      .where({ id })
      .update({
        otk_inspector_telegram_id: inspectorTelegramId,
        status: 'assigned_to_otk',
        assigned_at: new Date(),
        updated_at: new Date()
      });
  }

  // Начать проверку
  static async startInspection(id) {
    return db('applications')
      .where({ id })
      .update({
        status: 'in_progress',
        started_at: new Date(),
        updated_at: new Date()
      });
  }

  // Завершить проверку (принять/отклонить)
  static async completeInspection(id, result, inspectorTelegramId) {
    const status = result === 'accepted' ? 'accepted' : 'rejected';
    
    return db('applications')
      .where({ id })
      .update({
        status: status,
        completed_at: new Date(),
        otk_inspector_telegram_id: inspectorTelegramId,
        updated_at: new Date()
      });
  }

  // Получить заявки по участку
  static async getByLot(lotId, status = null) {
    let query = db('applications as a')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'p.name as product_name',
        'p.drawing_number'
      )
      .where('a.lot_id', lotId);
    
    if (status) {
      query = query.where('a.status', status);
    }
    
    return query.orderBy('a.created_at', 'desc');
  }

  // Получить заявки по мастеру (создателю)
  static async getByCreator(telegramId) {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.drawing_number'
      )
      .where('a.creator_telegram_id', telegramId)
      .orderBy('a.created_at', 'desc');
  }

  // Получить заявки для ОТК контролёра
  static async getForInspector(telegramId, status = null) {
    let query = db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'p.name as product_name',
        'p.drawing_number'
      )
      .where('a.otk_inspector_telegram_id', telegramId);
    
    if (status) {
      query = query.where('a.status', status);
    }
    
    return query.orderBy('a.priority', 'desc').orderBy('a.created_at', 'asc');
  }

  // Получить новые заявки для ОТК (ещё не назначенные)
  static async getNewForOTK() {
    return db('applications as a')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'a.*',
        'l.name as lot_name',
        'l.priority_level',
        'l.distance_to_otk_meters',
        'p.name as product_name',
        'p.drawing_number'
      )
      .where('a.status', 'new')
      .orderBy('l.priority_level', 'asc')
      .orderBy('l.distance_to_otk_meters', 'asc')
      .orderBy('a.created_at', 'asc');
  }

  // Обновить статистику несоответствий
  static async updateDiscrepancyStats(id, stats) {
    return db('applications')
      .where({ id })
      .update({
        discrepancy_count: stats.total || 0,
        resolution_summary: JSON.stringify(stats),
        updated_at: new Date()
      });
  }

  // Получить статистику по заявкам
  static async getStats(period = 'today') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // все время
    }
    
    const stats = await db('applications')
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as accepted', ['accepted']),
        db.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as rejected', ['rejected']),
        db.raw('SUM(CASE WHEN status IN (?, ?) THEN 1 ELSE 0 END) as in_progress', ['new', 'assigned_to_otk', 'in_progress']),
        db.raw('AVG(sla_response_minutes) as avg_response_time'),
        db.raw('AVG(sla_inspection_minutes) as avg_inspection_time')
      )
      .where('created_at', '>=', startDate)
      .first();
    
    return stats;
  }
}

module.exports = Application;
