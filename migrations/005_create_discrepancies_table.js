// migrations/005_create_discrepancies_table.js
exports.up = function(knex) {
  return knex.schema.createTable('discrepancies', (table) => {
    table.bigIncrements('id').primary();
    
    // Связь с заявкой
    table.bigInteger('application_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE')
      .comment('ID заявки');
    
    // Основная информация
    table.string('discrepancy_number', 50).notNullable().comment('Номер несоответствия');
    table.text('description').notNullable().comment('Описание несоответствия');
    
    // Тип несоответствия
    table.enum('type', [
      'fix',           // Устранить
      'kr_agreement',  // Карточка разрешения
      'defect',        // Брак
      'political'      // Политическое закрытие
    ]).defaultTo('fix').comment('Тип несоответствия');
    
    // Ответственный
    table.string('responsible_master_telegram_id', 50).notNullable().comment('Telegram ID ответственного мастера');
    
    // Код несоответствия (4 уровня)
    table.string('defect_code', 20).comment('Код несоответствия (формат: X-YY-Z-N)');
    table.string('defect_category', 1).comment('Категория (S-Сварка, M-Механообработка и т.д.)');
    table.string('defect_type_code', 2).comment('Код типа дефекта');
    table.string('defect_cause', 1).comment('Причина (E-Оборудование, H-Человек и т.д.)');
    table.integer('defect_severity').comment('Серьёзность (1-критичный, 4-информационный)');
    
    // Статус
    table.enum('status', [
      'new',           // Новое
      'in_analysis',   // В анализе
      'in_resolution', // В устранении
      'ready_for_control', // Готово к контролю
      'closed',        // Закрыто
      'kr_pending',    // КР на согласовании
      'defect_confirmed' // Брак подтверждён
    ]).defaultTo('new').comment('Статус несоответствия');
    
    // Данные устранения
    table.enum('resolution_type', [
      'fixed',          // Устранено
      'kr_approved',    // КР согласовано
      'kr_rejected',    // КР отклонено
      'defect',         // Брак
      'political_close' // Политическое закрытие
    ]).comment('Тип закрытия');
    
    table.text('resolution_notes').comment('Примечания по устранению');
    table.string('resolution_documents', 500).comment('Ссылки на документы (JSON массив)');
    table.string('approved_by_telegram_id', 50).comment('Telegram ID утвердившего');
    
    // Временные метки
    table.timestamp('detected_at').defaultTo(knex.fn.now()).comment('Время обнаружения');
    table.timestamp('assigned_at').comment('Время назначения');
    table.timestamp('started_at').comment('Время начала устранения');
    table.timestamp('completed_at').comment('Время завершения');
    table.integer('resolution_time_minutes').comment('Время устранения (минуты)');
    
    // Для КР (Карточка разрешения)
    table.string('kr_document_id', 100).comment('Номер КР документа');
    table.jsonb('kr_approvers').comment('Список согласующих (JSON массив)');
    table.timestamp('kr_approved_at').comment('Время согласования КР');
    table.timestamp('kr_valid_until').comment('КР действует до');
    
    // Для брака
    table.string('defect_act_number', 100).comment('Номер акта о браке');
    table.decimal('defect_cost', 12, 2).comment('Стоимость брака');
    table.text('defect_cause_analysis').comment('Анализ причины брака');
    
    // Для политического закрытия
    table.string('political_order_number', 100).comment('Номер приказа/распоряжения');
    table.text('political_reason').comment('Причина политического закрытия');
    table.string('political_approved_by', 50).comment('Кто утвердил');
    
    // Местоположение/фото
    table.string('location_in_product', 255).comment('Местоположение в изделии');
    table.string('photo_urls', 500).comment('Ссылки на фото (JSON массив)');
    
    // Приоритет
    table.integer('priority').defaultTo(3).comment('Приоритет (1-высокий, 5-низкий)');
    
    // Метки времени
    table.timestamps(true, true);
    
    // Индексы
    table.index(['application_id']);
    table.index(['discrepancy_number']);
    table.index(['status']);
    table.index(['responsible_master_telegram_id']);
    table.index(['type']);
    table.index(['defect_code']);
    table.index(['priority']);
    table.index(['detected_at']);
    
    table.comment('Таблица несоответствий (дефектов)');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('discrepancies');
};