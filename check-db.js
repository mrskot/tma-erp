// check-db.js
const knex = require('knex');
const knexfile = require('./knexfile');

async function checkDatabase() {
  console.log('🔍 Проверяю базу данных...');
  
  const db = knex(knexfile.development);
  
  try {
    // Проверяем соединение
    await db.raw('SELECT 1+1 as result');
    console.log('✅ Соединение с БД установлено');
    
    // Список таблиц
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Таблицы в базе:');
    tables.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Проверяем конкретные таблицы
    console.log('\n🔎 Проверяем ключевые таблицы:');
    
    const requiredTables = ['users', 'lots', 'products', 'applications', 'discrepancies', 'discrepancy_history'];
    
    for (const tableName of requiredTables) {
      const exists = await db.schema.hasTable(tableName);
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'существует' : 'ОТСУТСТВУЕТ!'}`);
      
      if (exists) {
        const count = await db(tableName).count('* as total').first();
        console.log(`     📊 записей: ${count.total}`);
      }
    }
    
    // Проверяем маршрут discrepancies
    console.log('\n🚪 Проверяем endpoint /api/v1/discrepancies:');
    const hasDiscrepancies = await db.schema.hasTable('discrepancies');
    if (hasDiscrepancies) {
      const discrepancies = await db('discrepancies').select('*').limit(5);
      console.log(`   ✅ Таблица есть, записей: ${discrepancies.length}`);
      console.log('   📋 Примеры записей:');
      discrepancies.forEach(d => {
        console.log(`     - ${d.discrepancy_number}: ${d.description} (${d.status})`);
      });
    } else {
      console.log('   ❌ Таблица discrepancies НЕ существует!');
      console.log('\n   🚨 ПРИЧИНА ОШИБКИ: Миграции не выполнены!');
      console.log('   💡 РЕШЕНИЕ: Выполни команду:');
      console.log('       npx knex migrate:latest');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await db.destroy();
    console.log('\n🔒 Соединение закрыто');
  }
}

checkDatabase();