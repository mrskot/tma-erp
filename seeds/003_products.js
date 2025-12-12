exports.seed = async function(knex) {
  await knex('products').del();
  
  await knex('products').insert([
    {
      name: 'Крышка ТМГ',
      drawing_number: 'ТМГ-045.01',
      type: 'finished_product',
      unit: 'pcs',
      description: 'Крышка трансформаторного масляного герметика'
    },
    {
      name: 'Корпус ТМГ',
      drawing_number: 'ТМГ-045.02',
      type: 'finished_product',
      unit: 'pcs',
      description: 'Корпус трансформатора'
    },
    {
      name: 'Вал приводной',
      drawing_number: 'МХ-120.05',
      type: 'semi_finished',
      unit: 'pcs',
      description: 'Заготовка вала для механообработки'
    },
    {
      name: 'Фланец крепления',
      drawing_number: 'ФЛ-045.12',
      type: 'assembly',
      unit: 'set',
      description: 'Комплект фланцев для сборки'
    },
    {
      name: 'Бак трансформатора Т-100',
      drawing_number: 'БТ-100.01',
      type: 'finished_product',
      unit: 'pcs',
      description: 'Бак для трансформатора 100 кВа'
    }
  ]);
  
  console.log('✅ Тестовые изделия созданы');
};
