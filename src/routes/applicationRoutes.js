// src/routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');
const upload = require('../middleware/upload');

// ВАЖНО: upload.fields ДОЛЖЕН БЫТЬ ПЕРВЫМ
router.post('/', upload.fields([{ name: 'mki_photos', maxCount: 5 }]), ApplicationController.create);

// Основные CRUD операции
router.get('/', ApplicationController.getAll);
router.get('/stats', ApplicationController.getStats);
router.get('/:id', ApplicationController.getById);
router.get('/number/:application_number', ApplicationController.getByNumber);
router.put('/:id', ApplicationController.update);

// Бизнес-операции
router.post('/:id/assign', ApplicationController.assignToOTK);
router.post('/:id/start', ApplicationController.startInspection);
router.post('/:id/complete', ApplicationController.completeInspection);
router.post('/:id/sync', ApplicationController.forceSync);

// Специальные запросы
router.get('/new-for-otk', ApplicationController.getNewForOTK);
router.get('/inspector/:telegram_id', ApplicationController.getForInspector);

// Новые методы из контроллера
router.put('/:id/status', ApplicationController.changeStatus);
router.get('/:id/photos', ApplicationController.getPhotos);
router.delete('/:id', ApplicationController.delete);

module.exports = router;