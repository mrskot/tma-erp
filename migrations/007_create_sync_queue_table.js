exports.up = function(knex) {
  return knex.schema.createTable('sync_queue', (table) => {
    table.bigIncrements('id').primary();
    
    // Сущность
    table.string('entity_type', 20).notNullable()
      .comment('application, discrepancy, user, lot, product');
    
    table.bigInteger('entity_id').notNullable()
      .comment('ID в локальной БД');
    
    // Операция
    table.string('operation', 20).notNullable()
      .comment('create, update, delete, sync_status');
    
    // Полезная нагрузка
    table.jsonb('payload').nullable()
      .comment('Данные для отправки');
    
    table.jsonb('response').nullable()
      .comment('Ответ от внешней системы');
    
    // Настройки
    table.string('target_system', 20).defaultTo('bitrix24')
      .comment('bitrix24, telegram, other');
    
    table.string('endpoint', 500).nullable()
      .comment('URL для отправки');
    
    // Статус
    table.string('status', 20).defaultTo('pending')
      .comment('pending, processing, success, failed, retry');
    
    table.integer('retry_count').defaultTo(0);
    table.integer('max_retries').defaultTo(3);
    table.text('error_message').nullable();
    
    // Время
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('processed_at').nullable();
    table.timestamp('next_retry_at').nullable();
    
    // Индексы
    table.index(['entity_type', 'entity_id']);
    table.index(['status']);
    table.index(['target_system']);
    table.index(['created_at']);
    table.index(['next_retry_at']);
    table.index(['retry_count']);
    
    table.comment('Очередь синхронизации с внешними системами');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('sync_queue');
};