const express = require('express');
const router = express.Router();
const LotController = require('../controllers/lotController');

// === ОСНОВНЫЕ CRUD ===
router.get('/', LotController.getAll);                 // GET /api/v1/lots
router.get('/:id', LotController.getById);            // GET /api/v1/lots/:id
router.post('/', LotController.create);               // POST /api/v1/lots
router.put('/:id', LotController.update);             // PUT /api/v1/lots/:id
router.delete('/:id', LotController.delete);          // DELETE /api/v1/lots/:id

// === СПЕЦИАЛЬНЫЕ МЕТОДЫ ===
router.get('/otk', LotController.getForOTK);          // GET /api/v1/lots/otk
router.get('/urgent', LotController.getUrgent);       // GET /api/v1/lots/urgent
router.get('/:id/stats', LotController.getStats);     // GET /api/v1/lots/:id/stats

// === УПРАВЛЕНИЕ ЗАМЕСТИТЕЛЕМ ===
router.post('/:id/deputy', LotController.assignDeputy);   // POST /api/v1/lots/:id/deputy
router.delete('/:id/deputy', LotController.removeDeputy); // DELETE /api/v1/lots/:id/deputy

module.exports = router;