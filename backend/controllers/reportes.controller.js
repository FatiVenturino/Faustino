const pool = require('../config/database');

// Reporte de ventas por período
const getReporteVentas = async (req, res) => {
    try {
        const { categoria, producto, periodo } = req.query;
        console.log('Parámetros recibidos:', { categoria, producto, periodo });

        // Validar y establecer valores por defecto
        const periodoColumn = periodo === 'diario' ? 'DATE(p.created_at)' : `TO_CHAR(p.created_at, 'YYYY-MM')`;
        const conditions = ['p.estado != \'pendiente\''];
        const params = [];
        let paramIndex = 1;

        // Construir condiciones solo si los parámetros tienen valor
        if (categoria && categoria.trim() !== '') {
            conditions.push(`pr.categoria_id = $${paramIndex}`);
            params.push(categoria);
            paramIndex++;
        }
        if (producto && producto.trim() !== '') {
            conditions.push(`pr.id = $${paramIndex}`);
            params.push(producto);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
        const groupByClause = ' GROUP BY ' + (periodo === 'diario' ? 'DATE(p.created_at)' : `TO_CHAR(p.created_at, 'YYYY-MM')`);
        const orderByClause = ' ORDER BY totalVendido DESC';

        // Query para el reporte temporal
        let queryTemporal = `
            SELECT 
                ${periodoColumn} as nombre,
                COUNT(p.id) as cantidadPedidos,
                COALESCE(SUM(p.total), 0) as totalVendido
            FROM pedidos p
            LEFT JOIN pedidos_detalle pd ON p.id = pd.pedido_id
            LEFT JOIN productos pr ON pd.producto_id = pr.id
            LEFT JOIN categorias c ON pr.categoria_id = c.id
            ${whereClause}
            ${groupByClause}
            ${orderByClause}
        `;

        // Query para productos más vendidos
        let queryProductos = `
            SELECT 
                pr.nombre,
                c.nombre as categoria,
                COALESCE(SUM(pd.cantidad), 0) as cantidadVendida,
                COALESCE(SUM(pd.subtotal), 0) as totalVendido
            FROM pedidos_detalle pd
            JOIN productos pr ON pd.producto_id = pr.id
            JOIN categorias c ON pr.categoria_id = c.id
            JOIN pedidos p ON pd.pedido_id = p.id
            ${whereClause}
            GROUP BY pr.id, c.nombre
            ${orderByClause}
        `;

        // Query para categorías
        let queryCategorias = `
            SELECT 
                c.nombre,
                COUNT(DISTINCT pr.id) as cantidadProductos,
                COALESCE(SUM(pd.subtotal), 0) as totalVendido
            FROM categorias c
            LEFT JOIN productos pr ON c.id = pr.categoria_id
            LEFT JOIN pedidos_detalle pd ON pr.id = pd.producto_id
            LEFT JOIN pedidos p ON pd.pedido_id = p.id
            ${whereClause}
            GROUP BY c.id, c.nombre
            ${orderByClause}
        `;

        // Query para el total de ventas global (sin filtros de categoría/producto/período)
        let queryTotalVentasGlobal = `
            SELECT COALESCE(SUM(total), 0) as totalVentasGlobal
            FROM pedidos
            WHERE estado != 'pendiente'
        `;

        console.log('Query Temporal:', queryTemporal);
        console.log('Query Productos:', queryProductos);
        console.log('Query Categorias:', queryCategorias);
        console.log('Query Total Ventas Global:', queryTotalVentasGlobal);
        console.log('Params:', params);

        // Ejecutar queries
        const [temporalResult, productosResult, categoriasResult, totalVentasGlobalResult] = await Promise.all([
            pool.query(queryTemporal, params),
            pool.query(queryProductos, params),
            pool.query(queryCategorias, params),
            pool.query(queryTotalVentasGlobal) // No params for global total
        ]);

        // Calcular resumen (solo totalVentasGlobal)
        const totalVentasGlobal = parseFloat(totalVentasGlobalResult.rows[0].totalventasglobal) || 0;

        console.log('[DEBUG] Valores resumen calculados en backend:', {
            totalVentasGlobal
        });

        res.json({
            success: true,
            totalventasglobal: totalVentasGlobal,
            temporal: temporalResult.rows,
            productos: productosResult.rows,
            categorias: categoriasResult.rows
        });
    } catch (error) {
        console.error('Error en getReporteVentas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ventas',
            error: error.message
        });
    }
};

// Reporte de productos más vendidos
const getReporteProductos = async (req, res) => {
    try {
        // const { fecha_inicio, fecha_fin } = req.query; // Eliminado

        const [productos] = await pool.query(`
            SELECT 
                p.id,
                p.nombre,
                c.nombre as categoria,
                SUM(pd.cantidad) as total_vendido,
                SUM(pd.subtotal) as total_ventas
            FROM pedidos_detalle pd
            JOIN productos p ON pd.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            JOIN pedidos ped ON pd.pedido_id = ped.id
            WHERE ped.estado != \'pendiente\'
            GROUP BY p.id
            ORDER BY total_vendido DESC
        `);

        res.json({
            success: true,
            reporte: productos
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de productos'
        });
    }
};

// Reporte de clientes
const getReporteClientes = async (req, res) => {
    try {
        // const { fecha_inicio, fecha_fin } = req.query; // Eliminado

        const [clientes] = await pool.query(`
            SELECT 
                u.id,
                u.nombre,
                u.email,
                COUNT(p.id) as total_pedidos,
                SUM(p.total) as total_gastado,
                AVG(p.total) as promedio_pedido
            FROM usuarios u
            LEFT JOIN pedidos p ON u.id = p.usuario_id
            WHERE p.estado != \'pendiente\'
            GROUP BY u.id
            ORDER BY total_gastado DESC
        `);

        res.json({
            success: true,
            reporte: clientes
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de clientes'
        });
    }
};

module.exports = {
    getReporteVentas,
    getReporteProductos,
    getReporteClientes
}; 