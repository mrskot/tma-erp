const Product = require('../models/Product');

class ProductController {
  // Получить все изделия
  static async getAll(req, res) {
    try {
      const { type, search, lot_id } = req.query;
      
      let products;
      
      if (search) {
        products = await Product.searchByName(search);
      } else if (type) {
        // Фильтрация по типу
        const allProducts = await Product.findAll();
        products = allProducts.filter(p => p.type === type);
      } else if (lot_id) {
        // Фильтрация по участку
        products = await Product.getByLot(lot_id);
      } else {
        products = await Product.findAll();
      }
      
      // Получаем доступные типы и единицы для фильтров
      const typesForFilter = Product.getTypesForSelect();
      const unitsForFilter = Product.getUnitsForSelect();
      
      res.json({
        success: true,
        count: products.length,
        filters: {
          types: typesForFilter,
          units: unitsForFilter
        },
        products
      });
      
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении списка изделий'
      });
    }
  }

  // Получить изделие по ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Изделие не найдено'
        });
      }
      
      res.json({
        success: true,
        product,
        types: Product.getTypesForSelect(),
        units: Product.getUnitsForSelect()
      });
      
    } catch (error) {
      console.error('Get product by id error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении изделия'
      });
    }
  }

  // Создать изделие
  static async create(req, res) {
    try {
      const { 
        name, 
        lot_id, 
        type, 
        unit,
        inspection_time_minutes,
        checklist_text,
        default_otk_inspector_telegram_id
      } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Обязательное поле: name'
        });
      }
      
      const product = await Product.create({
        name,
        lot_id,
        type,
        unit,
        inspection_time_minutes,
        checklist_text,
        default_otk_inspector_telegram_id
      });
      
      res.status(201).json({
        success: true,
        message: 'Тип изделия успешно создан',
        product
      });
      
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании типа изделия'
      });
    }
  }

  // Обновить изделие
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Проверяем существование изделия
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Тип изделия не найден'
        });
      }
      
      const updatedProduct = await Product.update(id, updates);
      
      res.json({
        success: true,
        message: 'Тип изделия обновлен',
        product: updatedProduct
      });
      
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении типа изделия'
      });
    }
  }

  // Удалить изделие (деактивировать)
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Тип изделия не найден'
        });
      }
      
      await Product.deactivate(id);
      
      res.json({
        success: true,
        message: 'Тип изделия деактивирован'
      });
      
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении типа изделия'
      });
    }
  }

  // Получить маршрут производства (заглушка)
  static async getProductionRoute(req, res) {
    try {
      const { id } = req.params;
      
      const route = await Product.getProductionRoute(id);
      
      if (!route) {
        return res.status(404).json({
          success: false,
          error: 'Тип изделия не найден'
        });
      }
      
      res.json({
        success: true,
        route
      });
      
    } catch (error) {
      console.error('Get production route error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении маршрута'
      });
    }
  }

  // Получить статистику по изделию
  static async getStats(req, res) {
    try {
      const { id } = req.params;
      
      const stats = await Product.getStats(id);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Тип изделия не найден'
        });
      }
      
      res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error('Get product stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики'
      });
    }
  }

  // Получить справочники (типы, единицы измерения, контролёры)
  static async getReferenceData(req, res) {
    try {
      const inspectors = await Product.getAvailableInspectors();
      
      res.json({
        success: true,
        types: Product.getTypesForSelect(),
        units: Product.getUnitsForSelect(),
        inspectors
      });
    } catch (error) {
      console.error('Get reference data error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении справочных данных'
      });
    }
  }
}

module.exports = ProductController;