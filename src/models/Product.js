const knex = require('knex');
const knexfile = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

class Product {
  // Константы для отображения типов
  static TYPES = {
    'semi_finished': 'Полуфабрикат',
    'assembly': 'Узел',
    'finished_product': 'Готовая продукция',
    'detail': 'Деталь'
  };

  // Константы для отображения единиц измерения
  static UNITS = {
    'pcs': 'шт.',
    'set': 'компл.'
  };

  // Получить все активные изделия с человекочитаемыми названиями
  static async findAll() {
    const products = await db('products')
      .where({ is_active: true })
      .select('*')
      .orderBy('name', 'asc');
    
    // Добавляем отображаемые названия
    return products.map(product => ({
      ...product,
      type_display: this.TYPES[product.type] || product.type,
      unit_display: this.UNITS[product.unit] || product.unit
    }));
  }

  // Найти изделие по ID
  static async findById(id) {
    const product = await db('products').where({ id, is_active: true }).first();
    if (!product) return null;
    
    return {
      ...product,
      type_display: this.TYPES[product.type] || product.type,
      unit_display: this.UNITS[product.unit] || product.unit
    };
  }

  // Поиск изделий по названию (частичное совпадение)
  static async searchByName(name) {
    const products = await db('products')
      .where('is_active', true)
      .andWhere('name', 'ilike', `%${name}%`)
      .select('id', 'name', 'type', 'unit', 'lot_id', 'inspection_time_minutes')
      .orderBy('name', 'asc')
      .limit(20);
    
    return products.map(product => ({
      ...product,
      type_display: this.TYPES[product.type] || product.type,
      unit_display: this.UNITS[product.unit] || product.unit
    }));
  }

  // Создать изделие
  static async create(productData) {
    const [product] = await db('products')
      .insert({
        name: productData.name,
        lot_id: productData.lot_id || null,
        type: productData.type || 'finished_product',
        unit: productData.unit || 'pcs',
        inspection_time_minutes: productData.inspection_time_minutes || 30,
        checklist_text: productData.checklist_text || null
      })
      .returning('*');
    
    return {
      ...product,
      type_display: this.TYPES[product.type] || product.type,
      unit_display: this.UNITS[product.unit] || product.unit
    };
  }

  // Обновить изделие
  static async update(id, updates) {
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

  // Получить изделия по участку
  static async getByLot(lotId) {
    const products = await db('products as p')
      .where('p.lot_id', lotId)
      .andWhere('p.is_active', true)
      .select('p.*')
      .orderBy('p.name', 'asc');
    
    return products.map(product => ({
      ...product,
      type_display: this.TYPES[product.type] || product.type,
      unit_display: this.UNITS[product.unit] || product.unit
    }));
  }

  // Получить все типы для dropdown
  static getTypesForSelect() {
    return Object.entries(this.TYPES).map(([value, label]) => ({ value, label }));
  }

  // Получить все единицы для dropdown
  static getUnitsForSelect() {
    return Object.entries(this.UNITS).map(([value, label]) => ({ value, label }));
  }

  // Статистика по изделию (заглушка - расширим позже)
  static async getStats(productId) {
    const product = await this.findById(productId);
    if (!product) return null;

    const stats = {
      product: {
        id: product.id,
        name: product.name,
        type: product.type_display,
        unit: product.unit_display,
        inspection_time: product.inspection_time_minutes
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

  // Получить маршрут изделия (заглушка - убрали цепочку производства)
  static async getProductionRoute(productId) {
    const product = await this.findById(productId);
    if (!product) return null;
    
    return [{
      id: product.id,
      name: product.name,
      type: product.type_display,
      stage: 'current'
    }];
  }
}

module.exports = Product;