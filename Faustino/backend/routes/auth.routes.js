const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword, isAdmin } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);

// Nueva ruta para verificar si el usuario es admin
router.get('/is-admin', verifyToken, isAdmin);

module.exports = router; 