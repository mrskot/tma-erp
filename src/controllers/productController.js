// src/controllers/productController.js
const Product = require('../models/Product');

class ProductController {
  // Получить все изделия
  static async getAll(req, res) {
    try {
      const { type, search } = req.query;
      
      let products;
      
      if (search) {
        products = await Product.searchByName(search);
      } else if (type) {
        products = await db('products')
          .where({ type, is_active: true })
          .orderBy('name', 'asc');
      } else {
        products = await Product.findAll();
      }
      
      res.json({
        success: true,
        count: products.length,
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
        product
      });
      
    } catch (error) {
      console.error('Get product by id error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении изделия'
      });
    }
  }

  // Найти изделие по чертежу
  static async getByDrawingNumber(req, res) {
    try {
      const { drawing_number } = req.params;
      
      if (!drawing_number) {
        return res.status(400).json({
          success: false,
          error: 'Требуется номер чертежа'
        });
      }
      
      const product = await Product.findByDrawingNumber(drawing_number);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Изделие с таким номером чертежа не найдено'
        });
      }
      
      res.json({
        success: true,
        product
      });
      
    } catch (error) {
      console.error('Get product by drawing number error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при поиске изделия'
      });
    }
  }

  // Создать изделие
  static async create(req, res) {
    try {
      const { 
        name, 
        drawing_number, 
        type, 
        unit,
        serial_number,
        description 
      } = req.body;
      
      if (!name || !drawing_number) {
        return res.status(400).json({
          success: false,
          error: 'Обязательные поля: name, drawing_number'
        });
      }
      
      // Проверяем уникальность чертежа
      const existingProduct = await Product.findByDrawingNumber(drawing_number);
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          error: 'Изделие с таким номером чертежа уже существует'
        });
      }
      
      const product = await Product.create({
        name,
        drawing_number,
        type: type || 'finished_product',
        unit: unit || 'pcs',
        serial_number,
        description
      });
      
      res.status(201).json({
        success: true,
        message: 'Изделие успешно создано',
        product
      });
      
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании изделия'
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
          error: 'Изделие не найдено'
        });
      }
      
      // Если меняется номер чертежа, проверяем уникальность
      if (updates.drawing_number && updates.drawing_number !== product.drawing_number) {
        const existingProduct = await Product.findByDrawingNumber(updates.drawing_number);
        if (existingProduct && existingProduct.id !== parseInt(id)) {
          return res.status(409).json({
            success: false,
            error: 'Изделие с таким номером чертежа уже существует'
          });
        }
      }
      
      const updatedProduct = await Product.update(id, updates);
      
      res.json({
        success: true,
        message: 'Изделие обновлено',
        product: updatedProduct
      });
      
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении изделия'
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
          error: 'Изделие не найдено'
        });
      }
      
      await Product.deactivate(id);
      
      res.json({
        success: true,
        message: 'Изделие деактивировано'
      });
      
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении изделия'
      });
    }
  }

  // Получить маршрут производства
  static async getProductionRoute(req, res) {
    try {
      const { id } = req.params;
      
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Изделие не найдено'
        });
      }
      
      const route = await Product.getProductionRoute(id);
      
      res.json({
        success: true,
        route
      });
      
    } catch (error) {
      console.error('Get production route error:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении маршрута производства'
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
          error: 'Изделие не найдено'
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
        error: 'Ошибка при получении статистики изделия'
      });
    }
  }
}

module.exports = ProductController;