// src/controllers/applicationController.js
const Application = require('../models/Application');
const Lot = require('../models/Lot');
const Product = require('../models/Product');
const TelegramService = require('../services/TelegramService');
const Bitrix24Service = require('../services/Bitrix24Service');
const path = require('path');
const fs = require('fs').promises;

class ApplicationController {
  // ================ CRUD ОПЕРАЦИИ ================

  // Получить все заявки
  static async getAll(req, res) {
  try {
    console.log('🔄 Получение заявок с фильтрами:', req.query);
    
    const { status, limit, creator, lot_id, product_id } = req.query;
    
    let applications;
    
    // Простая логика фильтрации
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
    
    console.log(`✅ Загружено заявок: ${applications.length}`);
    
    res.json({
      success: true,
      count: applications.length,
      filters: { status, limit, creator, lot_id, product_id },
      applications
    });
    
  } catch (error) {
    console.error('❌ Get all applications error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении списка заявок',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

  // ================ СОЗДАНИЕ ЗАЯВКИ (ИСПРАВЛЕННЫЙ МЕТОД) ================
  static async create(req, res) {
    try {
      console.log('📦 Получен запрос на создание заявки:', req.body);
      
      const { 
        lot_id, 
        product_id,
        drawing_number,
        serial_numbers, // строка с номерами через запятую (опционально)
        quantity, // количество изделий (число, опционально, по умолчанию 1)
        notes,
        desired_inspection_time,
        otk_inspector_telegram_id,
        send_telegram = 'true'
      } = req.body;

      // Telegram ID создателя - должен приходить из сессии/токена
      // ВРЕМЕННО: используем фиктивный ID для теста
      const creator_telegram_id = req.user?.telegram_id || 'admin_bot';
      
      // Валидация обязательных полей
      if (!lot_id || !product_id) {
        return res.status(400).json({
          success: false,
          error: 'Обязательные поля: участок и изделие'
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

      // Определяем контролёра ОТК
      let finalOtkInspector = otk_inspector_telegram_id;
      if (!finalOtkInspector && product.default_otk_inspector_telegram_id) {
        finalOtkInspector = product.default_otk_inspector_telegram_id;
        console.log(`✅ Автоназначение контролёра ОТК из продукта: ${finalOtkInspector}`);
      }

      // ============ ЛОГИКА СОЗДАНИЯ ЗАЯВОК ============
      
      // 1. Определяем сколько заявок создавать
      let applicationsToCreate = [];
      
      // Если указаны серийные номера
      if (serial_numbers && serial_numbers.trim()) {
        const numbers = serial_numbers.split(',')
          .map(sn => sn.trim())
          .filter(sn => sn.length > 0);
        
        // Создаём заявки для каждого серийного номера
        numbers.forEach(serialNumber => {
          applicationsToCreate.push({
            serialNumber,
            quantity: 1
          });
        });
        
        console.log(`📝 Создадим ${numbers.length} заявок по серийным номерам`);
      }
      // Если указано количество без серийных номеров
      else if (quantity && parseInt(quantity) > 1) {
        const count = parseInt(quantity);
        for (let i = 1; i <= count; i++) {
          applicationsToCreate.push({
            serialNumber: null, // Без серийного номера
            quantity: 1
          });
        }
        console.log(`📝 Создадим ${count} заявок без серийных номеров`);
      }
      // Одна заявка без серийного номера (по умолчанию)
      else {
        applicationsToCreate.push({
          serialNumber: null,
          quantity: 1
        });
        console.log('📝 Создадим 1 заявку без серийного номера');
      }

      // ============ СОЗДАНИЕ ЗАЯВОК ============
      const createdApplications = [];
      const errors = [];

      for (let i = 0; i < applicationsToCreate.length; i++) {
        const { serialNumber } = applicationsToCreate[i];
        
        try {
          // Генерируем номер заявки
          const applicationNumber = await Application.generateApplicationNumber();
          
          console.log(`🛠️ Создание заявки ${i + 1}/${applicationsToCreate.length}: ${applicationNumber}`);
          
          // Создаем заявку в БД
          const application = await Application.create({
            application_number: applicationNumber,
            lot_id,
            product_id,
            creator_telegram_id,
            drawing_number: drawing_number || null,
            product_serial_number: serialNumber,
            quantity: 1, // Каждая заявка - одно изделие
            notes: notes || null,
            desired_inspection_time: desired_inspection_time || null,
            otk_inspector_telegram_id: finalOtkInspector || null,
            status: 'new'
          });

          console.log(`✅ Заявка создана в БД: ID=${application.id}, номер=${applicationNumber}`);

          // Загружаем полные данные
          const fullApplication = await Application.findById(application.id);

          // ШАГ 1: Отправка в Telegram (если включено)
          let telegramMessageId = null;
          if (send_telegram === 'true') {
            try {
              telegramMessageId = await TelegramService.sendToChannel(fullApplication, 'created');
              if (telegramMessageId) {
                await Application.addTelegramMessage(application.id, telegramMessageId, 'channel');
                console.log(`📢 Telegram сообщение отправлено: ${telegramMessageId}`);
              }
            } catch (tgError) {
              console.error('❌ Ошибка Telegram:', tgError.message);
            }
          }

          // ШАГ 2: Синхронизация с Bitrix24
          let bitrixResult = { success: false };
          if (process.env.BITRIX24_ENABLED === 'true') {
            try {
              bitrixResult = await Bitrix24Service.createApplication(fullApplication);
              
              if (bitrixResult.success) {
                await Application.updateSyncStatus(
                  application.id, 
                  'success', 
                  bitrixResult.bitrix24_id
                );
                console.log(`🔗 Bitrix24 создана: ${bitrixResult.bitrix24_id}`);
              } else {
                // Добавляем в очередь на повтор
                await Application.addToSyncQueue(
                  'application',
                  application.id,
                  'create',
                  fullApplication
                );
                await Application.updateSyncStatus(
                  application.id,
                  'failed',
                  null,
                  bitrixResult.error
                );
                console.log(`⚠️ Bitrix24 ошибка, в очереди: ${bitrixResult.error}`);
              }
            } catch (bitrixError) {
              console.error('❌ Ошибка Bitrix24:', bitrixError.message);
              await Application.addToSyncQueue(
                'application',
                application.id,
                'create',
                fullApplication
              );
            }
          } else {
            console.log('ℹ️ Bitrix24 интеграция отключена');
          }

          // ШАГ 3: Загрузка фото МКИ (если есть)
          let uploadedPhotos = [];
          if (req.files && req.files['mki_photos']) {
            try {
              uploadedPhotos = await this.uploadMkiPhotos(application.id, req.files['mki_photos'], creator_telegram_id);
              console.log(`📸 Загружено ${uploadedPhotos.length} фото МКИ`);
            } catch (photoError) {
              console.error('❌ Ошибка загрузки фото:', photoError.message);
            }
          }

          createdApplications.push({
            id: application.id,
            application_number: applicationNumber,
            product_serial_number: serialNumber,
            telegram_message_id: telegramMessageId,
            bitrix24_id: bitrixResult.bitrix24_id,
            has_photos: uploadedPhotos.length > 0
          });

          console.log(`🎉 Заявка ${i + 1} успешно создана!`);

        } catch (error) {
          const errorMsg = `Заявка ${i + 1}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ Ошибка создания заявки ${i + 1}:`, error);
        }
      }

      // ============ ФОРМИРОВАНИЕ ОТВЕТА ============
      const response = {
        success: true,
        message: `Создано ${createdApplications.length} заявок`,
        created_count: createdApplications.length,
        applications: createdApplications,
        errors: errors.length > 0 ? errors : undefined
      };

      console.log('✅ Все заявки созданы:', response);
      res.status(201).json(response);

    } catch (error) {
      console.error('❌ Create application error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании заявки',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ================ ЗАГРУЗКА ФОТО МКИ ================
  static async uploadMkiPhotos(applicationId, files, telegramId) {
    try {
      const uploadDir = path.join(__dirname, '../../uploads/applications', applicationId.toString(), 'mk_i');
      
      // Создаём директорию если нет
      await fs.mkdir(uploadDir, { recursive: true });
      
      const photoIds = [];
      
      for (const file of files) {
        // Генерируем уникальное имя
        const ext = path.extname(file.originalname || '.jpg');
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const filePath = path.join(uploadDir, fileName);
        
        // Сохраняем файл
        await fs.writeFile(filePath, file.buffer);
        
        // TODO: Сохраняем в таблицу application_photos
        // Пока просто сохраняем путь
        photoIds.push(`/uploads/applications/${applicationId}/mk_i/${fileName}`);
        
        console.log(`📁 Фото сохранено: ${filePath}`);
      }
      
      // Обновляем заявку
      await Application.update(applicationId, {
        has_mki_photos: photoIds.length > 0,
        mki_photo_ids: JSON.stringify(photoIds)
      });
      
      return photoIds;
    } catch (error) {
      console.error('❌ Ошибка загрузки фото:', error);
      throw error;
    }
  }

  // ================ ОБНОВЛЕНИЕ ЗАЯВКИ ================
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
      
      // Если изменился статус - обновляем сообщение в Telegram
      if (updates.status && application.status !== updates.status) {
        try {
          // TODO: Реализовать updateMessage в TelegramService
          // await TelegramService.updateMessage(updatedApplication);
        } catch (tgError) {
          console.error('Ошибка обновления Telegram:', tgError.message);
        }
      }
      
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

  // ================ УДАЛЕНИЕ ЗАЯВКИ ================
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      // Мягкое удаление - деактивация
      await Application.update(id, { is_active: false });
      
      // TODO: Удалить сообщение из Telegram
      // TODO: Удалить из Bitrix24 через очередь
      
      res.json({
        success: true,
        message: 'Заявка деактивирована'
      });
      
    } catch (error) {
      console.error('Delete application error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении заявки'
      });
    }
  }

  // ================ БИЗНЕС-ОПЕРАЦИИ ================
  
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
      
      // Обновляем статус
      await Application.update(id, {
        status: 'assigned_to_otk',
        otk_inspector_telegram_id,
        assigned_at: new Date()
      });
      
      const updatedApplication = await Application.findById(id);
      
      // Обновляем сообщение в Telegram
      try {
        // TODO: Реализовать updateMessage
        // await TelegramService.updateMessage(updatedApplication);
      } catch (tgError) {
        console.error('Ошибка обновления Telegram:', tgError.message);
      }
      
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
      
      await Application.update(id, {
        status: 'in_progress',
        started_at: new Date()
      });
      
      const updatedApplication = await Application.findById(id);
      
      // Обновляем сообщение в Telegram
      try {
        // TODO: Реализовать updateMessage
        // await TelegramService.updateMessage(updatedApplication);
      } catch (tgError) {
        console.error('Ошибка обновления Telegram:', tgError.message);
      }
      
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
      const { result, otk_inspector_telegram_id, notes } = req.body;
      
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
      
      const updates = {
        status: result,
        completed_at: new Date(),
        notes: notes ? `${application.notes || ''}\nОТК: ${notes}`.trim() : application.notes
      };
      
      await Application.update(id, updates);
      
      const updatedApplication = await Application.findById(id);
      
      // Обновляем сообщение в Telegram
      try {
        // TODO: Реализовать updateMessage
        // await TelegramService.updateMessage(updatedApplication);
      } catch (tgError) {
        console.error('Ошибка обновления Telegram:', tgError.message);
      }
      
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

  // ================ СПЕЦИАЛЬНЫЕ ЗАПРОСЫ ================

  // Получить новые заявки для ОТК
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
        error: 'Ошибка при получении новых заявки'
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
      // Базовая статистика из модели Application
      const basicStats = await Application.getStats();
      
      // Статистика синхронизации из очереди
      const db = require('knex')(require('../../knexfile')[process.env.NODE_ENV || 'development']);
      
      const queueStats = await db('sync_queue')
        .select('status', db.raw('COUNT(*) as count'))
        .groupBy('status');
      
      // Формируем объект статистики очереди
      const syncQueue = {};
      queueStats.forEach(item => {
        syncQueue[item.status] = parseInt(item.count);
      });
      
      res.json({
        success: true,
        applications: basicStats,
        sync_queue: syncQueue
      });
      
    } catch (error) {
      console.error('Get applications stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики'
      });
    }
  }

  // ================ ИНТЕГРАЦИЯ ================

  // Принудительная синхронизация с Bitrix24
  static async forceSync(req, res) {
    try {
      const { id } = req.params;
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      // Если уже есть bitrix24_id - обновляем, иначе создаем
      let bitrixResult;
      
      if (application.bitrix24_id) {
        // TODO: Реализовать update в Bitrix24
        bitrixResult = { 
          success: false, 
          error: 'Update not implemented yet',
          bitrix24_id: application.bitrix24_id
        };
      } else {
        bitrixResult = await Bitrix24Service.createApplication(application);
      }
      
      if (bitrixResult.success) {
        await Application.updateSyncStatus(
          application.id,
          'success',
          bitrixResult.bitrix24_id
        );
        
        const updatedApp = await Application.findById(id);
        
        res.json({
          success: true,
          message: 'Заявка синхронизирована с Bitrix24',
          bitrix24_id: bitrixResult.bitrix24_id,
          application: updatedApp
        });
      } else {
        await Application.updateSyncStatus(
          application.id,
          'failed',
          null,
          bitrixResult.error
        );
        
        // Добавляем в очередь на повтор
        await Application.addToSyncQueue(
          'application',
          application.id,
          application.bitrix24_id ? 'update' : 'create',
          application
        );
        
        res.status(500).json({
          success: false,
          error: 'Ошибка синхронизации: ' + (bitrixResult.error || 'Неизвестная ошибка'),
          added_to_queue: true
        });
      }
      
    } catch (error) {
      console.error('Force sync error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при синхронизации'
      });
    }
  }

  // Обновить статус синхронизации
  static async updateSyncStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, bitrix24_id, error } = req.body;
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      const updatedApp = await Application.updateSyncStatus(
        id,
        status,
        bitrix24_id,
        error
      );
      
      res.json({
        success: true,
        message: 'Статус синхронизации обновлен',
        application: updatedApp
      });
      
    } catch (error) {
      console.error('Update sync status error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении статуса'
      });
    }
  }

  // Вебхук от Bitrix24
  static async bitrixWebhook(req, res) {
    try {
      const { event, data } = req.body;
      
      console.log('Bitrix24 webhook received:', { event, data });
      
      if (event === 'ONCRMITEMADD' || event === 'ONCRMITEMUPDATE') {
        const entityTypeId = data.FIELDS.ENTITY_TYPE_ID;
        const bitrixId = data.FIELDS.ID;
        
        // Проверяем, что это заявка ОТК (entityTypeId = 1086)
        if (entityTypeId === 1086) {
          // Ищем заявку по bitrix24_id
          const db = require('knex')(require('../../knexfile')[process.env.NODE_ENV || 'development']);
          
          const application = await db('applications')
            .where('bitrix24_id', bitrixId)
            .first();
          
          if (application) {
            // Обновляем статус
            const stageId = data.FIELDS.STAGE_ID;
            await Application.update(application.id, {
              bitrix24_process_stage: stageId,
              is_synced_with_bitrix24: true,
              sync_status: 'success'
            });
            
            console.log(`Bitrix24 webhook: обновлена заявка ${application.application_number}`);
          }
        }
      }
      
      res.json({ success: true, message: 'Webhook processed' });
      
    } catch (error) {
      console.error('Bitrix webhook error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка обработки вебхука'
      });
    }
  }
   // Изменение статуса заявки (с обновлением Telegram и Bitrix)
  static async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Требуется новый статус'
        });
      }
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      // Проверяем валидность статуса
      const validStatuses = ['new', 'assigned_to_otk', 'in_progress', 'accepted', 'rejected', 'in_resolution', 'mixed_status', 'kr_pending', 'defect'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Невалидный статус. Допустимые: ${validStatuses.join(', ')}`
        });
      }
      
      // Подготавливаем обновления
      const updates = {
        status: status
      };
      
      // Добавляем комментарий к заметкам
      if (notes && notes.trim()) {
        const timestamp = new Date().toLocaleString('ru-RU');
        const statusText = ApplicationController.getStatusText(status);
        const noteText = `\n\n[${timestamp}] Смена статуса: ${statusText}\n${notes}`;
        
        updates.notes = (application.notes || '') + noteText;
      }
      
      // Обновляем в БД
      await Application.update(id, updates);
      const updatedApplication = await Application.findById(id);
      
      // 1. Обновляем сообщение в Telegram
      if (application.telegram_channel_message_id) {
        try {
          await TelegramService.updateMessage(updatedApplication);
        } catch (tgError) {
          console.error('Ошибка обновления Telegram:', tgError.message);
        }
      }
      
      // 2. Обновляем статус в Bitrix24
      if (application.bitrix24_id && process.env.BITRIX24_ENABLED === 'true') {
        try {
          await Bitrix24Service.updateStatus(application.bitrix24_id, status);
        } catch (bitrixError) {
          console.error('Ошибка обновления в Bitrix24:', bitrixError.message);
          await Application.addToSyncQueue(
            'application',
            application.id,
            'update_status',
            { bitrix24_id: application.bitrix24_id, status }
          );
        }
      }
      
      res.json({
        success: true,
        message: `Статус изменен на: ${ApplicationController.getStatusText(status)}`,
        application: updatedApplication
      });
      
    } catch (error) {
      console.error('Change status error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при смене статуса'
      });
    }
  }

  // Получение фото заявки
  static async getPhotos(req, res) {
    try {
      const { id } = req.params;
      const { type = 'all' } = req.query; // mki, defect, all
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      const photos = [];
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      
      // Фото МКИ
      if (application.has_mki_photos && (type === 'all' || type === 'mki')) {
        try {
          const mkiPhotoIds = JSON.parse(application.mki_photo_ids || '[]');
          
          for (const photoPath of mkiPhotoIds) {
            photos.push({
              type: 'mki',
              path: photoPath,
              url: `${baseUrl}${photoPath}`,
              thumbnail_url: `${baseUrl}${photoPath.replace('.jpg', '-thumb.jpg')}` || `${baseUrl}${photoPath}`
            });
          }
        } catch (e) {
          console.error('Ошибка парсинга mki_photo_ids:', e.message);
        }
      }
      
      res.json({
        success: true,
        photos: photos,
        count: photos.length,
        application_id: id
      });
      
    } catch (error) {
      console.error('Get photos error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении фото'
      });
    }
  }

  // Полное удаление заявки (обновленный метод delete)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const { force = false } = req.query; // true для полного удаления
      
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: 'Заявка не найдена'
        });
      }
      
      // ПОЛНОЕ УДАЛЕНИЕ
      if (force === 'true' || force === true) {
        console.log(`🚨 Полное удаление заявки #${application.id} (${application.application_number})`);
        
        // 1. Удалить из Telegram канала
        if (application.telegram_channel_message_id) {
          try {
            await TelegramService.deleteMessage(application.telegram_channel_message_id);
            console.log(`✅ Удалено из Telegram: ${application.telegram_channel_message_id}`);
          } catch (tgError) {
            console.error('Ошибка удаления из Telegram:', tgError.message);
          }
        }
        
        // 2. Удалить из Bitrix24 (если есть)
        if (application.bitrix24_id && process.env.BITRIX24_ENABLED === 'true') {
          try {
            const result = await Bitrix24Service.deleteEntity(application.bitrix24_id);
            if (result.success) {
              console.log(`✅ Удалено из Bitrix24: ${application.bitrix24_id}`);
            } else {
              console.error('Ошибка удаления из Bitrix24:', result.error);
              // Добавляем в очередь на удаление
              await Application.addToSyncQueue(
                'application',
                application.id,
                'delete',
                { bitrix24_id: application.bitrix24_id }
              );
            }
          } catch (bitrixError) {
            console.error('Ошибка удаления из Bitrix24:', bitrixError.message);
          }
        }
        
        // 3. Удалить фото с диска
        if (application.has_mki_photos) {
          try {
            const fs = require('fs').promises;
            const path = require('path');
            const uploadDir = path.join(__dirname, '../../uploads/applications', id.toString());
            
            if (await fs.access(uploadDir).then(() => true).catch(() => false)) {
              await fs.rm(uploadDir, { recursive: true, force: true });
              console.log(`✅ Удалены файлы: ${uploadDir}`);
            }
          } catch (fsError) {
            console.error('Ошибка удаления файлов:', fsError.message);
          }
        }
        
        // 4. Удалить из БД (хард делет)
        const db = require('knex')(require('../../knexfile')[process.env.NODE_ENV || 'development']);
        await db('applications').where('id', id).delete();
        
        console.log(`✅ Удалено из БД: ${application.application_number}`);
        
        return res.json({
          success: true,
          message: 'Заявка полностью удалена (Telegram, Bitrix24, файлы, БД)',
          deleted: {
            telegram: !!application.telegram_channel_message_id,
            bitrix24: !!application.bitrix24_id,
            files: application.has_mki_photos,
            database: true
          }
        });
      }
      // МЯГКОЕ УДАЛЕНИЕ (по умолчанию)
      else {
        await Application.update(id, { is_active: false });
        
        return res.json({
          success: true,
          message: 'Заявка деактивирована',
          note: 'Для полного удаления используйте ?force=true',
          application_id: id
        });
      }
      
    } catch (error) {
      console.error('Delete application error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении заявки',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Вспомогательный метод для получения текста статуса
  static getStatusText(status) {
    const statusMap = {
      'new': '🆕 Новая',
      'assigned_to_otk': '👤 Назначена ОТК',
      'in_progress': '🔧 В работе',
      'accepted': '✅ Принята',
      'rejected': '❌ Отклонена',
      'in_resolution': '🔄 В устранении',
      'mixed_status': '⚡ Смешанный',
      'kr_pending': '📋 КР на согласовании',
      'defect': '🚫 Брак'
    };
    return statusMap[status] || status;
  }


}

module.exports = ApplicationController;