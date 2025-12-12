// src/models/Discrepancy.js
const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Discrepancy {
  // Генерация номера несоответствия
  static generateDiscrepancyNumber(applicationNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `DISC-${applicationNumber.replace('APP-', '')}-${random}`;
  }

  // Создать несоответствие
  static async create(discrepancyData) {
    // Получаем номер заявки для генерации номера несоответствия
    const application = await db('applications')
      .where('id', discrepancyData.application_id)
      .first();
    
    const discrepancyNumber = this.generateDiscrepancyNumber(application.application_number);
    
    const [discrepancy] = await db('discrepancies')
      .insert({
        discrepancy_number: discrepancyNumber,
        application_id: discrepancyData.application_id,
        description: discrepancyData.description,
        type: discrepancyData.type || 'fix',
        responsible_master_telegram_id: discrepancyData.responsible_master_telegram_id,
        defect_code: discrepancyData.defect_code || null,
        status: 'new',
        priority: discrepancyData.priority || 3,
        location_in_product: discrepancyData.location_in_product || null,
        photo_urls: discrepancyData.photo_urls ? JSON.stringify(discrepancyData.photo_urls) : null
      })
      .returning('*');
    
    // Обновляем счётчик несоответствий в заявке
    await this.updateApplicationDiscrepancyCount(discrepancyData.application_id);
    
    // Записываем в историю
    await this.addToHistory(discrepancy.id, discrepancyData.created_by_telegram_id, 'created', {
      description: discrepancyData.description,
      type: discrepancyData.type
    });
    
    return discrepancy;
  }

  // Найти по ID
  static async findById(id) {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('lots as l', 'a.lot_id', 'l.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'a.status as application_status',
        'l.name as lot_name',
        'p.name as product_name',
        'p.drawing_number'
      )
      .where('d.id', id)
      .first();
  }

  // Найти все несоответствия заявки
  static async findByApplication(applicationId) {
    return db('discrepancies as d')
      .select('d.*')
      .where('d.application_id', applicationId)
      .orderBy('d.priority', 'asc')
      .orderBy('d.created_at', 'desc');
  }

  // Найти несоответствия по ответственному мастеру
  static async findByMaster(telegramId, status = null) {
    let query = db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'p.name as product_name',
        'p.drawing_number'
      )
      .where('d.responsible_master_telegram_id', telegramId);
    
    if (status) {
      query = query.where('d.status', status);
    }
    
    return query.orderBy('d.priority', 'asc').orderBy('d.created_at', 'desc');
  }

  // Обновить статус
  static async updateStatus(id, status, updatedByTelegramId, comment = '') {
    const oldDiscrepancy = await this.findById(id);
    
    await db('discrepancies')
      .where({ id })
      .update({
        status: status,
        updated_at: new Date()
      });
    
    // Записываем в историю
    await this.addToHistory(id, updatedByTelegramId, 'status_change', {
      old_status: oldDiscrepancy.status,
      new_status: status,
      comment: comment
    });
    
    return this.findById(id);
  }

  // Начать устранение
  static async startResolution(id, masterTelegramId) {
    return db('discrepancies')
      .where({ id })
      .update({
        status: 'in_resolution',
        started_at: new Date(),
        updated_at: new Date()
      });
  }

  // Завершить устранение
  static async completeResolution(id, resolutionData) {
    const resolutionType = resolutionData.resolution_type;
    let updates = {
      status: 'ready_for_control',
      resolution_type: resolutionType,
      resolution_notes: resolutionData.notes || '',
      resolution_documents: resolutionData.documents ? JSON.stringify(resolutionData.documents) : null,
      completed_at: new Date(),
      updated_at: new Date()
    };
    
    // Рассчитываем время устранения
    const discrepancy = await this.findById(id);
    if (discrepancy.started_at) {
      const resolutionTime = Math.floor((new Date() - new Date(discrepancy.started_at)) / (1000 * 60));
      updates.resolution_time_minutes = resolutionTime;
    }
    
    await db('discrepancies')
      .where({ id })
      .update(updates);
    
    return this.findById(id);
  }

  // Закрыть несоответствие (после контроля ОТК)
  static async closeDiscrepancy(id, result, inspectorTelegramId) {
    let updates = {
      status: 'closed',
      approved_by_telegram_id: inspectorTelegramId,
      updated_at: new Date()
    };
    
    if (result === 'rejected') {
      updates.status = 'in_resolution'; // Возвращаем на доработку
    }
    
    await db('discrepancies')
      .where({ id })
      .update(updates);
    
    return this.findById(id);
  }

  // Создать КР (Карточку разрешения)
  static async createKR(id, krData) {
    const krDocumentId = `KR-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    await db('discrepancies')
      .where({ id })
      .update({
        type: 'kr_agreement',
        status: 'kr_pending',
        kr_document_id: krDocumentId,
        kr_approvers: JSON.stringify(krData.approvers || []),
        kr_valid_until: krData.valid_until || null,
        updated_at: new Date()
      });
    
    return this.findById(id);
  }

  // Обновить счётчик несоответствий в заявке
  static async updateApplicationDiscrepancyCount(applicationId) {
    const count = await db('discrepancies')
      .where({ application_id: applicationId })
      .count('id as total')
      .first();
    
    // Также собираем статистику по типам закрытия
    const stats = {
      fixed: 0,
      kr_pending: 0,
      defect: 0,
      political: 0
    };
    
    const discrepancies = await db('discrepancies')
      .where({ application_id: applicationId })
      .select('resolution_type');
    
    discrepancies.forEach(d => {
      if (d.resolution_type === 'fixed') stats.fixed++;
      else if (d.resolution_type === 'kr_approved' || d.resolution_type === 'kr_rejected') stats.kr_pending++;
      else if (d.resolution_type === 'defect') stats.defect++;
      else if (d.resolution_type === 'political_close') stats.political++;
    });
    
    // Обновляем заявку
    await db('applications')
      .where({ id: applicationId })
      .update({
        discrepancy_count: count.total,
        resolution_summary: JSON.stringify(stats),
        updated_at: new Date()
      });
    
    // Обновляем статус заявки на основе несоответствий
    await this.updateApplicationStatus(applicationId);
  }

  // Обновить статус заявки на основе несоответствий
  static async updateApplicationStatus(applicationId) {
    const discrepancies = await this.findByApplication(applicationId);
    
    if (discrepancies.length === 0) return;
    
    // Проверяем если есть брак
    const hasDefect = discrepancies.some(d => d.resolution_type === 'defect');
    if (hasDefect) {
      await db('applications')
        .where({ id: applicationId })
        .update({ status: 'defect', updated_at: new Date() });
      return;
    }
    
    // Проверяем если есть КР на согласовании
    const hasKRPending = discrepancies.some(d => d.status === 'kr_pending');
    if (hasKRPending) {
      await db('applications')
        .where({ id: applicationId })
        .update({ status: 'kr_pending', updated_at: new Date() });
      return;
    }
    
    // Проверяем если все несоответствия закрыты
    const allClosed = discrepancies.every(d => d.status === 'closed');
    if (allClosed) {
      await db('applications')
        .where({ id: applicationId })
        .update({ status: 'accepted', updated_at: new Date() });
      return;
    }
    
    // Проверяем если есть активные несоответствия
    const hasActive = discrepancies.some(d => 
      ['new', 'in_analysis', 'in_resolution', 'ready_for_control'].includes(d.status)
    );
    
    if (hasActive) {
      await db('applications')
        .where({ id: applicationId })
        .update({ status: 'in_resolution', updated_at: new Date() });
    }
  }

  // Добавить запись в историю
  static async addToHistory(discrepancyId, changedBy, action, changes) {
    await db('discrepancy_history').insert({
      discrepancy_id: discrepancyId,
      changed_by_telegram_id: changedBy,
      action: action,
      changes: JSON.stringify(changes),
      created_at: new Date()
    });
  }

  // Получить историю несоответствия
  static async getHistory(discrepancyId) {
    return db('discrepancy_history')
      .where({ discrepancy_id: discrepancyId })
      .orderBy('created_at', 'desc');
  }

  // Получить статистику по несоответствиям
  static async getStats(masterTelegramId = null, period = 'month') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    let query = db('discrepancies')
      .where('created_at', '>=', startDate);
    
    if (masterTelegramId) {
      query = query.where('responsible_master_telegram_id', masterTelegramId);
    }
    
    const stats = await query
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as new', ['new']),
        db.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as in_resolution', ['in_resolution']),
        db.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as closed', ['closed']),
        db.raw('SUM(CASE WHEN resolution_type = ? THEN 1 ELSE 0 END) as fixed', ['fixed']),
        db.raw('SUM(CASE WHEN resolution_type = ? THEN 1 ELSE 0 END) as defect', ['defect']),
        db.raw('AVG(resolution_time_minutes) as avg_resolution_time')
      )
      .first();
    
    return stats;
  }

  // Поиск по коду дефекта
  static async findByDefectCode(defectCode) {
    return db('discrepancies as d')
      .join('applications as a', 'd.application_id', 'a.id')
      .join('products as p', 'a.product_id', 'p.id')
      .select(
        'd.*',
        'a.application_number',
        'p.name as product_name',
        'p.drawing_number'
      )
      .where('d.defect_code', defectCode)
      .orderBy('d.created_at', 'desc');
  }

  // Получить топ дефектов по кодам
  static async getTopDefectCodes(limit = 10, period = 'month') {
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }
    
    return db('discrepancies')
      .select(
        'defect_code',
        'defect_category',
        'defect_severity',
        db.raw('COUNT(*) as count'),
        db.raw('AVG(resolution_time_minutes) as avg_resolution_time')
      )
      .where('created_at', '>=', startDate)
      .whereNotNull('defect_code')
      .groupBy('defect_code', 'defect_category', 'defect_severity')
      .orderBy('count', 'desc')
      .limit(limit);
  }
}

module.exports = Discrepancy;
