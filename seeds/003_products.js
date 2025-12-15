exports.seed = async function(knex) {
  // Очищаем таблицу и сбрасываем sequence
  await knex.raw('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
  
  // Inserts seed entries (теперь без указания ID, они сгенерируются автоматически)
  return knex('products').insert([
    {
      name: 'Крышка ТМГ',
      lot_id: 1,
      type: 'finished_product',
      unit: 'pcs',
      inspection_time_minutes: 45,
      checklist_text: '1. Проверить сварные швы\n2. Проверить геометрию\n3. Проверить покраску',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Корпус трансформатора',
      lot_id: 2,
      type: 'assembly',
      unit: 'pcs',
      inspection_time_minutes: 60,
      checklist_text: '1. Проверить герметичность\n2. Проверить крепеж\n3. Проверить изоляцию',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Фланец крепления',
      lot_id: 3,
      type: 'detail',
      unit: 'set',
      inspection_time_minutes: 20,
      checklist_text: '1. Проверить отверстия\n2. Проверить резьбу\n3. Проверить чистоту поверхности',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Рама основания',
      lot_id: 1,
      type: 'semi_finished',
      unit: 'pcs',
      inspection_time_minutes: 30,
      checklist_text: '1. Проверить сварочные швы\n2. Проверить параллельность\n3. Проверить размеры',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Комплект крепежа М12',
      lot_id: 3,
      type: 'detail',
      unit: 'set',
      inspection_time_minutes: 15,
      checklist_text: '1. Проверить количество\n2. Проверить резьбу\n3. Проверить маркировку',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};