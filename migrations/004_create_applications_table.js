exports.up = function(knex) {
  return knex.schema.createTable('applications', (table) => {
    table.bigIncrements('id').primary();
    table.string('application_number', 50).notNullable();
    
    // Связи
    table.bigInteger('lot_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('lots')
      .onDelete('CASCADE');
    
    table.bigInteger('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    
    // Основные данные
    table.string('creator_telegram_id', 50).notNullable();
    table.string('drawing_number', 100).nullable(); // Номер чертежа
    table.string('product_serial_number', 100).nullable(); // Серийный номер изделия
    table.string('transformer_type', 100).nullable(); // Тип трансформатора
    
    // Статус
    table.enum('status', [
      'new', 'assigned_to_otk', 'in_progress', 'accepted', 
      'rejected', 'in_resolution', 'mixed_status', 'kr_pending', 'defect'
    ]).defaultTo('new');
    
    // Время
    table.timestamp('desired_inspection_time').nullable();
    table.integer('quantity').defaultTo(1);
    table.string('batch_number', 100).nullable();
    table.text('notes').nullable();
    
    // ОТК
    table.string('otk_inspector_telegram_id', 50).nullable();
    table.timestamp('assigned_at').nullable();
    table.timestamp('started_at').nullable();
    table.timestamp('completed_at').nullable();
    
    // SLA
    table.integer('sla_response_minutes').nullable();
    table.integer('sla_inspection_minutes').nullable();
    
    // Несоответствия
    table.integer('discrepancy_count').defaultTo(0);
    table.jsonb('resolution_summary').defaultTo('{"fixed": 0, "kr_pending": 0, "defect": 0, "political": 0}');
    
    // ИНТЕГРАЦИЯ (НОВОЕ!)
    // Bitrix24
    table.integer('bitrix24_id').unique().nullable();
    table.integer('bitrix24_process_stage').nullable();
    table.boolean('is_synced_with_bitrix24').defaultTo(false);
    table.string('sync_status', 20).defaultTo('pending');
    table.integer('sync_retry_count').defaultTo(0);
    table.text('sync_error').nullable();
    table.jsonb('bitrix_discrepancy_ids').defaultTo('[]');
    
    // Telegram
    table.string('telegram_channel_message_id', 100).nullable();
    table.jsonb('telegram_message_ids').defaultTo('[]');
    
    // Фото
    table.boolean('has_mki_photos').defaultTo(false);
    table.jsonb('mki_photo_ids').defaultTo('[]');
    table.jsonb('discrepancy_ids').defaultTo('[]');
    
    // Метки времени
    table.timestamps(true, true);
    
    // Индексы
    table.index(['application_number']);
    table.index(['status']);
    table.index(['lot_id']);
    table.index(['product_id']);
    table.index(['creator_telegram_id']);
    table.index(['otk_inspector_telegram_id']);
    table.index(['created_at']);
    table.index(['desired_inspection_time']);
    table.index(['drawing_number']);
    table.index(['product_serial_number']);
    table.index(['bitrix24_id']);
    table.index(['sync_status']);
    table.index(['is_synced_with_bitrix24']);
    table.index(['telegram_channel_message_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('applications');
};