// migrations/006_create_discrepancy_history_table.js
exports.up = function(knex) {
  return knex.schema.createTable('discrepancy_history', (table) => {
    table.bigIncrements('id').primary();
    
    table.bigInteger('discrepancy_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('discrepancies')
      .onDelete('CASCADE');
    
    table.string('changed_by_telegram_id', 50).notNullable().comment('Кто изменил');
    table.string('action', 50).notNullable().comment('Действие');
    table.jsonb('changes').comment('Изменения (JSON)');
    table.text('comment').comment('Комментарий');
    
    table.timestamps(true, true);
    
    table.index(['discrepancy_id']);
    table.index(['changed_by_telegram_id']);
    table.index(['created_at']);
    
    table.comment('История изменений несоответствий');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('discrepancy_history');
};
