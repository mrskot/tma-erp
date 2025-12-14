// src/controllers/applicationController.js
const Application = require('../models/Application');
const Lot = require('../models/Lot');
const Product = require('../models/Product');

class ApplicationController {
  // Получить все заявки
  static async getAll(req, res) {
    try {
      const { status, limit, creator, lot_id, product_id } = req.query;
      
      let applications;
      
      if (status) {
        applications = await Application.findByStatus(status);
      } else if (creator) {
        applications = await Application.findByCreator(creator, parseInt(limit) || 50);
      } else if (lot_id) {
        applications = await Application.findByLot(lot_id, parseInt(limit) || 50);
      } else if (product_id) {
        applications = await Application.findByProduct(product_id, parseInt(limit) || 50);
      } else {
        applications = await Application.findAll(parseInt(limit) || 100);
      }
      
      res.json({
        success: true,
        count: applications.length,
        filters: { status, limit, creator, lot_id, product_id },
        applications
      });
      
    } catch (error) {
      console.error('Get all applications error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении списка заявок'
      });
    }
  }

  // Получить заявку по ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const application = await Application.findById(id);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      res.json({
        success: true,
        application
      });
      
    } catch (error) {
      console.error('Get application by id error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении заявки'
      });
    }
  }

  // Получить заявку по номеру
  static async getByNumber(req, res) {
    try {
      const { application_number } = req.params;
      
      if (!application_number) {
        return res.status(400).json({
          success: false,
          error: 'Требуется номер заявки'
        });
      }
      
      const application = await Application.findByNumber(application_number);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      res.json({
        success: true,
        application
      });
      
    } catch (error) {
      console.error('Get application by number error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при поиске заявки'
      });
    }
  }

  // Создать заявку
  static async create(req, res) {
    try {
      const { 
        lot_id, 
        product_id, 
        creator_telegram_id,
        quantity,
        batch_number,
        notes,
        desired_inspection_time
      } = req.body;
      
      if (!lot_id || !product_id || !creator_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Обязательные поля: lot_id, product_id, creator_telegram_id'
        });
      }
      
      // Проверяем существование участка
      const lot = await Lot.findById(lot_id);
      if (!lot) {
        return res.status(404).json({
          success: false,
          error: 'Участок не найден'
        });
      }
      
      // Проверяем существование изделия
      const product = await Product.findById(product_id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Изделие не найдено'
        });
      }
      
      const application = await Application.create({
        lot_id,
        product_id,
        creator_telegram_id,
        quantity: quantity || 1,
        batch_number: batch_number || null,
        notes: notes || null,
        desired_inspection_time: desired_inspection_time || null
      });
      
      res.status(201).json({
        success: true,
        message: 'Заявка успешно создана',
        application
      });
      
    } catch (error) {
      console.error('Create application error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании заявки'
      });
    }
  }

  // Назначить заявку ОТК контролёру
  static async assignToOTK(req, res) {
    try {
      const { id } = req.params;
      const { otk_inspector_telegram_id } = req.body;
      
      if (!otk_inspector_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется otk_inspector_telegram_id'
        });
      }
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      if (application.status !== 'new') {
        return res.status(400).json({
          success: false,
          error: 'Заявка уже назначена или обрабатывается'
        });
      }
      
      await Application.assignToOTK(id, otk_inspector_telegram_id);
      
      const updatedApplication = await Application.findById(id);
      
      res.json({
        success: true,
        message: 'Заявка назначена контролёру ОТК',
        application: updatedApplication
      });
      
    } catch (error) {
      console.error('Assign to OTK error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при назначении заявки'
      });
    }
  }

  // Начать проверку заявки
  static async startInspection(req, res) {
    try {
      const { id } = req.params;
      const { otk_inspector_telegram_id } = req.body;
      
      if (!otk_inspector_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется otk_inspector_telegram_id'
        });
      }
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      if (application.status !== 'assigned_to_otk') {
        return res.status(400).json({
          success: false,
          error: 'Заявка не назначена контролёру'
        });
      }
      
      if (application.otk_inspector_telegram_id !== otk_inspector_telegram_id) {
        return res.status(403).json({
          success: false,
          error: 'Недостаточно прав для начала проверки'
        });
      }
      
      await Application.startInspection(id);
      
      const updatedApplication = await Application.findById(id);
      
      res.json({
        success: true,
        message: 'Проверка начата',
        application: updatedApplication
      });
      
    } catch (error) {
      console.error('Start inspection error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при начале проверки'
      });
    }
  }

  // Завершить проверку (принять/отклонить)
  static async completeInspection(req, res) {
    try {
      const { id } = req.params;
      const { result, otk_inspector_telegram_id } = req.body;
      
      if (!result || !otk_inspector_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется result и otk_inspector_telegram_id'
        });
      }
      
      if (!['accepted', 'rejected'].includes(result)) {
        return res.status(400).json({
          success: false,
          error: 'result должен быть "accepted" или "rejected"'
        });
      }
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      if (application.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          error: 'Заявка не находится в процессе проверки'
        });
      }
      
      if (application.otk_inspector_telegram_id !== otk_inspector_telegram_id) {
        return res.status(403).json({
          success: false,
          error: 'Недостаточно прав для завершения проверки'
        });
      }
      
      await Application.completeInspection(id, result, otk_inspector_telegram_id);
      
      const updatedApplication = await Application.findById(id);
      
      res.json({
        success: true,
        message: `Заявка ${result === 'accepted' ? 'принята' : 'отклонена'}`,
        application: updatedApplication
      });
      
    } catch (error) {
      console.error('Complete inspection error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при завершении проверки'
      });
    }
  }

  // Получить новые заявки для ОТК (сортировка по приоритету)
  static async getNewForOTK(req, res) {
    try {
      const applications = await Application.getNewForOTK();
      
      res.json({
        success: true,
        count: applications.length,
        applications
      });
      
    } catch (error) {
      console.error('Get new for OTK error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении новых заявок'
      });
    }
  }

  // Получить заявки для конкретного контролёра ОТК
  static async getForInspector(req, res) {
    try {
      const { telegram_id } = req.params;
      const { status } = req.query;
      
      if (!telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется telegram_id'
        });
      }
      
      const applications = await Application.getForInspector(telegram_id, status);
      
      res.json({
        success: true,
        count: applications.length,
        applications
      });
      
    } catch (error) {
      console.error('Get for inspector error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении заявок контролёра'
      });
    }
  }

  // Получить статистику
  static async getStats(req, res) {
    try {
      const { period } = req.query;
      
      const stats = await Application.getStats(period || 'today');
      
      res.json({
        success: true,
        period: period || 'today',
        stats
      });
      
    } catch (error) {
      console.error('Get applications stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики'
      });
    }
  }

  // Обновить заявку (админ)
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      const updatedApplication = await Application.update(id, updates);
      
      res.json({
        success: true,
        message: 'Заявка обновлена',
        application: updatedApplication
      });
      
    } catch (error) {
      console.error('Update application error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении заявки'
      });
    }
  }
}

module.exports = ApplicationController;