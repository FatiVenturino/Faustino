const express = require('express');
const router = express.Router();
const {
    getPedidosUsuario,
    getAllPedidos,
    getPedidoById,
    createPedido,
    updateEstadoPedido
} = require('../controllers/pedidos.controller');
const { isAdmin, verifyToken } = require('../middleware/auth.middleware');

// Rutas para clientes (requieren autenticación)
router.use(verifyToken); // Proteger todas las rutas de pedidos
router.get('/mis-pedidos', getPedidosUsuario);
router.get('/:id', getPedidoById);
router.post('/', createPedido);

// Rutas para administradores
router.get('/admin/todos', isAdmin, getAllPedidos);
router.put('/:id/estado', isAdmin, updateEstadoPedido);

module.exports = router; 