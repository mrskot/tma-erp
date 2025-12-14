const Lot = require('../models/Lot');

class LotController {
  // === ОСНОВНЫЕ CRUD ===
  
  // 1. GET /api/v1/lots — все участки
  static async getAll(req, res) {
    try {
      const { include_inactive, priority, urgent_only } = req.query;
      
      let lots;
      
      if (urgent_only === 'true') {
        lots = await Lot.getUrgentLots();
      } else if (priority) {
        lots = await Lot.findByPriority(parseInt(priority));
      } else {
        lots = await Lot.findAll(include_inactive === 'true');
      }
      
      res.json({ 
        success: true, 
        count: lots.length,
        filters: { include_inactive, priority, urgent_only },
        lots 
      });
      
    } catch (error) {
      console.error('Get all lots error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при получении списка участков',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // 2. GET /api/v1/lots/:id — участок по ID
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
      
      res.json({ success: true, lot });
      
    } catch (error) {
      console.error('Get lot by id error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при получении участка' 
      });
    }
  }
  
  // 3. POST /api/v1/lots — создать участок
  static async create(req, res) {
    try {
      const required = ['name', 'manager_telegram_id'];
      const missing = required.filter(field => !req.body[field]);
      
      if (missing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: `Отсутствуют обязательные поля: ${missing.join(', ')}` 
        });
      }
      
      // Валидация приоритета
      if (req.body.priority_level && (req.body.priority_level < 1 || req.body.priority_level > 5)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Приоритет должен быть от 1 до 5' 
        });
      }
      
      const lot = await Lot.create(req.body);
      
      res.status(201).json({ 
        success: true, 
        message: 'Участок успешно создан',
        lot 
      });
      
    } catch (error) {
      console.error('Create lot error:', error);
      
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ 
          success: false, 
          error: 'Участок с таким названием уже существует' 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при создании участка' 
      });
    }
  }
  
  // 4. PUT /api/v1/lots/:id — обновить участок
  static async update(req, res) {
    try {
      const { id } = req.params;
      
      const lot = await Lot.findById(id);
      if (!lot) {
        return res.status(404).json({ 
          success: false, 
          error: 'Участок не найден' 
        });
      }
      
      // Валидация приоритета
      if (req.body.priority_level && (req.body.priority_level < 1 || req.body.priority_level > 5)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Приоритет должен быть от 1 до 5' 
        });
      }
      
      const updatedLot = await Lot.update(id, req.body);
      
      res.json({ 
        success: true, 
        message: 'Участок успешно обновлён',
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
  
  // 5. DELETE /api/v1/lots/:id — удалить участок (деактивировать)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const { hard_delete } = req.query;
      
      const lot = await Lot.findById(id);
      if (!lot) {
        return res.status(404).json({ 
          success: false, 
          error: 'Участок не найден' 
        });
      }
      
      if (hard_delete === 'true') {
        // Полное удаление (только для админов)
        await Lot.hardDelete(id);
        res.json({ 
          success: true, 
          message: 'Участок полностью удалён' 
        });
      } else {
        // Мягкое удаление
        await Lot.delete(id);
        res.json({ 
          success: true, 
          message: 'Участок деактивирован' 
        });
      }
      
    } catch (error) {
      console.error('Delete lot error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при удалении участка' 
      });
    }
  }
  
  // === СПЕЦИАЛЬНЫЕ МЕТОДЫ ===
  
  // 6. GET /api/v1/lots/otk — участки для ОТК
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
  
  // 7. GET /api/v1/lots/:id/stats — статистика по участку
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
      
      res.json({ success: true, stats });
      
    } catch (error) {
      console.error('Get lot stats error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при получении статистики участка' 
      });
    }
  }
  
  // 8. POST /api/v1/lots/:id/deputy — назначить заместителя
  static async assignDeputy(req, res) {
    try {
      const { id } = req.params;
      const { deputy_manager_telegram_id } = req.body;
      
      if (!deputy_manager_telegram_id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Требуется deputy_manager_telegram_id' 
        });
      }
      
      const lot = await Lot.findById(id);
      if (!lot) {
        return res.status(404).json({ 
          success: false, 
          error: 'Участок не найден' 
        });
      }
      
      await Lot.assignDeputy(id, deputy_manager_telegram_id);
      
      res.json({ 
        success: true, 
        message: 'Заместитель назначен' 
      });
      
    } catch (error) {
      console.error('Assign deputy error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при назначении заместителя' 
      });
    }
  }
  
  // 9. DELETE /api/v1/lots/:id/deputy — снять заместителя
  static async removeDeputy(req, res) {
    try {
      const { id } = req.params;
      
      const lot = await Lot.findById(id);
      if (!lot) {
        return res.status(404).json({ 
          success: false, 
          error: 'Участок не найден' 
        });
      }
      
      await Lot.removeDeputy(id);
      
      res.json({ 
        success: true, 
        message: 'Заместитель снят' 
      });
      
    } catch (error) {
      console.error('Remove deputy error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при снятии заместителя' 
      });
    }
  }
  
  // 10. GET /api/v1/lots/urgent — участки, требующие срочного внимания
  static async getUrgent(req, res) {
    try {
      const lots = await Lot.getUrgentLots();
      res.json({ 
        success: true, 
        count: lots.length,
        lots 
      });
    } catch (error) {
      console.error('Get urgent lots error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при получении срочных участков' 
      });
    }
  }
}

module.exports = LotController;