// seeds/003_products_fixed.js
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
};