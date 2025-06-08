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

        // Armar objeto usuario y detalles con producto
        const pedidoRow = pedidoResult.rows[0];
        const usuario = {
            nombre: pedidoRow.cliente_nombre,
            email: pedidoRow.cliente_email,
            telefono: pedidoRow.cliente_telefono
        };
        const detalles = detallesResult.rows.map(d => ({
            id: d.id,
            cantidad: d.cantidad,
            precio_unitario: d.precio_unitario,
            subtotal: d.subtotal,
            producto: {
                nombre: d.producto_nombre,
                imagen: d.producto_imagen
            }
        }));

        res.json({
            success: true,
            pedido: {
                id: pedidoRow.id,
                numero_pedido: pedidoRow.numero_pedido,
                created_at: pedidoRow.created_at,
                estado: pedidoRow.estado,
                metodo_pago: pedidoRow.metodo_pago,
                total: pedidoRow.total,
                usuario,
                detalles
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

        const { items, metodo_pago } = req.body;
        const usuario_id = req.user.id;
        const numero_pedido = generarNumeroPedido();

        // Calcular total
        let total = 0;
        for (const item of items) {
            const productoResult = await client.query(
                'SELECT precio FROM productos WHERE id = $1 AND estado = $2',
                [item.producto_id, 'activo']
            );

            if (productoResult.rows.length === 0) {
                throw new Error(`Producto ${item.producto_id} no encontrado o inactivo`);
            }

            total += productoResult.rows[0].precio * item.cantidad;
        }

        // Crear pedido
        const pedidoResult = await client.query(
            'INSERT INTO pedidos (usuario_id, numero_pedido, total, metodo_pago) VALUES ($1, $2, $3, $4) RETURNING *',
            [usuario_id, numero_pedido, total, metodo_pago]
        );

        const pedido_id = pedidoResult.rows[0].id;

        // Crear detalles del pedido
        for (const item of items) {
            const productoResult = await client.query(
                'SELECT precio FROM productos WHERE id = $1',
                [item.producto_id]
            );

            const subtotal = productoResult.rows[0].precio * item.cantidad;

            await client.query(
                'INSERT INTO pedidos_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [pedido_id, item.producto_id, item.cantidad, productoResult.rows[0].precio, subtotal]
            );

            // Actualizar stock
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2',
                [item.cantidad, item.producto_id]
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

// Obtener historial de pedidos con filtros
const getHistorialPedidos = async (req, res) => {
    try {
        let { fechaInicio, fechaFin, estado, idPedido, page, limit } = req.query;
        // Ensure page and limit are numbers, default to 1 and 10
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        console.log('[DEBUG] Parámetros recibidos para historial de pedidos:', { fechaInicio, fechaFin, estado, idPedido, page, limit });

        let conditions = [];
        let filterParams = [];
        let paramIndex = 1;

        // Default condition for historical orders (entregado or cancelado) if no specific state is provided
        if (!estado || estado === '') {
            conditions.push("p.estado IN ('entregado', 'cancelado')");
        } else { // If a specific state is provided, override the default
            conditions.push(`p.estado = $${paramIndex}`);
            filterParams.push(estado.toLowerCase());
            paramIndex++;
        }

        if (fechaInicio) {
            conditions.push(`p.created_at >= $${paramIndex}::date`);
            filterParams.push(fechaInicio);
            paramIndex++;
        }
        if (fechaFin) {
            conditions.push(`p.created_at <= $${paramIndex}::date`);
            filterParams.push(fechaFin);
            paramIndex++;
        }
        if (idPedido) {
            conditions.push(`p.id = $${paramIndex}::int`);
            filterParams.push(idPedido);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        console.log('[DEBUG] Cláusula WHERE construida:', whereClause);
        console.log('[DEBUG] Parámetros de filtro iniciales:', filterParams);

        // Get total count for pagination metadata
        const countQuery = `
            SELECT COUNT(*) FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            ${whereClause};
        `;
        const { rows: countRows } = await pool.query(countQuery, filterParams);
        const totalCount = parseInt(countRows[0].count, 10);

        // Add pagination parameters directly to the params array
        const offset = (page - 1) * limit;
        
        // Calculate parameter indices for LIMIT and OFFSET based on the current length of 'params' array
        // These will be the last parameters in the array.
        const limitParamIndex = filterParams.length + 1; 
        const offsetParamIndex = filterParams.length + 2;     

        filterParams.push(limit); // This will be at index (limitParamIndex - 1)
        filterParams.push(offset); // This will be at index (offsetParamIndex - 1)


        const query = `
            SELECT
                p.id AS id_pedido,
                TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') AS fecha,
                p.total AS total_facturado,
                p.estado AS estado_pedido,
                u.nombre AS nombre_cliente,
                u.email AS email_cliente
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex};
        `;
        console.log('[DEBUG] Query final para historial de pedidos:', query);
        console.log('[DEBUG] Parámetros finales para la consulta:', filterParams);


        const { rows } = await pool.query(query, filterParams);
        console.log('[DEBUG] Pedidos encontrados en historial (pagina): ', rows.length);

        res.json({
            success: true,
            pedidos: rows,
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalCount / parseInt(limit))
        });

    } catch (error) {
        console.error('Error al obtener historial de pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de pedidos',
            error: error.message
        });
    }
};

// Obtener detalles de un pedido específico
const getDetallePedido = async (req, res) => {
    try {
        const { id } = req.params;

        const queryPedido = `
            SELECT
                p.id AS id_pedido,
                TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI:SS') AS fecha,
                p.total AS total_facturado,
                p.estado AS estado_pedido,
                p.metodo_pago,
                p.direccion_envio,
                p.ciudad_envio,
                p.codigo_postal_envio,
                p.telefono_envio,
                u.nombre AS nombre_cliente,
                u.email AS email_cliente
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.id = $1;
        `;

        const { rows: pedido } = await pool.query(queryPedido, [id]);

        if (pedido.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado.'
            });
        }

        const queryDetalle = `
            SELECT
                pd.cantidad,
                pd.subtotal,
                pr.nombre AS nombre_producto,
                pr.precio AS precio_unitario,
                pr.imagen_url AS producto_imagen
            FROM pedidos_detalle pd
            JOIN productos pr ON pd.producto_id = pr.id
            WHERE pd.pedido_id = $1;
        `;

        const { rows: detalle } = await pool.query(queryDetalle, [id]);

        res.json({
            success: true,
            pedido: pedido[0],
            detalle: detalle
        });

    } catch (error) {
        console.error('Error al obtener detalles del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener detalles del pedido',
            error: error.message
        });
    }
};

module.exports = {
    getPedidosUsuario,
    getAllPedidos,
    getPedidoById,
    createPedido,
    updateEstadoPedido,
    getHistorialPedidos,
    getDetallePedido
}; 