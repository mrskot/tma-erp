const Lot = require('../models/Lot');
const User = require('../models/User');

class LotController {
  // Получить все участки
  static async getAll(req, res) {
    try {
      const { role, telegram_id } = req.query;
      
      let lots;
      
      if (role && ['admin', 'super_admin', 'quality_director'].includes(role)) {
        // Администраторы видят все участки
        lots = await Lot.findAll();
      } else if (role === 'master' && telegram_id) {
        // Мастера видят только свои участки
        lots = await Lot.findByManager(telegram_id);
      } else {
        // По умолчанию - все участки (ограниченные данные)
        lots = await Lot.findAll();
        lots = lots.map(lot => ({
          id: lot.id,
          name: lot.name,
          priority_level: lot.priority_level,
          manager_telegram_id: lot.manager_telegram_id
        }));
      }
      
      res.json({
        success: true,
        count: lots.length,
        lots
      });
      
    } catch (error) {
      console.error('Get all lots error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении списка участков'
      });
    }
  }

  // Получить участок по ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const lot = await Lot.findById(id);
      
      if (!lot) {
        return res.status(404).json({
          success: false,
          error: 'Участок не найден'
        });
      }
      
      res.json({
        success: true,
        lot
      });
      
    } catch (error) {
      console.error('Get lot by id error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении участка'
      });
    }
  }

  // Создать участок
  static async create(req, res) {
    try {
      const { name, manager_telegram_id, priority_level, description } = req.body;
      
      if (!name || !manager_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Обязательные поля: name, manager_telegram_id'
        });
      }
      
      // Создаём участок
      const lot = await Lot.create({
        name,
        manager_telegram_id,
        priority_level: priority_level || 3,
        description: description || null
      });
      
      res.status(201).json({
        success: true,
        message: 'Участок успешно создан',
        lot
      });
      
    } catch (error) {
      console.error('Create lot error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании участка'
      });
    }
  }

  // Обновить участок
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Проверяем существование участка
      const lot = await Lot.findById(id);
      if (!lot) {
        return res.status(404).json({
          success: false,
          error: 'Участок не найден'
        });
      }
      
      // Обновляем участок
      const updatedLot = await Lot.update(id, updates);
      
      res.json({
        success: true,
        message: 'Участок обновлён',
        lot: updatedLot
      });
      
    } catch (error) {
      console.error('Update lot error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении участка'
      });
    }
  }

  // Удалить участок
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Проверяем существование участка
      const lot = await Lot.findById(id);
      if (!lot) {
        return res.status(404).json({
          success: false,
          error: 'Участок не найден'
        });
      }
      
      // Удаляем участок
      await Lot.delete(id);
      
      res.json({
        success: true,
        message: 'Участок удалён'
      });
      
    } catch (error) {
      console.error('Delete lot error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Ошибка при удалении участка'
      });
    }
  }

  // Назначить заместителя
  static async assignSubstitute(req, res) {
    try {
      const { id } = req.params;
      const { substitute_telegram_id } = req.body;
      
      if (!substitute_telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется substitute_telegram_id'
        });
      }
      
      // Проверяем существование участка
      const lot = await Lot.findById(id);
      if (!lot) {
        return res.status(404).json({
          success: false,
          error: 'Участок не найден'
        });
      }
      
      // Назначаем заместителя
      await Lot.assignSubstitute(id, substitute_telegram_id);
      
      res.json({
        success: true,
        message: 'Заместитель назначен'
      });
      
    } catch (error) {
      console.error('Assign substitute error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при назначении заместителя'
      });
    }
  }

  // Получить участки для ОТК (с приоритетом)
  static async getForOTK(req, res) {
    try {
      const lots = await Lot.getForOTK();
      
      res.json({
        success: true,
        count: lots.length,
        lots
      });
      
    } catch (error) {
      console.error('Get lots for OTK error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении участков для ОТК'
      });
    }
  }

  // Получить статистику по участку
  static async getStats(req, res) {
    try {
      const { id } = req.params;
      
      const stats = await Lot.getStats(id);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Участок не найден'
        });
      }
      
      res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error('Get lot stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики участка'
      });
    }
  }
}

module.exports = LotController;
