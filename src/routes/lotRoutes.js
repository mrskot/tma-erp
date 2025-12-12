const express = require('express');
const router = express.Router();
const LotController = require('../controllers/lotController');

// GET /api/v1/lots - все участки
router.get('/', LotController.getAll);

// GET /api/v1/lots/otk - участки для ОТК (с приоритетом)
router.get('/otk', LotController.getForOTK);

// GET /api/v1/lots/:id - участок по ID
router.get('/:id', LotController.getById);

// GET /api/v1/lots/:id/stats - статистика по участку
router.get('/:id/stats', LotController.getStats);

// POST /api/v1/lots - создать участок
router.post('/', LotController.create);

// PUT /api/v1/lots/:id - обновить участок
router.put('/:id', LotController.update);

// DELETE /api/v1/lots/:id - удалить участок
router.delete('/:id', LotController.delete);

// POST /api/v1/lots/:id/substitute - назначить заместителя
router.post('/:id/substitute', LotController.assignSubstitute);

module.exports = router;
