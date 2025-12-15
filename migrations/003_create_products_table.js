exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable().comment('Название типа изделия');
    
    // Участок, на котором производится
    table.bigInteger('lot_id')
      .unsigned()
      .references('id')
      .inTable('lots')
      .onDelete('SET NULL')
      .comment('Участок производства');
    
    // Контролёр ОТК по умолчанию
    table.string('default_otk_inspector_telegram_id', 50)
      .nullable()
      .comment('Telegram ID контролёра ОТК по умолчанию для этого типа изделия');
    
    // Тип изделия - добавляем 'detail' (деталь)
    table.enum('type', ['semi_finished', 'assembly', 'finished_product', 'detail'])
      .defaultTo('finished_product')
      .comment('Тип: semi_finished-полуфабрикат, assembly-узел, finished_product-готовая продукция, detail-деталь');
    
    // Единица измерения
    table.enum('unit', ['pcs', 'set'])
      .defaultTo('pcs')
      .comment('Единица измерения: pcs-шт, set-компл.');
    
    // Время на приёмку (минуты)
    table.integer('inspection_time_minutes')
      .defaultTo(30)
      .comment('Примерное время на приёмку ОТК (минуты)');
    
    // Чек-лист (текст для справки)
    table.text('checklist_text').comment('Чек-лист приёмки (текстовый формат)');
    
    // Активность
    table.boolean('is_active').defaultTo(true).comment('Активен ли тип изделия');
    
    // Интеграция с Bitrix24
    table.integer('bitrix24_id').unique().comment('ID в Bitrix24');
    
    // Временные метки
    table.timestamps(true, true);
    
    // Индексы
    table.index(['name']);
    table.index(['lot_id']);
    table.index(['default_otk_inspector_telegram_id'], 'products_default_otk_idx');
    table.index(['type']);
    table.index(['is_active']);
    
    table.comment('Типы изделий (номенклатура)');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};