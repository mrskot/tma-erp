// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// GET /api/v1/products - все изделия
router.get('/', ProductController.getAll);

// GET /api/v1/products/search?q=... - поиск изделий
router.get('/search', ProductController.getAll);

// GET /api/v1/products/:id - изделие по ID
router.get('/:id', ProductController.getById);

// GET /api/v1/products/drawing/:drawing_number - по номеру чертежа
router.get('/drawing/:drawing_number', ProductController.getByDrawingNumber);

// GET /api/v1/products/:id/route - маршрут производства
router.get('/:id/route', ProductController.getProductionRoute);

// GET /api/v1/products/:id/stats - статистика по изделию
router.get('/:id/stats', ProductController.getStats);

// POST /api/v1/products - создать изделие
router.post('/', ProductController.create);

// PUT /api/v1/products/:id - обновить изделие
router.put('/:id', ProductController.update);

// DELETE /api/v1/products/:id - удалить изделие
router.delete('/:id', ProductController.delete);

module.exports = router;