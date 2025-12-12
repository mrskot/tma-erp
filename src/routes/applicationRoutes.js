// src/routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');

// GET /api/v1/applications - все заявки
router.get('/', ApplicationController.getAll);

// GET /api/v1/applications/stats - статистика заявок
router.get('/stats', ApplicationController.getStats);

// GET /api/v1/applications/new-for-otk - новые заявки для ОТК
router.get('/new-for-otk', ApplicationController.getNewForOTK);

// GET /api/v1/applications/inspector/:telegram_id - заявки контролёра
router.get('/inspector/:telegram_id', ApplicationController.getForInspector);

// GET /api/v1/applications/:id - заявка по ID
router.get('/:id', ApplicationController.getById);

// GET /api/v1/applications/number/:application_number - заявка по номеру
router.get('/number/:application_number', ApplicationController.getByNumber);

// POST /api/v1/applications - создать заявку
router.post('/', ApplicationController.create);

// POST /api/v1/applications/:id/assign - назначить ОТК
router.post('/:id/assign', ApplicationController.assignToOTK);

// POST /api/v1/applications/:id/start - начать проверку
router.post('/:id/start', ApplicationController.startInspection);

// POST /api/v1/applications/:id/complete - завершить проверку
router.post('/:id/complete', ApplicationController.completeInspection);

// PUT /api/v1/applications/:id - обновить заявку
router.put('/:id', ApplicationController.update);

module.exports = router;