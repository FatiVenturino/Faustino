const express = require('express');
const router = express.Router();
const {
    getAllCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria
} = require('../controllers/categorias.controller');
const { isAdmin } = require('../middleware/auth.middleware');

// Rutas públicas
router.get('/', getAllCategorias);
router.get('/:id', getCategoriaById);

// Rutas protegidas (solo admin)
router.post('/', isAdmin, createCategoria);
router.put('/:id', isAdmin, updateCategoria);
router.delete('/:id', isAdmin, deleteCategoria);

module.exports = router; 