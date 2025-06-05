const pool = require('../config/database');

// Reporte de ventas por período
const getReporteVentas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        const [ventas] = await pool.query(`
            SELECT 
                DATE(p.created_at) as fecha,
                COUNT(*) as total_pedidos,
                SUM(p.total) as total_ventas,
                AVG(p.total) as promedio_venta
            FROM pedidos p
            WHERE p.created_at BETWEEN ? AND ?
            AND p.estado != 'pendiente'
            GROUP BY DATE(p.created_at)
            ORDER BY fecha DESC
        `, [fecha_inicio, fecha_fin]);

        res.json({
            success: true,
            reporte: ventas
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ventas'
        });
    }
};

// Reporte de productos más vendidos
const getReporteProductos = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

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
            WHERE ped.created_at BETWEEN ? AND ?
            AND ped.estado != 'pendiente'
            GROUP BY p.id
            ORDER BY total_vendido DESC
        `, [fecha_inicio, fecha_fin]);

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
        const { fecha_inicio, fecha_fin } = req.query;

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
            WHERE p.created_at BETWEEN ? AND ?
            AND p.estado != 'pendiente'
            GROUP BY u.id
            ORDER BY total_gastado DESC
        `, [fecha_inicio, fecha_fin]);

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