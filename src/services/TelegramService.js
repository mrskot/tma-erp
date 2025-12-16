const axios = require('axios');

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.channelId = process.env.TELEGRAM_CHANNEL_ID;
    this.enabled = process.env.TELEGRAM_BOT_ENABLED === 'true' && 
                   this.botToken && this.channelId;
    
    console.log(`TelegramService: ${this.enabled ? 'активен' : 'отключен'}`);
  }
  
  // Отправка сообщения в канал
  async sendToChannel(application, action = 'created') {
    if (!this.enabled) {
      console.log('TelegramService: отключен');
      return null;
    }
    
    try {
      const message = this.formatApplicationMessage(application, action);
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      console.log('TelegramService: отправка в канал', {
        chat_id: this.channelId,
        action: action,
        app_number: application.application_number
      });
      
      const response = await axios.post(url, {
        chat_id: this.channelId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        disable_notification: action !== 'created' // Уведомление только для новых
      }, {
        timeout: 5000
      });
      
      const messageId = response.data.result.message_id;
      console.log(`TelegramService: сообщение отправлено #${messageId}`);
      
      // Сохраняем message_id в БД через модель
      const Application = require('../models/Application');
      await Application.update(application.id, {
        telegram_channel_message_id: messageId.toString()
      });
      
      return messageId;
      
    } catch (error) {
      console.error('TelegramService ошибка:', {
        message: error.message,
        response: error.response?.data
      });
      
      // Добавляем в очередь на повторную отправку
      if (application.id) {
        await this.addToSyncQueue(application, 'telegram', 'send_message', error.message);
      }
      
      return null;
    }
  }
  
  // Обновление сообщения в канале
  async updateMessage(application) {
    if (!this.enabled || !application.telegram_channel_message_id) {
      console.log('TelegramService: нечего обновлять');
      return false;
    }
    
    try {
      const message = this.formatApplicationMessage(application, 'updated');
      const url = `https://api.telegram.org/bot${this.botToken}/editMessageText`;
      
      console.log('TelegramService: обновление сообщения', {
        message_id: application.telegram_channel_message_id,
        app_number: application.application_number
      });
      
      const response = await axios.post(url, {
        chat_id: this.channelId,
        message_id: application.telegram_channel_message_id,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });
      
      console.log(`TelegramService: сообщение #${application.telegram_channel_message_id} обновлено`);
      return true;
      
    } catch (error) {
      console.error('TelegramService ошибка обновления:', {
        message: error.message,
        response: error.response?.data
      });
      
      // Если сообщение не найдено (удалено), создаем новое
      if (error.response?.data?.error_code === 400) {
        console.log('TelegramService: старое сообщение не найдено, отправляем новое');
        const newMessageId = await this.sendToChannel(application, 'updated');
        if (newMessageId) {
          const Application = require('../models/Application');
          await Application.update(application.id, {
            telegram_channel_message_id: newMessageId.toString()
          });
          return true;
        }
      }
      
      return false;
    }
  }
  
  // Удаление сообщения из канала
  async deleteMessage(messageId) {
    if (!this.enabled || !messageId) {
      console.log('TelegramService: нечего удалять');
      return false;
    }
    
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/deleteMessage`;
      
      console.log('TelegramService: удаление сообщения', { message_id: messageId });
      
      await axios.post(url, {
        chat_id: this.channelId,
        message_id: messageId
      }, {
        timeout: 5000
      });
      
      console.log(`TelegramService: сообщение #${messageId} удалено`);
      return true;
      
    } catch (error) {
      console.error('TelegramService ошибка удаления:', {
        message: error.message,
        response: error.response?.data
      });
      
      // Если сообщение уже удалено - считаем успехом
      if (error.response?.data?.error_code === 400 && 
          error.response?.data?.description?.includes('message to delete not found')) {
        console.log('TelegramService: сообщение уже удалено');
        return true;
      }
      
      return false;
    }
  }
  
  // Форматирование сообщения
  formatApplicationMessage(application, action = 'created') {
    const statusInfo = this.getStatusInfo(application.status);
    const actionText = this.getActionText(action);
    
    // Формируем заголовок в зависимости от статуса
    let title;
    if (action === 'created') {
      title = `📋 ${actionText} заявка #${application.application_number}`;
    } else {
      title = `${statusInfo.emoji} Заявка #${application.application_number} - ${statusInfo.text}`;
    }
    
    let message = `
<b>${title}</b>
━━━━━━━━━━━━━━━━━━━━━━━
🏭 <b>Участок:</b> ${application.lot_name || 'Не указан'}
🔧 <b>Изделие:</b> ${application.product_name || 'Не указан'}
`;
    
    // ОБЯЗАТЕЛЬНО добавляем чертеж и серийник
    if (application.drawing_number) {
      message += `📐 <b>Чертеж:</b> ${application.drawing_number}\n`;
    } else {
      message += `📐 <b>Чертеж:</b> Не указан\n`;
    }
    
    if (application.product_serial_number) {
      message += `🔢 <b>Серийный номер:</b> ${application.product_serial_number}\n`;
    } else {
      message += `🔢 <b>Серийный номер:</b> Нет\n`;
    }
    
    if (application.quantity && application.quantity > 1) {
      message += `📦 <b>Количество:</b> ${application.quantity} ${application.product_unit || 'шт'}\n`;
    }
    
    message += `
👤 <b>Создал:</b> ${application.creator_telegram_id || 'Неизвестно'}
⏰ <b>Время:</b> ${new Date(application.created_at).toLocaleString('ru-RU')}
`;
    
    if (application.desired_inspection_time) {
      message += `⏳ <b>Желаемое время:</b> ${new Date(application.desired_inspection_time).toLocaleString('ru-RU')}\n`;
    }
    
    // Статус всегда показываем
    message += `📊 <b>Статус:</b> ${statusInfo.emoji} ${statusInfo.text}\n`;
    
    // Контролер ОТК
    if (application.otk_inspector_telegram_id) {
      message += `👷 <b>Контролёр ОТК:</b> ${application.otk_inspector_telegram_id}\n`;
    }
    
    // Bitrix24
    if (application.bitrix24_id) {
      message += `🔄 <b>Bitrix24 ID:</b> ${application.bitrix24_id}\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `<code>ID: ${application.application_number} | TMA: ${application.id}</code>`;
    
    // Примечания
    if (application.notes) {
      message += `\n📝 <i>${application.notes.substring(0, 200)}${application.notes.length > 200 ? '...' : ''}</i>`;
    }
    
    return message;
  }
  
  // Вспомогательные методы
  getStatusInfo(status) {
    const statusMap = {
      'new': { emoji: '🆕', text: 'Новая', action: 'создана' },
      'assigned_to_otk': { emoji: '👤', text: 'Назначена ОТК', action: 'назначена' },
      'in_progress': { emoji: '🔧', text: 'В работе', action: 'в работе' },
      'accepted': { emoji: '✅', text: 'Принята', action: 'принята' },
      'rejected': { emoji: '❌', text: 'Отклонена', action: 'отклонена' },
      'in_resolution': { emoji: '🔄', text: 'В устранении', action: 'в устранении' },
      'mixed_status': { emoji: '⚡', text: 'Смешанный', action: 'смешанный статус' },
      'kr_pending': { emoji: '📋', text: 'КР на согласовании', action: 'КР на согласовании' },
      'defect': { emoji: '🚫', text: 'Брак', action: 'брак' }
    };
    
    return statusMap[status] || { emoji: '📋', text: status, action: status };
  }
  
  getActionText(action) {
    const textMap = {
      'created': '📋 Новая',
      'updated': '🔄 Обновлена',
      'assigned': '👤 Назначена',
      'rejected': '❌ Отклонена',
      'accepted': '✅ Принята',
      'in_progress': '🔧 В работе'
    };
    return textMap[action] || 'Заявка';
  }
  
  // Добавление в очередь синхронизации
  async addToSyncQueue(entity, targetSystem, operation, error = null) {
    try {
      const db = require('knex')(require('../../knexfile')[process.env.NODE_ENV || 'development']);
      
      await db('sync_queue').insert({
        entity_type: 'application',
        entity_id: entity.id,
        target_system: targetSystem,
        operation: operation,
        payload: JSON.stringify(entity),
        status: 'pending',
        error_message: error,
        created_at: new Date()
      });
      
      console.log(`TelegramService: задача добавлена в очередь ${targetSystem}/${operation}`);
    } catch (queueError) {
      console.error('TelegramService: ошибка добавления в очередь:', queueError.message);
    }
  }
}

module.exports = new TelegramService();