exports.seed = async function(knex) {
  await knex('users').del();
  
  await knex('users').insert([
    {
      telegram_id: 'master1',
      username: 'master_ivanov',
      first_name: 'Иван',
      last_name: 'Иванов',
      pin_code: '1111',
      role: 'master'
    },
    {
      telegram_id: 'otk1',
      username: 'otk_sidorov',
      first_name: 'Алексей',
      last_name: 'Сидоров',
      pin_code: '2222',
      role: 'otk_inspector'
    },
    {
      telegram_id: 'admin1',
      username: 'admin_system',
      first_name: 'Администратор',
      pin_code: '9999',
      role: 'admin'
    }
  ]);
  
  console.log('✅ Тестовые пользователи созданы');
};
