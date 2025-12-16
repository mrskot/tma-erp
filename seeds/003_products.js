<<<<<<< HEAD
﻿// seeds/003_products_fixed.js
exports.seed = async function(knex) {
  // Сначала получим ID существующих участков
  const lots = await knex('lots').select('id', 'name').orderBy('id');
  console.log('📋 Найдены участки:', lots);
  
  if (lots.length === 0) {
    console.error('❌ Нет участков в БД! Сначала запусти сиды участков.');
    return;
  }
  
  // Предполагаем, что есть минимум 3 участка
  const lotIds = lots.map(l => l.id);
  
  await knex('products').del();
  
  // Тестовые продукты с корректными lot_id
  const products = [
    {
      name: 'Трансформатор ТМ-100/10',
      type: 'finished_product',
      unit: 'pcs',
      checklist_text: '1. Проверить целостность корпуса\n2. Измерить сопротивление изоляции\n3. Проверить маркировку\n4. Убедиться в наличии паспорта',
      inspection_time_minutes: 45,
      default_otk_inspector_telegram_id: 'otk_1',
      lot_id: lotIds[0] || null, // Первый участок
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Трансформатор ТМ-250/10', 
      type: 'finished_product',
      unit: 'pcs',
      checklist_text: '1. Визуальный осмотр\n2. Проверка креплений\n3. Измерение параметров\n4. Испытание повышенным напряжением',
      inspection_time_minutes: 60,
      default_otk_inspector_telegram_id: 'otk_2',
      lot_id: lotIds[0] || null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Бак трансформатора',
      type: 'assembly',
      unit: 'pcs', 
      checklist_text: '1. Проверить качество сварных швов\n2. Проверить отсутствие деформаций\n3. Проверить резьбовые соединения\n4. Провести испытание на герметичность',
      inspection_time_minutes: 30,
      lot_id: lotIds[0] || null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Обмотка ВН',
      type: 'semi_finished',
      unit: 'set',
      checklist_text: '1. Проверить сопротивление изоляции\n2. Проверить отсутствие замыканий\n3. Проверить геометрические размеры\n4. Проверить маркировку выводов',
      inspection_time_minutes: 25,
      lot_id: lotIds[1] || null, // Второй участок
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Обмотка НН',
      type: 'semi_finished',
      unit: 'set',
      checklist_text: '1. Проверить целостность провода\n2. Измерить сопротивление постоянному току\n3. Проверить межвитковую изоляцию\n4. Проверить пропитку',
      inspection_time_minutes: 20,
      lot_id: lotIds[1] || null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Магнитопровод',
      type: 'semi_finished',
      unit: 'set',
      checklist_text: '1. Проверить качество сборки\n2. Проверить затяжку стяжных шпилек\n3. Проверить отсутствие заусенцев\n4. Проверить изоляцию пластин',
      inspection_time_minutes: 15,
      lot_id: lotIds[1] || null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Крышка трансформатора',
      type: 'assembly',
      unit: 'pcs',
      checklist_text: '1. Проверить плоскостность\n2. Проверить отверстия под вводы\n3. Проверить сварные швы\n4. Проверить покраску',
      inspection_time_minutes: 15,
      lot_id: lotIds[2] || null, // Третий участок
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Ввод ВН 10кВ',
      type: 'assembly',
      unit: 'pcs',
      checklist_text: '1. Проверить герметичность\n2. Проверить изоляцию\n3. Проверить контактную часть\n4. Проверить маркировку',
      inspection_time_minutes: 10,
      lot_id: lotIds[2] || null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Ввод НН 0.4кВ',
      type: 'assembly', 
      unit: 'pcs',
      checklist_text: '1. Проверить целостность\n2. Проверить изоляцию\n3. Проверить болтовые соединения\n4. Проверить маркировку',
      inspection_time_minutes: 8,
      lot_id: lotIds[2] || null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      name: 'Трансформатор в сборе',
      type: 'finished_product',
      unit: 'pcs',
      checklist_text: '1. Полная сборка\n2. Испытание на холостом ходу\n3. Испытание под нагрузкой\n4. Проверка защиты\n5. Оформление документов',
      inspection_time_minutes: 120,
      default_otk_inspector_telegram_id: 'otk_1',
      lot_id: lotIds[0] || null,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ];
  
  await knex('products').insert(products);
  console.log('✅ Сиды продуктов созданы: ' + products.length + ' шт.');
  
  // Выведем итог для проверки
  const insertedProducts = await knex('products')
    .select('id', 'name', 'lot_id', 'type')
    .orderBy('id');
  
  console.log('📊 Созданные продукты:');
  insertedProducts.forEach(p => {
    console.log(`  ${p.id}. ${p.name} (lot: ${p.lot_id}, type: ${p.type})`);
  });
=======
﻿exports.seed = async function(knex) {
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
>>>>>>> 474115919bb1c599bbd4db3e37acfd55872630d9
};