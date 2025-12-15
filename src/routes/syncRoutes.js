// src/routes/syncRoutes.js
const express = require('express');
const router = express.Router();
const Bitrix24Service = require('../services/Bitrix24Service');

// Получить статистику очереди
router.get('/queue', async (req, res) => {
  try {
    const db = require('../../knexfile')[process.env.NODE_ENV || 'development'];
    const knex = require('knex')(db);
    
    const queue = await knex('sync_queue')
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(100);
    
    const stats = await knex('sync_queue')
      .select('status', knex.raw('COUNT(*) as count'))
      .groupBy('status');
    
    res.json({
      success: true,
      count: queue.length,
      stats: stats.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {}),
      queue: queue
    });
    
  } catch (error) {
    console.error('Get sync queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении очереди синхронизации'
    });
  }
});

// Запустить обработку очереди
router.post('/process', async (req, res) => {
  try {
    const db = require('../../knexfile')[process.env.NODE_ENV || 'development'];
    const knex = require('knex')(db);
    
    // Запускаем обработку
    await Bitrix24Service.processQueue(knex);
    
    res.json({
      success: true,
      message: 'Обработка очереди синхронизации запущена'
    });
    
  } catch (error) {
    console.error('Process sync queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обработке очереди'
    });
  }
});

// Очистить неудачные задачи
router.delete('/clear-failed', async (req, res) => {
  try {
    const db = require('../../knexfile')[process.env.NODE_ENV || 'development'];
    const knex = require('knex')(db);
    
    const result = await knex('sync_queue')
      .where('status', 'failed')
      .delete();
    
    res.json({
      success: true,
      message: `Удалено ${result} неудачных задач`,
      deleted: result
    });
    
  } catch (error) {
    console.error('Clear failed syncs error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при очистке очереди'
    });
  }
});

// Принудительная синхронизация конкретной задачи
router.post('/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    const db = require('../../knexfile')[process.env.NODE_ENV || 'development'];
    const knex = require('knex')(db);
    
    // Сбрасываем статус задачи
    await knex('sync_queue')
      .where('id', id)
      .update({
        status: 'pending',
        retry_count: 0,
        error_message: null,
        next_retry_at: null,
        processed_at: null
      });
    
    res.json({
      success: true,
      message: 'Задача отправлена на повторную обработку'
    });
    
  } catch (error) {
    console.error('Retry sync task error:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при повторной отправке задачи'
    });
  }
});

module.exports = router;