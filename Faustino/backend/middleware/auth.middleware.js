const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verifyToken = async (req, res, next) => {
    try {
        console.log('Headers recibidos:', req.headers);
        const token = req.headers.authorization?.split(' ')[1];
        console.log('Token extraído:', token);
        
        if (!token) {
            console.log('No se proporcionó token');
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        console.log('JWT_SECRET:', process.env.JWT_SECRET || 'your-secret-key');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('Token decodificado:', decoded);
        
        // Verificar si el usuario existe
        console.log('Buscando usuario con ID:', decoded.id);
        const result = await pool.query(
            'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
            [decoded.id]
        );
        console.log('Resultado de la búsqueda:', result.rows);

        if (result.rows.length === 0) {
            console.log('Usuario no encontrado en la base de datos');
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        req.user = result.rows[0];
        console.log('Usuario autenticado:', req.user);
        next();
    } catch (error) {
        console.error('Error detallado de autenticación:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren privilegios de administrador'
        });
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin
}; 