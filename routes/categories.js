// routes/categories.js
const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/db');

// GET todas las categorías
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT id, name, image_url FROM categories');
    
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error al obtener categorías', error: error.message });
  }
});

// GET una categoría por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    // Obtener la categoría
    const categoryResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, name, image_url FROM categories WHERE id = @id');
    
    if (categoryResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    // Obtener productos de esta categoría
    const productsResult = await pool.request()
      .input('category_id', sql.Int, id)
      .query('SELECT id, name, precio, stock FROM products WHERE category_id = @category_id');
    
    // Combinar resultados
    const category = categoryResult.recordset[0];
    category.products = productsResult.recordset;
    
    res.json(category);
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ message: 'Error al obtener categoría', error: error.message });
  }
});

// POST crear nueva categoría
router.post('/', async (req, res) => {
  try {
    const { name, image_url } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'El nombre de la categoría es requerido' });
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('image_url', sql.NVarChar, image_url || null)
      .query(`
        INSERT INTO categories (name, image_url)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.image_url
        VALUES (@name, @image_url)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ message: 'Error al crear categoría', error: error.message });
  }
});

// PUT actualizar categoría
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_url } = req.body;
    
    if (!name && image_url === undefined) {
      return res.status(400).json({ message: 'Se requiere al menos un campo para actualizar' });
    }
    
    const pool = await getConnection();
    
    // Verificar si existe la categoría
    const categoryCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM categories WHERE id = @id');
      
    if (categoryCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    // Construir consulta dinámica
    let updateQuery = 'UPDATE categories SET ';
    const queryParams = [];
    
    if (name) {
      queryParams.push('name = @name');
    }
    if (image_url !== undefined) {
      queryParams.push('image_url = @image_url');
    }
    
    updateQuery += queryParams.join(', ');
    updateQuery += ' OUTPUT INSERTED.* WHERE id = @id';
    
    // Ejecutar consulta
    const request = pool.request()
      .input('id', sql.Int, id);
      
    if (name) request.input('name', sql.NVarChar, name);
    if (image_url !== undefined) request.input('image_url', sql.NVarChar, image_url);
    
    const result = await request.query(updateQuery);
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ message: 'Error al actualizar categoría', error: error.message });
  }
});

// DELETE eliminar categoría
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await getConnection();
      
      // Verificar si existe la categoría
      const categoryCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id FROM categories WHERE id = @id');
        
      if (categoryCheck.recordset.length === 0) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      
      // Verificar si hay productos asociados
      const productsCheck = await pool.request()
        .input('category_id', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM products WHERE category_id = @category_id');
      
      if (productsCheck.recordset[0].count > 0) {
        return res.status(400).json({ 
          message: 'No se puede eliminar la categoría porque tiene productos asociados',
          count: productsCheck.recordset[0].count
        });
      }
      
      // Proceder con la eliminación
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM categories WHERE id = @id');
      
      res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      res.status(500).json({ message: 'Error al eliminar categoría', error: error.message });
    }
  });
  
  module.exports = router;