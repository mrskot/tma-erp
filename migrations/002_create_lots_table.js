exports.up = function(knex) {
  return knex.schema.createTable('lots', (table) => {
    table.bigIncrements('id').primary();
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('manager_telegram_id', 50).notNullable();
    table.string('substitute_telegram_id', 50);
    table.integer('priority_level').defaultTo(3);
    table.integer('distance_to_otk_meters');
    table.integer('bitrix24_id').unique();
    table.timestamps(true, true);
    
    table.index(['manager_telegram_id']);
    table.index(['priority_level']);
    table.index(['name']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('lots');
};
