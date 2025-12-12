// src/controllers/discrepancyController.js
const Discrepancy = require('../models/Discrepancy');
const Application = require('../models/Application');

class DiscrepancyController {
  // Создать несоответствие
  static async create(req, res) {
    try {
      const {
        application_id,
        description,
        type,
        responsible_master_telegram_id,
        defect_code,
        priority,
        location_in_product,
        photo_urls,
        created_by_telegram_id
      } = req.body;
      
      if (!application_id || !description || !responsible_master_telegram_id || !created_by_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Обязательные поля: application_id, description, responsible_master_telegram_id, created_by_telegram_id'
        });
      }
      
      // Проверяем существование заявки
      const application = await Application.findById(application_id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      // Проверяем можно ли добавлять несоответствия к этой заявке
      if (['accepted', 'defect'].includes(application.status)) {
        return res.status(400).json({
          success: false,
          error: 'Нельзя добавлять несоответствия к принятой или забракованной заявке'
        });
      }
      
      const discrepancy = await Discrepancy.create({
        application_id,
        description,
        type: type || 'fix',
        responsible_master_telegram_id,
        defect_code: defect_code || null,
        priority: priority || 3,
        location_in_product: location_in_product || null,
        photo_urls: photo_urls || null,
        created_by_telegram_id
      });
      
      res.status(201).json({
        success: true,
        message: 'Несоответствие создано',
        discrepancy
      });
      
    } catch (error) {
      console.error('Create discrepancy error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании несоответствия'
      });
    }
  }

   // Получить все несоответствия
  static async getAll(req, res) {
    try {
      const { status, type, defect_code } = req.query;
      
      // Используем db из модели
      const db = require('knex')(require('../../knexfile')[process.env.NODE_ENV || 'development']);
      
      let query = db('discrepancies as d')
        .join('applications as a', 'd.application_id', 'a.id')
        .join('products as p', 'a.product_id', 'p.id')
        .select(
          'd.*',
          'a.application_number',
          'p.name as product_name',
          'p.drawing_number'
        );
      
      if (status) query = query.where('d.status', status);
      if (type) query = query.where('d.type', type);
      if (defect_code) query = query.where('d.defect_code', defect_code);
      
      const discrepancies = await query.orderBy('d.created_at', 'desc');
      
      res.json({
        success: true,
        count: discrepancies.length,
        discrepancies
      });
      
    } catch (error) {
      console.error('Get all discrepancies error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении несоответствий'
      });
    }
  }

  // Получить несоответствие по ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const discrepancy = await Discrepancy.findById(id);
      
      if (!discrepancy) {
        return res.status(404).json({
          success: false,
          error: 'Несоответствие не найдено'
        });
      }
      
      res.json({
        success: true,
        discrepancy
      });
      
    } catch (error) {
      console.error('Get discrepancy by id error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении несоответствия'
      });
    }
  }

  // Получить все несоответствия заявки
  static async getByApplication(req, res) {
    try {
      const { application_id } = req.params;
      
      const discrepancies = await Discrepancy.findByApplication(application_id);
      
      res.json({
        success: true,
        count: discrepancies.length,
        discrepancies
      });
      
    } catch (error) {
      console.error('Get discrepancies by application error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении несоответствий заявки'
      });
    }
  }

  // Получить несоответствия по мастеру
  static async getByMaster(req, res) {
    try {
      const { telegram_id } = req.params;
      const { status } = req.query;
      
      if (!telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется telegram_id'
        });
      }
      
      const discrepancies = await Discrepancy.findByMaster(telegram_id, status);
      
      res.json({
        success: true,
        count: discrepancies.length,
        discrepancies
      });
      
    } catch (error) {
      console.error('Get discrepancies by master error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении несоответствий мастера'
      });
    }
  }

  // Обновить статус несоответствия
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, updated_by_telegram_id, comment } = req.body;
      
      if (!status || !updated_by_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется status и updated_by_telegram_id'
        });
      }
      
      const discrepancy = await Discrepancy.findById(id);
      if (!discrepancy) {
        return res.status(404).json({
          success: false,
          error: 'Несоответствие не найдено'
        });
      }
      
      // Проверяем права (только ответственный мастер или ОТК могут менять статус)
      const canChangeStatus = 
        discrepancy.responsible_master_telegram_id === updated_by_telegram_id ||
        ['otk_inspector', 'admin', 'super_admin', 'quality_director'].includes(req.user?.role);
      
      if (!canChangeStatus) {
        return res.status(403).json({
          success: false,
          error: 'Недостаточно прав для изменения статуса'
        });
      }
      
      const updatedDiscrepancy = await Discrepancy.updateStatus(id, status, updated_by_telegram_id, comment);
      
      res.json({
        success: true,
        message: 'Статус обновлён',
        discrepancy: updatedDiscrepancy
      });
      
    } catch (error) {
      console.error('Update discrepancy status error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении статуса несоответствия'
      });
    }
  }

  // Начать устранение
  static async startResolution(req, res) {
    try {
      const { id } = req.params;
      const { master_telegram_id } = req.body;
      
      if (!master_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется master_telegram_id'
        });
      }
      
      const discrepancy = await Discrepancy.findById(id);
      if (!discrepancy) {
        return res.status(404).json({
          success: false,
          error: 'Несоответствие не найдено'
        });
      }
      
      if (discrepancy.responsible_master_telegram_id !== master_telegram_id) {
        return res.status(403).json({
          success: false,
          error: 'Только ответственный мастер может начать устранение'
        });
      }
      
      if (discrepancy.status !== 'new' && discrepancy.status !== 'in_analysis') {
        return res.status(400).json({
          success: false,
          error: 'Нельзя начать устранение в текущем статусе'
        });
      }
      
      const updatedDiscrepancy = await Discrepancy.startResolution(id, master_telegram_id);
      
      res.json({
        success: true,
        message: 'Устранение начато',
        discrepancy: updatedDiscrepancy
      });
      
    } catch (error) {
      console.error('Start resolution error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при начале устранения'
      });
    }
  }

  // Завершить устранение
  static async completeResolution(req, res) {
    try {
      const { id } = req.params;
      const { 
        master_telegram_id, 
        resolution_type, 
        notes, 
        documents 
      } = req.body;
      
      if (!master_telegram_id || !resolution_type) {
        return res.status(400).json({
          success: false,
          error: 'Требуется master_telegram_id и resolution_type'
        });
      }
      
      const discrepancy = await Discrepancy.findById(id);
      if (!discrepancy) {
        return res.status(404).json({
          success: false,
          error: 'Несоответствие не найдено'
        });
      }
      
      if (discrepancy.responsible_master_telegram_id !== master_telegram_id) {
        return res.status(403).json({
          success: false,
          error: 'Только ответственный мастер может завершить устранение'
        });
      }
      
      if (discrepancy.status !== 'in_resolution') {
        return res.status(400).json({
          success: false,
          error: 'Несоответствие не находится в устранении'
        });
      }
      
      const updatedDiscrepancy = await Discrepancy.completeResolution(id, {
        resolution_type,
        notes: notes || '',
        documents: documents || []
      });
      
      res.json({
        success: true,
        message: 'Устранение завершено, готово к контролю ОТК',
        discrepancy: updatedDiscrepancy
      });
      
    } catch (error) {
      console.error('Complete resolution error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при завершении устранения'
      });
    }
  }

  // Закрыть несоответствие (контроль ОТК)
  static async closeDiscrepancy(req, res) {
    try {
      const { id } = req.params;
      const { inspector_telegram_id, result } = req.body;
      
      if (!inspector_telegram_id || !result) {
        return res.status(400).json({
          success: false,
          error: 'Требуется inspector_telegram_id и result'
        });
      }
      
      if (!['accepted', 'rejected'].includes(result)) {
        return res.status(400).json({
          success: false,
          error: 'result должен быть "accepted" или "rejected"'
        });
      }
      
      const discrepancy = await Discrepancy.findById(id);
      if (!discrepancy) {
        return res.status(404).json({
          success: false,
          error: 'Несоответствие не найдено'
        });
      }
      
      if (discrepancy.status !== 'ready_for_control') {
        return res.status(400).json({
          success: false,
          error: 'Несоответствие не готово к контролю'
        });
      }
      
      // Проверяем что это ОТК инспектор
      // (здесь должна быть проверка роли пользователя)
      
      const updatedDiscrepancy = await Discrepancy.closeDiscrepancy(id, result, inspector_telegram_id);
      
      res.json({
        success: true,
        message: result === 'accepted' ? 'Несоответствие закрыто' : 'Несоответствие возвращено на доработку',
        discrepancy: updatedDiscrepancy
      });
      
    } catch (error) {
      console.error('Close discrepancy error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при закрытии несоответствия'
      });
    }
  }

  // Создать КР (Карточку разрешения)
  static async createKR(req, res) {
    try {
      const { id } = req.params;
      const { created_by_telegram_id, approvers, valid_until } = req.body;
      
      if (!created_by_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется created_by_telegram_id'
        });
      }
      
      const discrepancy = await Discrepancy.findById(id);
      if (!discrepancy) {
        return res.status(404).json({
          success: false,
          error: 'Несоответствие не найдено'
        });
      }
      
      if (discrepancy.type !== 'kr_agreement') {
        return res.status(400).json({
          success: false,
          error: 'Только несоответствия типа "kr_agreement" могут быть переведены в КР'
        });
      }
      
      const updatedDiscrepancy = await Discrepancy.createKR(id, {
        approvers: approvers || [],
        valid_until: valid_until || null
      });
      
      res.json({
        success: true,
        message: 'Карточка разрешения создана',
        discrepancy: updatedDiscrepancy
      });
      
    } catch (error) {
      console.error('Create KR error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании карточки разрешения'
      });
    }
  }

  // Получить историю несоответствия
  static async getHistory(req, res) {
    try {
      const { id } = req.params;
      
      const discrepancy = await Discrepancy.findById(id);
      if (!discrepancy) {
        return res.status(404).json({
          success: false,
          error: 'Несоответствие не найдено'
        });
      }
      
      const history = await Discrepancy.getHistory(id);
      
      res.json({
        success: true,
        count: history.length,
        history
      });
      
    } catch (error) {
      console.error('Get discrepancy history error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении истории несоответствия'
      });
    }
  }

  // Получить статистику
  static async getStats(req, res) {
    try {
      const { master_telegram_id, period } = req.query;
      
      const stats = await Discrepancy.getStats(master_telegram_id, period || 'month');
      
      res.json({
        success: true,
        period: period || 'month',
        master: master_telegram_id || 'all',
        stats
      });
      
    } catch (error) {
      console.error('Get discrepancies stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики'
      });
    }
  }

  // Получить топ дефектов по кодам
  static async getTopDefectCodes(req, res) {
    try {
      const { limit, period } = req.query;
      
      const topDefects = await Discrepancy.getTopDefectCodes(
        parseInt(limit) || 10,
        period || 'month'
      );
      
      res.json({
        success: true,
        count: topDefects.length,
        topDefects
      });
      
    } catch (error) {
      console.error('Get top defect codes error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении топ дефектов'
      });
    }
  }

  // Назначить нового ответственного
  static async reassign(req, res) {
    try {
      const { id } = req.params;
      const { new_master_telegram_id, reassigned_by_telegram_id, reason } = req.body;
      
      if (!new_master_telegram_id || !reassigned_by_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется new_master_telegram_id и reassigned_by_telegram_id'
        });
      }
      
      const discrepancy = await Discrepancy.findById(id);
      if (!discrepancy) {
        return res.status(404).json({
          success: false,
          error: 'Несоответствие не найдено'
        });
      }
      
      // Проверяем права (только ОТК, администратор или директор качества)
      // (здесь должна быть проверка роли пользователя)
      
      await db('discrepancies')
        .where({ id })
        .update({
          responsible_master_telegram_id: new_master_telegram_id,
          assigned_at: new Date(),
          updated_at: new Date()
        });
      
      // Записываем в историю
      await Discrepancy.addToHistory(id, reassigned_by_telegram_id, 'reassigned', {
        old_master: discrepancy.responsible_master_telegram_id,
        new_master: new_master_telegram_id,
        reason: reason || ''
      });
      
      const updatedDiscrepancy = await Discrepancy.findById(id);
      
      res.json({
        success: true,
        message: 'Ответственный изменён',
        discrepancy: updatedDiscrepancy
      });
      
    } catch (error) {
      console.error('Reassign discrepancy error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при изменении ответственного'
      });
    }
  }
}

module.exports = DiscrepancyController;