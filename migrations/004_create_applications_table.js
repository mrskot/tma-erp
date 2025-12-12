exports.up = function(knex) {
  return knex.schema.createTable('applications', (table) => {
    table.bigIncrements('id').primary();
    table.string('application_number', 50).notNullable();
    
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
    
    table.string('creator_telegram_id', 50).notNullable();
    
    table.enum('status', [
      'new', 'assigned_to_otk', 'in_progress', 'accepted', 
      'rejected', 'in_resolution', 'mixed_status', 'kr_pending', 'defect'
    ]).defaultTo('new');
    
    table.timestamp('desired_inspection_time');
    table.integer('quantity').defaultTo(1);
    table.string('batch_number', 100);
    table.text('notes');
    table.string('otk_inspector_telegram_id', 50);
    table.timestamp('assigned_at');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.integer('sla_response_minutes');
    table.integer('sla_inspection_minutes');
    table.integer('discrepancy_count').defaultTo(0);
    table.jsonb('resolution_summary').defaultTo('{"fixed": 0, "kr_pending": 0, "defect": 0, "political": 0}');
    table.integer('bitrix24_id').unique();
    table.integer('bitrix24_process_stage');
    table.timestamps(true, true);
    
    table.index(['application_number']);
    table.index(['status']);
    table.index(['lot_id']);
    table.index(['product_id']);
    table.index(['creator_telegram_id']);
    table.index(['otk_inspector_telegram_id']);
    table.index(['created_at']);
    table.index(['desired_inspection_time']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('applications');
};
