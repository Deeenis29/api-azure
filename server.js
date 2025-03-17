const express = require('express');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Ruta inicial
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Senati' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});