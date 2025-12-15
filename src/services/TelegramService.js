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
      
      // Добавляем в очередь на сохранение в БД
      await this.addToMessageQueue(application.id, messageId, 'channel', action);
      
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
  
  // Форматирование сообщения
  formatApplicationMessage(application, action) {
    const statusEmoji = this.getStatusEmoji(application.status);
    const actionText = this.getActionText(action);
    
    let message = `
<b>${actionText} заявка #${application.application_number}</b>
────────────────────
🏭 <b>Участок:</b> ${application.lot_name || 'Не указан'}
🔧 <b>Изделие:</b> ${application.product_name || 'Не указан'}
`;
    
    if (application.drawing_number) {
      message += `📐 <b>Чертёж:</b> ${application.drawing_number}\n`;
    }
    
    if (application.product_serial_number) {
      message += `🔢 <b>Серийный:</b> ${application.product_serial_number}\n`;
    }
    
    if (application.quantity) {
      message += `📦 <b>Количество:</b> ${application.quantity} ${application.product_unit || 'шт'}\n`;
    }
    
    message += `
👤 <b>Создал:</b> ${application.creator_telegram_id}
⏰ <b>Время:</b> ${new Date(application.created_at).toLocaleTimeString('ru-RU')}
📊 <b>Статус:</b> ${statusEmoji} ${this.getStatusText(application.status)}
`;
    
    if (application.bitrix24_id) {
      message += `🔄 <b>Bitrix24:</b> #${application.bitrix24_id}\n`;
    }
    
    message += `────────────────────\n`;
    message += `<code>ID: ${application.application_number}</code>`;
    
    if (application.notes) {
      message += `\n📝 <i>${application.notes}</i>`;
    }
    
    return message;
  }
  
  // Вспомогательные методы
  getStatusEmoji(status) {
    const emojiMap = {
      'new': '🆕',
      'assigned_to_otk': '👤',
      'in_progress': '🔧',
      'accepted': '✅',
      'rejected': '❌',
      'in_resolution': '🔄',
      'mixed_status': '⚡',
      'kr_pending': '📋',
      'defect': '🚫'
    };
    return emojiMap[status] || '📋';
  }
  
  getStatusText(status) {
    const textMap = {
      'new': 'Новая',
      'assigned_to_otk': 'Назначена ОТК',
      'in_progress': 'В работе',
      'accepted': 'Принята',
      'rejected': 'Отклонена',
      'in_resolution': 'В устранении',
      'mixed_status': 'Смешанный',
      'kr_pending': 'КР на согласовании',
      'defect': 'Брак'
    };
    return textMap[status] || status;
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
  
  // Добавление в очередь сообщений (для БД)
  async addToMessageQueue(appId, messageId, type, action) {
    // Пока просто логируем
    console.log(`TelegramService: message queue - app:${appId}, msg:${messageId}, type:${type}, action:${action}`);
  }
  
  // Добавление в очередь синхронизации
  async addToSyncQueue(entity, targetSystem, operation, error = null) {
    // Пока просто логируем
    console.log(`TelegramService: sync queue - ${targetSystem}, ${operation}, error: ${error}`);
  }
}

module.exports = new TelegramService();