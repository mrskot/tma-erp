exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable();
    table.string('drawing_number', 100).notNullable();
    table.string('serial_number', 100);
    
    table.enum('type', ['semi_finished', 'assembly', 'finished_product'])
      .defaultTo('finished_product');
    
    table.enum('unit', ['pcs', 'set']).defaultTo('pcs');
    
    table.bigInteger('next_stage_product_id')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('SET NULL');
    
    table.bigInteger('previous_stage_product_id')
      .unsigned()
      .references('id')
      .inTable('products')
      .onDelete('SET NULL');
    
    table.jsonb('technical_requirements');
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.integer('bitrix24_id').unique();
    table.timestamps(true, true);
    
    table.index(['drawing_number']);
    table.index(['serial_number']);
    table.index(['type']);
    table.index(['name']);
    table.unique(['drawing_number', 'serial_number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('products');
};
