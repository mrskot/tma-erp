// src/models/Product.js
const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Product {
  // Получить все активные изделия
  static async findAll() {
    return db('products')
      .where({ is_active: true })
      .select('*')
      .orderBy('name', 'asc');
  }

  // Найти изделие по ID
  static async findById(id) {
    return db('products').where({ id, is_active: true }).first();
  }

  // Найти изделие по номеру чертежа
  static async findByDrawingNumber(drawingNumber) {
    return db('products')
      .where({ 
        drawing_number: drawingNumber.toUpperCase(),
        is_active: true 
      })
      .first();
  }

  // Найти изделие по серийному номеру
  static async findBySerialNumber(serialNumber) {
    return db('products')
      .where({ 
        serial_number: serialNumber,
        is_active: true 
      })
      .first();
  }

  // Поиск изделий по названию (частичное совпадение)
  static async searchByName(name) {
    return db('products')
      .where('is_active', true)
      .andWhere('name', 'ilike', `%${name}%`)
      .select('id', 'name', 'drawing_number', 'type', 'unit')
      .orderBy('name', 'asc')
      .limit(20);
  }

  // Создать изделие
  static async create(productData) {
    const [product] = await db('products')
      .insert({
        name: productData.name,
        drawing_number: productData.drawing_number.toUpperCase(),
        serial_number: productData.serial_number || null,
        type: productData.type || 'finished_product',
        unit: productData.unit || 'pcs',
        next_stage_product_id: productData.next_stage_product_id || null,
        previous_stage_product_id: productData.previous_stage_product_id || null,
        technical_requirements: productData.technical_requirements || null,
        description: productData.description || null
      })
      .returning('*');
    
    return product;
  }

  // Обновить изделие
  static async update(id, updates) {
    if (updates.drawing_number) {
      updates.drawing_number = updates.drawing_number.toUpperCase();
    }
    
    updates.updated_at = new Date();
    
    await db('products')
      .where({ id })
      .update(updates);
    
    return this.findById(id);
  }

  // Деактивировать изделие (мягкое удаление)
  static async deactivate(id) {
    return db('products')
      .where({ id })
      .update({
        is_active: false,
        updated_at: new Date()
      });
  }

  // Получить изделия по участку (через историю заявок)
  static async getByLot(lotId) {
    return db('products as p')
      .join('applications as a', 'a.product_id', 'p.id')
      .where('a.lot_id', lotId)
      .andWhere('p.is_active', true)
      .distinct('p.*')
      .orderBy('p.name', 'asc');
  }

  // Получить статистику по изделию
  static async getStats(productId) {
    const product = await this.findById(productId);
    if (!product) return null;

    // Статистика заявок (позже расширим)
    const stats = {
      product: {
        id: product.id,
        name: product.name,
        drawing_number: product.drawing_number,
        type: product.type,
        unit: product.unit
      },
      applications: {
        total: 0,
        accepted: 0,
        rejected: 0,
        in_progress: 0
      }
    };

    return stats;
  }

  // Получить маршрут изделия (цепочка производства)
  static async getProductionRoute(productId) {
    const route = [];
    let currentProduct = await this.findById(productId);
    
    // Идём назад по цепочке (предыдущие этапы)
    while (currentProduct && currentProduct.previous_stage_product_id) {
      const prevProduct = await this.findById(currentProduct.previous_stage_product_id);
      if (prevProduct) {
        route.unshift({
          id: prevProduct.id,
          name: prevProduct.name,
          drawing_number: prevProduct.drawing_number,
          type: prevProduct.type,
          stage: 'previous'
        });
        currentProduct = prevProduct;
      } else {
        break;
      }
    }
    
    // Текущее изделие
    currentProduct = await this.findById(productId);
    route.push({
      id: currentProduct.id,
      name: currentProduct.name,
      drawing_number: currentProduct.drawing_number,
      type: currentProduct.type,
      stage: 'current'
    });
    
    // Идём вперёд по цепочке (следующие этапы)
    while (currentProduct && currentProduct.next_stage_product_id) {
      const nextProduct = await this.findById(currentProduct.next_stage_product_id);
      if (nextProduct) {
        route.push({
          id: nextProduct.id,
          name: nextProduct.name,
          drawing_number: nextProduct.drawing_number,
          type: nextProduct.type,
          stage: 'next'
        });
        currentProduct = nextProduct;
      } else {
        break;
      }
    }
    
    return route;
  }
}

module.exports = Product;