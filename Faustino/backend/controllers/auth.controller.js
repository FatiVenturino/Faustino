const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Registrar nuevo usuario
const register = async (req, res) => {
    try {
        const { nombre, email, password, telefono } = req.body;

        // Verificar si el email ya existe
        const emailCheck = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar nuevo usuario
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password, telefono) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, telefono',
            [nombre, email, hashedPassword, telefono]
        );

        // Generar token
        const token = jwt.sign(
            { id: result.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: result.rows[0],
            token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario'
        });
    }
};

// Login de usuario
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Intento de login para email:', email);

        // Verificar si el usuario existe
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('Usuario no encontrado');
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = result.rows[0];
        console.log('Usuario encontrado:', { id: user.id, email: user.email });

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Contraseña incorrecta');
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token
        const tokenPayload = { id: user.id };
        console.log('Payload del token:', tokenPayload);
        console.log('JWT_SECRET:', process.env.JWT_SECRET || 'your-secret-key');
        
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        console.log('Token generado:', token);

        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                telefono: user.telefono,
                rol: user.rol
            },
            token
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión'
        });
    }
};

// Obtener información del usuario actual
const getMe = async (req, res) => {
    try {
        console.log('Obteniendo información del usuario:', req.user);
        const result = await pool.query(
            'SELECT id, nombre, email, telefono FROM usuarios WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            console.log('Usuario no encontrado en getMe');
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        console.log('Información del usuario encontrada:', result.rows[0]);
        res.json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error en getMe:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del usuario'
        });
    }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        console.log('Cambiando contraseña para usuario:', userId);

        // Obtener usuario actual
        const result = await pool.query(
            'SELECT password FROM usuarios WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            console.log('Usuario no encontrado');
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = result.rows[0];

        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            console.log('Contraseña actual incorrecta');
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Actualizar contraseña
        await pool.query(
            'UPDATE usuarios SET password = $1 WHERE id = $2',
            [hashedPassword, userId]
        );

        console.log('Contraseña actualizada exitosamente');
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar la contraseña'
        });
    }
};

// Verificar si el usuario autenticado es admin
const isAdmin = (req, res) => {
    try {
        // El middleware verifyToken ya adjunta la información del usuario a req.user
        const user = req.user;

        if (!user) {
            // Esto no debería pasar si el middleware verifyToken funciona correctamente
             return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        // Verificar el rol del usuario
        const isAdmin = user.rol === 'admin';

        res.json({ success: true, isAdmin: isAdmin });

    } catch (error) {
        console.error('Error en isAdmin check:', error);
        res.status(500).json({ success: false, message: 'Error al verificar rol de administrador' });
    }
};

module.exports = {
    register,
    login,
    getMe,
    changePassword,
    isAdmin
}; 