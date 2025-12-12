exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.string('telegram_id', 50).unique().notNullable();
    table.string('username', 255);
    table.string('first_name', 255);
    table.string('last_name', 255);
    table.string('pin_code', 4);
    table.string('password_hash', 255);
    
    table.enum('role', [
      'worker',
      'master',
      'otk_inspector',
      'admin',
      'super_admin',
      'quality_director'
    ]).defaultTo('worker');
    
    table.boolean('is_active').defaultTo(true);
    table.jsonb('permissions');
    table.integer('bitrix24_id').unique();
    
    table.bigInteger('created_by_user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index(['telegram_id']);
    table.index(['role']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
