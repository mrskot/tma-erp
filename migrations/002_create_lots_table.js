exports.up = function(knex) {
  return knex.schema.createTable('lots', (table) => {
    table.bigIncrements('id').primary();
    
    // Основная информация
    table.string('name', 255).notNullable().unique().comment('Название участка (цех, линия, зона)');
    table.text('description').nullable().comment('Описание участка');
    
    // Руководство
    table.string('manager_telegram_id', 50).notNullable().comment('Telegram ID основного мастера');
    table.string('deputy_manager_telegram_id', 50).nullable().comment('Telegram ID заместителя мастера');
    
    // Приоритет для ОТК (1-высший → 5-низший)
    table.integer('priority_level')
      .notNullable()
      .defaultTo(3)
      .comment('Приоритет ОТК: 1-высший, 5-низший');
    
    // Расстояние до кабинета ОТК (метры)
    table.integer('distance_to_otk_meters').nullable().comment('Расстояние до ОТК в метрах');
    
    // Рабочие часы участка
    table.time('working_hours_start').defaultTo('08:00:00').comment('Начало рабочего дня');
    table.time('working_hours_end').defaultTo('20:00:00').comment('Конец рабочего дня');
    
    // Статусы
    table.boolean('is_active').defaultTo(true).comment('Активен ли участок');
    table.boolean('requires_urgent_attention').defaultTo(false).comment('Требует срочного внимания ОТК');
    
    // Bitrix24 интеграция
    table.integer('bitrix24_id').nullable().unique().comment('ID в Bitrix24');
    table.boolean('is_synced_with_bitrix24').defaultTo(false).comment('Синхронизирован с Bitrix24');
    
    // Временные метки
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Индексы для быстрого поиска
    table.index(['manager_telegram_id'], 'lots_manager_idx');
    table.index(['deputy_manager_telegram_id'], 'lots_deputy_idx');
    table.index(['priority_level'], 'lots_priority_idx');
    table.index(['distance_to_otk_meters'], 'lots_distance_idx');
    table.index(['is_active'], 'lots_active_idx');
    table.index(['requires_urgent_attention'], 'lots_urgent_idx');
    table.index(['bitrix24_id'], 'lots_bitrix24_idx');
    table.index(['name'], 'lots_name_idx');
  });
};

// ← ДОБАВЛЯЕМ ФУНКЦИЮ DOWN!
exports.down = function(knex) {
  return knex.schema.dropTable('lots');
};