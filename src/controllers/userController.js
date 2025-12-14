const User = require('../models/User');

class UserController {
  // Вход пользователя
  static async login(req, res) {
    try {
      const { telegram_id, pin_code } = req.body;
      
      if (!telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется telegram_id'
        });
      }
      
      // Ищем пользователя
      let user = await User.findByTelegramId(telegram_id);
      
      // Если пользователя нет - создаём (для теста)
      if (!user) {
        user = await User.create({
          telegram_id,
          pin_code: pin_code || '0000',
          role: 'master',
          first_name: 'Тестовый',
          last_name: 'Пользователь'
        });
        
        return res.json({
          success: true,
          message: 'Пользователь создан',
          user: {
            telegram_id: user.telegram_id,
            role: user.role,
            first_name: user.first_name
          }
        });
      }
      
      // Проверяем PIN если указан
      if (pin_code) {
        const isValid = await User.verifyPin(telegram_id, pin_code);
        if (!isValid) {
          return res.status(401).json({
            success: false,
            error: 'Неверный PIN-код'
          });
        }
      }
      
      res.json({
        success: true,
        message: 'Вход выполнен',
        user: {
          telegram_id: user.telegram_id,
          role: user.role,
          username: user.username,
          first_name: user.first_name
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при входе в систему'
      });
    }
  }

  // Получить профиль
  static async getProfile(req, res) {
    try {
      const { telegram_id } = req.query;
      
      if (!telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется telegram_id в query параметрах'
        });
      }
      
      const user = await User.findByTelegramId(telegram_id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      res.json({
        success: true,
        user: {
          telegram_id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          created_at: user.created_at
        }
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении профиля'
      });
    }
  }

  // Получить всех пользователей
  static async getAll(req, res) {
    try {
      const users = await User.findAll();
      
      res.json({
        success: true,
        count: users.length,
        users
      });
      
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении списка пользователей'
      });
    }
  }

  // Получить всех активных пользователей (для выпадающих списков)
  static async getAllActiveUsers(req, res) {
    try {
      const users = await User.findAllActive();
      
      res.json({
        success: true,
        count: users.length,
        users: users.map(user => ({
          telegram_id: user.telegram_id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
          display_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
        }))
      });
      
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка при получении списка пользователей' 
      });
    }
  }


  // Обновить пользователя
  static async update(req, res) {
    try {
      const { telegram_id } = req.params; // берём из URL
      const updates = req.body;
      
      console.log('Update user:', telegram_id, updates);
      
      if (!telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется telegram_id в параметрах URL'
        });
      }
      
      // Ищем пользователя
      let user = await User.findByTelegramId(telegram_id);
      
      // Если пользователя нет - создаём
      if (!user) {
        user = await User.create({
          telegram_id,
          pin_code: updates.pin_code || '0000',
          role: updates.role || 'worker',
          first_name: updates.first_name || 'Пользователь',
          last_name: updates.last_name || '',
          username: updates.username || null,
          is_active: updates.is_active !== false
        });
        
        return res.json({
          success: true,
          message: 'Пользователь создан',
          user: {
            telegram_id: user.telegram_id,
            role: user.role,
            first_name: user.first_name
          }
        });
      }
      
      // Обновляем пользователя
      const updatedUser = await User.update(telegram_id, updates);
      
      res.json({
        success: true,
        message: 'Пользователь обновлён',
        user: updatedUser
      });
      
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении пользователя'
      });
    }
  }

  // Удалить пользователя (деактивация)
  static async delete(req, res) {
    try {
      const { telegram_id } = req.params;
      
      console.log('Delete user:', telegram_id);
      
      if (!telegram_id) {
        return res.status(400).json({
          success: false,
          error: 'Требуется telegram_id в параметрах URL'
        });
      }
      
      const user = await User.findByTelegramId(telegram_id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      // Деактивируем пользователя
      await User.update(telegram_id, { is_active: false });
      
      res.json({
        success: true,
        message: 'Пользователь деактивирован'
      });
      
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении пользователя'
      });
    }
  }
}

module.exports = UserController;
