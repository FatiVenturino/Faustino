const express = require('express');
const router = express.Router();
const {
    getPedidosUsuario,
    getAllPedidos,
    getPedidoById,
    createPedido,
    updateEstadoPedido,
    getHistorialPedidos,
    getDetallePedido
} = require('../controllers/pedidos.controller');
const { isAdmin, verifyToken, checkRole } = require('../middleware/auth.middleware');

// ************ REORDENAMIENTO DE RUTAS: IMPORTANTE PARA EVITAR CONFLICTOS ************

// Rutas de ADMINISTRADOR - Deben ir primero, de más específica a menos específica
// La ruta de historial es la más específica y debe estar al principio de los GETs de admin
router.get('/admin/historial', verifyToken, checkRole(['admin']), getHistorialPedidos);
router.get('/admin/todos', verifyToken, checkRole(['admin']), getAllPedidos);
router.get('/admin/detalle/:id', verifyToken, checkRole(['admin']), getDetallePedido);
router.put('/admin/estado/:id', verifyToken, checkRole(['admin']), updateEstadoPedido);

// Rutas de USUARIO / CLIENTE - Protegidas por autenticación
router.post('/', verifyToken, checkRole(['cliente', 'admin']), createPedido); // Crear pedido
router.get('/usuario', verifyToken, checkRole(['cliente', 'admin']), getPedidosUsuario); // Pedidos del usuario logueado

// Ruta GENÉRICA con parámetro ID - SIEMPRE DEBE IR AL FINAL
// Esta ruta debe ser la última de todas las rutas GET de /pedidos para evitar que capture otras rutas.
router.get('/:id', verifyToken, checkRole(['cliente', 'admin']), getPedidoById);

// ************ FIN DE REORDENAMIENTO DE RUTAS ************

module.exports = router;