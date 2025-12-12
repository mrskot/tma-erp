exports.seed = async function(knex) {
  const lots = await knex('lots').select('id').orderBy('id');
  const products = await knex('products').select('id').orderBy('id');
  
  await knex('applications').del();
  
  await knex('applications').insert([
    {
      application_number: 'APP-20241209-001',
      lot_id: lots[0].id,
      product_id: products[0].id,
      creator_telegram_id: 'master1',
      status: 'new',
      quantity: 5,
      batch_number: 'BATCH-2024-045',
      notes: 'Срочная заявка'
    },
    {
      application_number: 'APP-20241209-002',
      lot_id: lots[1] ? lots[1].id : lots[0].id,
      product_id: products[1] ? products[1].id : products[0].id,
      creator_telegram_id: 'master2',
      status: 'assigned_to_otk',
      quantity: 10,
      batch_number: 'BATCH-2024-046',
      otk_inspector_telegram_id: 'otk1',
      assigned_at: new Date(Date.now() - 30 * 60 * 1000),
      notes: 'Партия для экспорта'
    }
  ]);
  
  console.log('✅ Тестовые заявки созданы');
};
