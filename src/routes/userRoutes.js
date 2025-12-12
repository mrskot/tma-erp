const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// POST /api/v1/users/login - вход/создание
router.post('/login', UserController.login);

// GET /api/v1/users - все пользователи
router.get('/', UserController.getAll);

// GET /api/v1/users/profile - профиль
router.get('/profile', UserController.getProfile);

// PUT /api/v1/users/:telegram_id - обновить пользователя
router.put('/:telegram_id', UserController.update);

// DELETE /api/v1/users/:telegram_id - деактивировать
router.delete('/:telegram_id', UserController.delete);

module.exports = router;
