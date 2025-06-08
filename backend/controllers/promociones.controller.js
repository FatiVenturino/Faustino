const pool = require('../config/database');

// Obtener todas las promociones activas
const getPromocionesActivas = async (req, res) => {
    try {
        const [promociones] = await pool.query(`
            SELECT * FROM promociones 
            WHERE estado = 'activa' 
            AND fecha_inicio <= CURDATE() 
            AND fecha_fin >= CURDATE()
            ORDER BY fecha_inicio DESC
        `);

        res.json({
            success: true,
            promociones
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener promociones'
        });
    }
};

// Obtener todas las promociones (admin)
const getAllPromociones = async (req, res) => {
    try {
        const [promociones] = await pool.query(`
            SELECT * FROM promociones 
            ORDER BY fecha_inicio DESC
        `);

        res.json({
            success: true,
            promociones
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener promociones'
        });
    }
};

// Obtener promoción por ID
const getPromocionById = async (req, res) => {
    try {
        const [promociones] = await pool.query(
            'SELECT * FROM promociones WHERE id = ?',
            [req.params.id]
        );

        if (promociones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promoción no encontrada'
            });
        }

        res.json({
            success: true,
            promocion: promociones[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener promoción'
        });
    }
};

// Crear nueva promoción (admin)
const createPromocion = async (req, res) => {
    try {
        const { nombre, tipo, descuento, fecha_inicio, fecha_fin } = req.body;

        // Validar fechas
        if (new Date(fecha_inicio) > new Date(fecha_fin)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio debe ser anterior a la fecha de fin'
            });
        }

        const [result] = await pool.query(
            'INSERT INTO promociones (nombre, tipo, descuento, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?, ?)',
            [nombre, tipo, descuento, fecha_inicio, fecha_fin]
        );

        const [newPromocion] = await pool.query(
            'SELECT * FROM promociones WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Promoción creada exitosamente',
            promocion: newPromocion[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear promoción'
        });
    }
};

// Actualizar promoción (admin)
const updatePromocion = async (req, res) => {
    try {
        const { nombre, tipo, descuento, fecha_inicio, fecha_fin, estado } = req.body;
        const promocionId = req.params.id;

        // Validar fechas
        if (new Date(fecha_inicio) > new Date(fecha_fin)) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio debe ser anterior a la fecha de fin'
            });
        }

        await pool.query(
            'UPDATE promociones SET nombre = ?, tipo = ?, descuento = ?, fecha_inicio = ?, fecha_fin = ?, estado = ? WHERE id = ?',
            [nombre, tipo, descuento, fecha_inicio, fecha_fin, estado, promocionId]
        );

        const [updatedPromocion] = await pool.query(
            'SELECT * FROM promociones WHERE id = ?',
            [promocionId]
        );

        if (updatedPromocion.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Promoción no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Promoción actualizada exitosamente',
            promocion: updatedPromocion[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar promoción'
        });
    }
};

// Eliminar promoción (admin)
const deletePromocion = async (req, res) => {
    try {
        const promocionId = req.params.id;

        await pool.query(
            'UPDATE promociones SET estado = ? WHERE id = ?',
            ['inactiva', promocionId]
        );

        res.json({
            success: true,
            message: 'Promoción eliminada exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar promoción'
        });
    }
};

module.exports = {
    getPromocionesActivas,
    getAllPromociones,
    getPromocionById,
    createPromocion,
    updatePromocion,
    deletePromocion
}; 