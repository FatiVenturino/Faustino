const pool = require('../config/database');

// Obtener todas las categorías
const getAllCategorias = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, COUNT(p.id) as total_productos
            FROM categorias c
            LEFT JOIN productos p ON c.id = p.categoria_id AND p.estado = 'activo'
            WHERE c.nombre NOT IN ('Congelados', 'Secos', 'Refrigerados')
            GROUP BY c.id
            ORDER BY c.nombre
        `);

        res.json({
            success: true,
            categorias: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorías'
        });
    }
};

// Obtener categoría por ID
const getCategoriaById = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categorias WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        res.json({
            success: true,
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoría'
        });
    }
};

// Crear nueva categoría (admin)
const createCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        const result = await pool.query(
            'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
            [nombre, descripcion]
        );

        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear categoría'
        });
    }
};

// Actualizar categoría (admin)
const updateCategoria = async (req, res) => {
    try {
        const { nombre, descripcion, estado } = req.body;
        const categoriaId = req.params.id;

        const result = await pool.query(
            'UPDATE categorias SET nombre = $1, descripcion = $2, estado = $3 WHERE id = $4 RETURNING *',
            [nombre, descripcion, estado, categoriaId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            categoria: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar categoría'
        });
    }
};

// Eliminar categoría (admin)
const deleteCategoria = async (req, res) => {
    try {
        const categoriaId = req.params.id;

        // Verificar si hay productos asociados
        const productosCheck = await pool.query(
            'SELECT COUNT(*) FROM productos WHERE categoria_id = $1',
            [categoriaId]
        );

        if (productosCheck.rows[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar la categoría porque tiene productos asociados'
            });
        }

        const result = await pool.query(
            'DELETE FROM categorias WHERE id = $1 RETURNING *',
            [categoriaId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar categoría'
        });
    }
};

module.exports = {
    getAllCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria
}; 