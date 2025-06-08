const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword, getAllUsers, getUserById } = require('../controllers/auth.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);

// Ruta para verificar si el usuario es admin
router.get('/is-admin', verifyToken, (req, res) => {
    res.json({
        success: true,
        isAdmin: req.user && req.user.rol === 'admin'
    });
});

// Rutas de administración
router.get('/admin/usuarios', verifyToken, isAdmin, getAllUsers);
router.get('/admin/usuarios/:id', verifyToken, isAdmin, getUserById);

module.exports = router; 