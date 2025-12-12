exports.seed = async function(knex) {
  await knex('lots').del();
  
  await knex('lots').insert([
    {
      name: 'Цех 1.1 - Сварка',
      description: 'Участок сварочных работ',
      manager_telegram_id: 'master1',
      priority_level: 1,
      distance_to_otk_meters: 150
    },
    {
      name: 'Цех 1.2 - Механообработка',
      description: 'Токарные и фрезерные работы',
      manager_telegram_id: 'master2',
      priority_level: 2,
      distance_to_otk_meters: 200
    },
    {
      name: 'Цех 2.1 - Сборка',
      description: 'Сборочный участок',
      manager_telegram_id: 'master1',
      priority_level: 3,
      distance_to_otk_meters: 300
    }
  ]);
  
  console.log('✅ Тестовые участки созданы');
};
