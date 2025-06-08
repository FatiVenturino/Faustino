const pool = require('../config/database');

// Obtener todos los productos activos
const getAllProductos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.estado = 'activo'
            ORDER BY p.nombre
        `);

        const productosWithImagePath = result.rows.map(product => {
            const imagePath = product.imagen && product.categoria_nombre ?
                `../assets/images/${product.categoria_nombre.toLowerCase()}/${product.imagen}` :
                '../assets/images/no-image.jpg'; // Fallback for no image
            return {
                ...product,
                imagen: imagePath
            };
        });

        res.json({
            success: true,
            productos: productosWithImagePath
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos'
        });
    }
};

// Obtener producto por ID
const getProductoById = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const product = result.rows[0];
        const imagePath = product.imagen && product.categoria_nombre ?
            `../assets/images/${product.categoria_nombre.toLowerCase()}/${product.imagen}` :
            '../assets/images/no-image.jpg'; // Fallback for no image

        res.json({
            success: true,
            producto: {
                ...product,
                imagen: imagePath
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto'
        });
    }
};

// Obtener productos por categoría
const getProductosByCategoria = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.categoria_id = $1 AND p.estado = 'activo'
            ORDER BY p.nombre
        `, [req.params.categoriaId]);

        const productosWithImagePath = result.rows.map(product => {
            const imagePath = product.imagen && product.categoria_nombre ?
                `../assets/images/${product.categoria_nombre.toLowerCase()}/${product.imagen}` :
                '../assets/images/no-image.jpg'; // Fallback for no image
            return {
                ...product,
                imagen: imagePath
            };
        });

        res.json({
            success: true,
            productos: productosWithImagePath
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos por categoría'
        });
    }
};

// Crear nuevo producto (admin)
const createProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, imagen, categoria_id } = req.body;

        const result = await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, stock, imagen, categoria_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nombre, descripcion, precio, stock, imagen, categoria_id]
        );

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al crear producto'
        });
    }
};

// Actualizar producto (admin)
const updateProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, imagen, categoria_id, estado } = req.body;
        const productoId = req.params.id;

        const result = await pool.query(
            'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4, imagen = $5, categoria_id = $6, estado = $7 WHERE id = $8 RETURNING *',
            [nombre, descripcion, precio, stock, imagen, categoria_id, estado, productoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            producto: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto'
        });
    }
};

// Eliminar producto (admin)
const deleteProducto = async (req, res) => {
    try {
        const productoId = req.params.id;

        const result = await pool.query(
            'UPDATE productos SET estado = $1 WHERE id = $2 RETURNING *',
            ['inactivo', productoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto'
        });
    }
};

module.exports = {
    getAllProductos,
    getProductoById,
    getProductosByCategoria,
    createProducto,
    updateProducto,
    deleteProducto
}; 