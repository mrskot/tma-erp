// src/routes/discrepancyRoutes.js
const express = require('express');
const router = express.Router();
const DiscrepancyController = require('../controllers/discrepancyController');

// ⭐⭐ ДОБАВЬ ЭТОТ РОУТ! ⭐⭐
// GET /api/v1/discrepancies - ВСЕ несоответствия
router.get('/', DiscrepancyController.getAll);

// POST /api/v1/discrepancies - создать несоответствие
router.post('/', DiscrepancyController.create);

// GET /api/v1/discrepancies/stats - статистика
router.get('/stats', DiscrepancyController.getStats);

// GET /api/v1/discrepancies/top-defects - топ дефектов
router.get('/top-defects', DiscrepancyController.getTopDefectCodes);

// GET /api/v1/discrepancies/application/:application_id - по заявке
router.get('/application/:application_id', DiscrepancyController.getByApplication);

// GET /api/v1/discrepancies/master/:telegram_id - по мастеру
router.get('/master/:telegram_id', DiscrepancyController.getByMaster);

// GET /api/v1/discrepancies/:id - по ID
router.get('/:id', DiscrepancyController.getById);

// GET /api/v1/discrepancies/:id/history - история
router.get('/:id/history', DiscrepancyController.getHistory);

// POST /api/v1/discrepancies/:id/status - изменить статус
router.post('/:id/status', DiscrepancyController.updateStatus);

// POST /api/v1/discrepancies/:id/start - начать устранение
router.post('/:id/start', DiscrepancyController.startResolution);

// POST /api/v1/discrepancies/:id/complete - завершить устранение
router.post('/:id/complete', DiscrepancyController.completeResolution);

// POST /api/v1/discrepancies/:id/close - закрыть (ОТК контроль)
router.post('/:id/close', DiscrepancyController.closeDiscrepancy);

// POST /api/v1/discrepancies/:id/kr - создать КР
router.post('/:id/kr', DiscrepancyController.createKR);

// POST /api/v1/discrepancies/:id/reassign - переназначить ответственного
router.post('/:id/reassign', DiscrepancyController.reassign);

module.exports = router;
