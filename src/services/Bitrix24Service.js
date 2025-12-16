const axios = require('axios');

class Bitrix24Service {
  constructor() {
    this.enabled = process.env.BITRIX24_ENABLED === 'true';
    this.baseUrl = process.env.BITRIX24_WEBHOOK_URL;
    this.entityId = parseInt(process.env.BITRIX24_APPLICATION_ENTITY_ID) || 1086;
    
    // Маппинг полей
    this.fieldMapping = process.env.BITRIX24_FIELD_MAPPING ? 
      JSON.parse(process.env.BITRIX24_FIELD_MAPPING) : {};
    
    console.log(`Bitrix24Service: ${this.enabled ? 'активен' : 'отключен'}`);
  }
  
  // Создание заявки в Bitrix24
  async createApplication(applicationData) {
    if (!this.enabled) {
      console.log('Bitrix24Service: отключен в настройках');
      return { success: false, bitrix24_id: null, error: 'Service disabled' };
    }
    
    try {
      // Подготовка данных для Bitrix24
      const bitrixFields = this.mapToBitrixFields(applicationData);
      
      // JSON для Bitrix24 (точно как в примере)
      const requestData = {
        entityTypeId: this.entityId,
        fields: bitrixFields
      };
      
      console.log('Bitrix24Service: отправка в Bitrix24:', {
        url: `${this.baseUrl}crm.item.add.json`,
        entityId: this.entityId,
        fields: Object.keys(bitrixFields)
      });
      
      // Отправка запроса
      const response = await axios.post(
        `${this.baseUrl}crm.item.add.json`,
        requestData,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // 10 секунд таймаут
        }
      );
      
      console.log('Bitrix24Service: ответ от Bitrix24:', {
        status: response.status,
        data: response.data
      });
      
      if (response.data.result && response.data.result.item) {
        const bitrixId = response.data.result.item.id;
        console.log(`Bitrix24Service: заявка создана #${bitrixId}`);
        
        return {
          success: true,
          bitrix24_id: bitrixId,
          message: 'Заявка создана в Bitrix24',
          response: response.data
        };
      } else {
        console.error('Bitrix24Service: ошибка в ответе:', response.data);
        return {
          success: false,
          bitrix24_id: null,
          error: response.data.error_description || 'Неизвестная ошибка Bitrix24',
          response: response.data
        };
      }
      
    } catch (error) {
      console.error('Bitrix24Service: ошибка сети:', {
        message: error.message,
        url: error.config?.url,
        data: error.config?.data
      });
      
      return {
        success: false,
        bitrix24_id: null,
        error: error.message,
        isNetworkError: !error.response
      };
    }
  }
  
  // Обновление заявки в Bitrix24
  async updateApplication(bitrixId, updates) {
    if (!this.enabled) return { success: false };
    
    try {
      const response = await axios.post(
        `${this.baseUrl}crm.item.update.json`,
        {
          entityTypeId: this.entityId,
          id: bitrixId,
          fields: updates
        }
      );
      
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      console.error('Bitrix24Service: ошибка обновления:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  // Обновление статуса в Bitrix24
  async updateStatus(bitrixId, status) {
    if (!this.enabled) return { success: false };
    
    try {
      // Маппинг статусов TMA → Bitrix24 (настроить под ваши стадии)
      const stageMap = {
        'new': 'NEW',
        'assigned_to_otk': 'PREPARATION',
        'in_progress': '1',
        'accepted': 'SUCCESS',
        'rejected': 'FAILED',
        'defect': '2'
      };
      
      const stageId = stageMap[status] || 'NEW';
      
      const response = await axios.post(
        `${this.baseUrl}crm.item.update.json`,
        {
          entityTypeId: this.entityId,
          id: bitrixId,
          fields: {
            stageId: stageId
          }
        }
      );
      
      console.log(`Bitrix24Service: статус обновлен #${bitrixId} -> ${stageId}`);
      
      return {
        success: true,
        response: response.data
      };
    } catch (error) {
      console.error('Bitrix24Service: ошибка обновления статуса:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  // Удаление сущности из Bitrix24
  async deleteEntity(bitrixId) {
    if (!this.enabled) {
      return { success: false, error: 'Service disabled' };
    }
    
    try {
      console.log(`Bitrix24Service: удаление сущности #${bitrixId}`);
      
      const response = await axios.post(
        `${this.baseUrl}crm.item.delete.json`,
        {
          entityTypeId: this.entityId,
          id: bitrixId
        }
      );
      
      console.log('Bitrix24Service: ответ на удаление:', response.data);
      
      if (response.data.result === true) {
        console.log(`Bitrix24Service: успешно удалена сущность #${bitrixId}`);
        return { success: true };
      } else {
        console.error('Bitrix24Service: ошибка удаления:', response.data);
        return { 
          success: false, 
          error: response.data.error_description || 'Неизвестная ошибка' 
        };
      }
      
    } catch (error) {
      console.error('Bitrix24Service: ошибка удаления:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  // Маппинг полей TMA → Bitrix24
  mapToBitrixFields(application) {
    const fields = {};
    
    // Основные поля
    if (this.fieldMapping.drawing_number && application.drawing_number) {
      fields[this.fieldMapping.drawing_number] = application.drawing_number;
    }
    
    if (this.fieldMapping.lot && application.lot_name) {
      fields[this.fieldMapping.lot] = application.lot_name;
    }
    
    if (this.fieldMapping.product && application.product_name) {
      fields[this.fieldMapping.product] = application.product_name;
    }
    
    if (this.fieldMapping.serial_number && application.product_serial_number) {
      fields[this.fieldMapping.serial_number] = application.product_serial_number;
    }
    
    if (this.fieldMapping.transformer_type && application.transformer_type) {
      fields[this.fieldMapping.transformer_type] = application.transformer_type;
    }
    
    // Системные поля
    if (this.fieldMapping.source) {
      fields[this.fieldMapping.source] = 'tbot';
    }
    
    if (this.fieldMapping.telegram_id && application.creator_telegram_id) {
      fields[this.fieldMapping.telegram_id] = application.creator_telegram_id;
    }
    
    if (this.fieldMapping.tma_id && application.id) {
      fields[this.fieldMapping.tma_id] = application.id.toString();
    }
    
    if (this.fieldMapping.kod_zayav && application.application_number) {
      fields[this.fieldMapping.kod_zayav] = application.application_number;
    }
    
    if (this.fieldMapping.quantity && application.quantity) {
      fields[this.fieldMapping.quantity] = application.quantity.toString();
    }
    
    // Название заявки (обязательное поле)
    fields['title'] = `Заявка ОТК #${application.application_number} - ${application.product_name || 'Изделие'}`;
    
    return fields;
  }
  
  // Синхронизация очереди
  async processQueue(knex, limit = 10) {
    if (!this.enabled || !knex) return;
    
    try {
      // Получаем задачи из очереди
      const tasks = await knex('sync_queue')
        .where('status', 'pending')
        .where('target_system', 'bitrix24')
        .where(function() {
          this.whereNull('next_retry_at')
            .orWhere('next_retry_at', '<=', new Date());
        })
        .orderBy('created_at', 'asc')
        .limit(limit);
      
      for (const task of tasks) {
        await this.processTask(task, knex);
      }
    } catch (error) {
      console.error('Bitrix24Service: ошибка обработки очереди:', error);
    }
  }
  
  // Обработка отдельной задачи
  async processTask(task, knex) {
    try {
      // Обновляем статус на "в обработке"
      await knex('sync_queue')
        .where('id', task.id)
        .update({
          status: 'processing',
          processed_at: new Date()
        });
      
      let result;
      
      // Выполняем операцию
      switch (task.operation) {
        case 'create':
          result = await this.createApplication(JSON.parse(task.payload));
          break;
        case 'update':
          const payload = JSON.parse(task.payload);
          result = await this.updateApplication(payload.bitrix_id, payload.fields);
          break;
        case 'delete':
          const deletePayload = JSON.parse(task.payload);
          result = await this.deleteEntity(deletePayload.bitrix_id);
          break;
        case 'update_status':
          const statusPayload = JSON.parse(task.payload);
          result = await this.updateStatus(statusPayload.bitrix_id, statusPayload.status);
          break;
        default:
          result = { success: false, error: 'Unknown operation' };
      }
      
      // Обновляем результат
      await knex('sync_queue')
        .where('id', task.id)
        .update({
          status: result.success ? 'success' : 'failed',
          response: JSON.stringify(result),
          error_message: result.error || null,
          retry_count: knex.raw('retry_count + 1')
        });
      
    } catch (error) {
      console.error(`Bitrix24Service: ошибка обработки задачи ${task.id}:`, error);
      
      // Увеличиваем счетчик повторных попыток
      const newRetryCount = task.retry_count + 1;
      const shouldRetry = newRetryCount < (task.max_retries || 3);
      
      await knex('sync_queue')
        .where('id', task.id)
        .update({
          status: shouldRetry ? 'retry' : 'failed',
          error_message: error.message,
          retry_count: newRetryCount,
          next_retry_at: shouldRetry ? 
            new Date(Date.now() + 5000) : null // Через 5 секунд
        });
    }
  }
}

module.exports = new Bitrix24Service();