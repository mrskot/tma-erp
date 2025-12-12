exports.seed = async function(knex) {
  const apps = await knex('applications').select('id').orderBy('id');
  
  if (apps.length < 2) return;
  
  await knex('discrepancies').del();
  
  await knex('discrepancies').insert([
    {
      discrepancy_number: 'DISC-20241209-001-01',
      application_id: apps[0].id,
      description: 'Несоответствие сварки',
      type: 'defect',
      responsible_master_telegram_id: 'master1',
      defect_code: 'S01-H-2',
      status: 'defect_confirmed',
      resolution_type: 'defect',
      resolution_notes: 'Брак подтверждён',
      priority: 1,
      detected_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      discrepancy_number: 'DISC-20241209-002-01',
      application_id: apps[1].id,
      description: 'Несоответствие чертежу',
      type: 'kr_agreement',
      responsible_master_telegram_id: 'master2',
      defect_code: 'M03-E-3',
      status: 'in_resolution',
      priority: 2,
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      detected_at: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ]);
  
  console.log('✅ Тестовые несоответствия созданы');
};
