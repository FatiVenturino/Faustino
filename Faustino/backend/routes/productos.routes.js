const express = require('express');
const router = express.Router();
const { 
    getAllProductos, 
    getProductoById, 
    getProductosByCategoria,
    createProducto,
    updateProducto,
    deleteProducto
} = require('../controllers/productos.controller');
const { isAdmin } = require('../middleware/auth.middleware');

// Rutas públicas
router.get('/', getAllProductos);
router.get('/:id', getProductoById);
router.get('/categoria/:categoriaId', getProductosByCategoria);

// Rutas protegidas (solo admin)
router.post('/', isAdmin, createProducto);
router.put('/:id', isAdmin, updateProducto);
router.delete('/:id', isAdmin, deleteProducto);

module.exports = router; 