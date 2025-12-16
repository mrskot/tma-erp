// seeds/002_lots.js - исправленная версия
exports.seed = async function(knex) {
  await knex('lots').del();
  
  const lots = [
    {
      name: 'Участок сборки трансформаторов',
      // code: 'CEH1', ← УБРАТЬ, нет такой колонки
      priority_level: 1,
      manager_telegram_id: 'master_ivan',
      distance_to_otk_meters: 50,
      is_active: true
    },
    {
      name: 'Участок обмоток',
      // code: 'CEH2', ← УБРАТЬ
      priority_level: 2,
      manager_telegram_id: 'master_alex',
      distance_to_otk_meters: 75,
      is_active: true
    },
    {
      name: 'Участок покраски и сушки',
      // code: 'CEH3', ← УБРАТЬ  
      priority_level: 3,
      manager_telegram_id: 'master_maria',
      distance_to_otk_meters: 100,
      is_active: true
    }
  ];
  
  await knex('lots').insert(lots);
  console.log('✅ Сиды участков созданы: ' + lots.length + ' шт.');
};