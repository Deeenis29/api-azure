// routes/products.js
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/db');

// GET todos los productos
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT p.id, p.name, p.precio, p.stock, p.category_id, 
               c.name as category_name, c.image_url as category_image
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
});

// GET un producto por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.id, p.name, p.precio, p.stock, p.category_id, 
               c.name as category_name, c.image_url as category_image
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = @id
      `);
    
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ message: 'Error al obtener producto', error: error.message });
  }
});

// POST crear nuevo producto
router.post('/', async (req, res) => {
  try {
    const { name, precio, stock, category_id } = req.body;
    
    if (!name || precio === undefined || stock === undefined || !category_id) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
    
    const pool = await getConnection();
    
    // Verificar si existe la categoría
    const categoryCheck = await pool.request()
      .input('category_id', sql.Int, category_id)
      .query('SELECT id FROM categories WHERE id = @category_id');
      
    if (categoryCheck.recordset.length === 0) {
      return res.status(400).json({ message: 'La categoría especificada no existe' });
    }
    
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('precio', sql.Float, precio)
      .input('stock', sql.Int, stock)
      .input('category_id', sql.Int, category_id)
      .query(`
        INSERT INTO products (name, precio, stock, category_id)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.precio, INSERTED.stock, INSERTED.category_id
        VALUES (@name, @precio, @stock, @category_id)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
});

// PUT actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, precio, stock, category_id } = req.body;
    
    if (!name && precio === undefined && stock === undefined && !category_id) {
      return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar' });
    }
    
    const pool = await getConnection();
    
    // Verificar si existe el producto
    const productCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM products WHERE id = @id');
      
    if (productCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Si se proporciona category_id, verificar si existe
    if (category_id) {
      const categoryCheck = await pool.request()
        .input('category_id', sql.Int, category_id)
        .query('SELECT id FROM categories WHERE id = @category_id');
        
      if (categoryCheck.recordset.length === 0) {
        return res.status(400).json({ message: 'La categoría especificada no existe' });
      }
    }
    
    // Construir consulta dinámica
    let updateQuery = 'UPDATE products SET ';
    const queryParams = [];
    
    if (name) {
      queryParams.push('name = @name');
    }
    if (precio !== undefined) {
      queryParams.push('precio = @precio');
    }
    if (stock !== undefined) {
      queryParams.push('stock = @stock');
    }
    if (category_id) {
      queryParams.push('category_id = @category_id');
    }
    
    updateQuery += queryParams.join(', ');
    updateQuery += ' OUTPUT INSERTED.* WHERE id = @id';
    
    // Ejecutar consulta
    const request = pool.request()
      .input('id', sql.Int, id);
      
    if (name) request.input('name', sql.NVarChar, name);
    if (precio !== undefined) request.input('precio', sql.Float, precio);
    if (stock !== undefined) request.input('stock', sql.Int, stock);
    if (category_id) request.input('category_id', sql.Int, category_id);
    
    const result = await request.query(updateQuery);
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
});

// DELETE eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    // Verificar si existe el producto
    const productCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM products WHERE id = @id');
      
    if (productCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM products WHERE id = @id');
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
});

module.exports = router;