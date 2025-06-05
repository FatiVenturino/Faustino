const pool = require('../config/database');

// Generar número de pedido único
const generarNumeroPedido = () => {
    const fecha = new Date();
    const timestamp = fecha.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PED-${timestamp}-${random}`;
};

// Obtener todos los pedidos del usuario
const getPedidosUsuario = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, 
                   COUNT(pd.id) as total_items,
                   STRING_AGG(CONCAT(pr.nombre, ' (', pd.cantidad, ')'), ', ') as productos
            FROM pedidos p
            LEFT JOIN pedidos_detalle pd ON p.id = pd.pedido_id
            LEFT JOIN productos pr ON pd.producto_id = pr.id
            WHERE p.usuario_id = $1
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `, [req.user.id]);

        res.json({
            success: true,
            pedidos: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos'
        });
    }
};

// Obtener todos los pedidos (admin)
const getAllPedidos = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*, 
                   u.nombre as cliente_nombre,
                   u.email as cliente_email,
                   COUNT(pd.id) as total_items,
                   STRING_AGG(CONCAT(pr.nombre, ' (', pd.cantidad, ')'), ', ') as productos
            FROM pedidos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN pedidos_detalle pd ON p.id = pd.pedido_id
            LEFT JOIN productos pr ON pd.producto_id = pr.id
            GROUP BY p.id, u.nombre, u.email
            ORDER BY p.created_at DESC
        `);

        res.json({
            success: true,
            pedidos: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos'
        });
    }
};

// Obtener detalle de un pedido
const getPedidoById = async (req, res) => {
    try {
        const pedidoResult = await pool.query(`
            SELECT p.*, 
                   u.nombre as cliente_nombre,
                   u.email as cliente_email,
                   u.telefono as cliente_telefono
            FROM pedidos p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = $1
        `, [req.params.id]);

        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        const detallesResult = await pool.query(`
            SELECT pd.*, 
                   pr.nombre as producto_nombre,
                   pr.imagen as producto_imagen
            FROM pedidos_detalle pd
            LEFT JOIN productos pr ON pd.producto_id = pr.id
            WHERE pd.pedido_id = $1
        `, [req.params.id]);

        res.json({
            success: true,
            pedido: {
                ...pedidoResult.rows[0],
                detalles: detallesResult.rows
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalle del pedido'
        });
    }
};

// Crear nuevo pedido
const createPedido = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { items, direccion_entrega, metodo_pago, notas } = req.body;
        const usuario_id = req.user.id;
        const numero_pedido = generarNumeroPedido();

        // Calcular total
        let total = 0;
        for (const item of items) {
            const productoResult = await client.query(
                'SELECT precio FROM productos WHERE id = $1 AND estado = $2',
                [item.product_id, 'activo']
            );

            if (productoResult.rows.length === 0) {
                throw new Error(`Producto ${item.product_id} no encontrado o inactivo`);
            }

            total += productoResult.rows[0].precio * item.quantity;
        }

        // Crear pedido
        const pedidoResult = await client.query(
            'INSERT INTO pedidos (usuario_id, numero_pedido, total, direccion_entrega, metodo_pago, notas) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [usuario_id, numero_pedido, total, direccion_entrega, metodo_pago, notas]
        );

        const pedido_id = pedidoResult.rows[0].id;

        // Crear detalles del pedido
        for (const item of items) {
            const productoResult = await client.query(
                'SELECT precio FROM productos WHERE id = $1',
                [item.product_id]
            );

            const subtotal = productoResult.rows[0].precio * item.quantity;

            await client.query(
                'INSERT INTO pedidos_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [pedido_id, item.product_id, item.quantity, productoResult.rows[0].precio, subtotal]
            );

            // Actualizar stock
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.product_id]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            pedido: pedidoResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear pedido'
        });
    } finally {
        client.release();
    }
};

// Actualizar estado del pedido (admin)
const updateEstadoPedido = async (req, res) => {
    try {
        const { estado } = req.body;
        const pedidoId = req.params.id;

        const result = await pool.query(
            'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
            [estado, pedidoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Estado del pedido actualizado exitosamente',
            pedido: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado del pedido'
        });
    }
};

module.exports = {
    getPedidosUsuario,
    getAllPedidos,
    getPedidoById,
    createPedido,
    updateEstadoPedido
}; 