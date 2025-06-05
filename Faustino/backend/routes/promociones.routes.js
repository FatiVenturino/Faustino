const express = require('express');
const router = express.Router();
const {
    getPromocionesActivas,
    getAllPromociones,
    getPromocionById,
    createPromocion,
    updatePromocion,
    deletePromocion
} = require('../controllers/promociones.controller');
const { isAdmin } = require('../middleware/auth.middleware');

// Rutas públicas
router.get('/activas', getPromocionesActivas);
router.get('/:id', getPromocionById);

// Rutas protegidas (solo admin)
router.get('/admin/todas', isAdmin, getAllPromociones);
router.post('/', isAdmin, createPromocion);
router.put('/:id', isAdmin, updatePromocion);
router.delete('/:id', isAdmin, deletePromocion);

module.exports = router; 