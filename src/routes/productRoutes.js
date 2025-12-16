const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// GET /api/v1/products - все изделия
router.get('/', ProductController.getAll);

// GET /api/v1/products/search?q=... - поиск изделий (оставлю, но без чертежей)
router.get('/search', ProductController.getAll);

// GET /api/v1/products/:id - изделие по ID
router.get('/:id', ProductController.getById);

// GET /api/v1/products/:id/route - маршрут производства (заглушка)
router.get('/:id/route', ProductController.getProductionRoute);

// GET /api/v1/products/:id/stats - статистика по изделию
router.get('/:id/stats', ProductController.getStats);

// GET /api/v1/products/reference/data - справочные данные
router.get('/reference/data', ProductController.getReferenceData);

// POST /api/v1/products - создать изделие
router.post('/', ProductController.create);

// PUT /api/v1/products/:id - обновить изделие
router.put('/:id', ProductController.update);

// DELETE /api/v1/products/:id - удалить изделие
router.delete('/:id', ProductController.delete);

router.get('/', async (req, res) => {
    try {
        const { lot_id } = req.query;
        
        let query = db('products').where({ is_active: true });
        
        // Фильтр по участку
        if (lot_id) {
            // TODO: Реализуй связь продуктов с участками
            // Пока возвращаем все активные продукты
        }
        
        const products = await query.select('*');
        
        // Добавляем отображаемый тип
        const productsWithDisplay = products.map(product => ({
            ...product,
            type_display: product.type === 'semi_finished' ? 'Полуфабрикат' :
                         product.type === 'assembly' ? 'Узел' :
                         product.type === 'finished' ? 'Готовая продукция' : product.type
        }));
        
        res.json({
            success: true,
            products: productsWithDisplay
        });
        
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении списка изделий'
        });
    }
});


module.exports = router;