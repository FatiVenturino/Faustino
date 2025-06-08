const express = require('express');
const router = express.Router();
const { 
    getReporteVentas,
    getReporteProductos,
    getReporteClientes
} = require('../controllers/reportes.controller');
const { isAdmin, verifyToken } = require('../middleware/auth.middleware');

// Todas las rutas de reportes requieren ser administrador
router.use(verifyToken, isAdmin);

// Reporte de ventas por período
router.get('/ventas', getReporteVentas);

// Reporte de productos más vendidos
router.get('/productos', getReporteProductos);

// Reporte de clientes
router.get('/clientes', getReporteClientes);

module.exports = router; 