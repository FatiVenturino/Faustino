const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.log('No se encontró el header de autorización');
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log('No se encontró el token en el header');
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Token decodificado:', decoded);

        const result = await pool.query(
            'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            console.log('Usuario no encontrado en la base de datos');
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        req.user = result.rows[0];
        console.log('Usuario autenticado:', {
            id: req.user.id,
            nombre: req.user.nombre,
            email: req.user.email,
            rol: req.user.rol
        });
        next();
    } catch (error) {
        console.error('Error en verificación de token:', error);
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

const isAdmin = (req, res, next) => {
    console.log('Verificando rol de administrador para usuario:', {
        id: req.user.id,
        nombre: req.user.nombre,
        rol: req.user.rol
    });

    if (!req.user) {
        console.log('No hay usuario en la request');
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }

    // Verificar si la ruta es una ruta de administrador
    const isAdminRoute = req.path.startsWith('/admin/');
    
    if (isAdminRoute && req.user.rol !== 'admin') {
        console.log('Acceso denegado: usuario no es administrador para ruta de admin');
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador'
        });
    }

    // Si no es una ruta de admin, permitir el acceso a cualquier usuario autenticado
    console.log('Acceso concedido: usuario tiene los permisos necesarios');
    next();
};

// Middleware para verificar roles específicos
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (!allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Rol no autorizado'
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    isAdmin,
    checkRole
}; 