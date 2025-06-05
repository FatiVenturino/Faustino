const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration() {
    const client = await pool.connect();
    try {
        // Leer el archivo SQL
        const sql = fs.readFileSync(
            path.join(__dirname, '../migrations/add_columns_to_pedidos.sql'),
            'utf8'
        );

        // Ejecutar la migración
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('Migración ejecutada exitosamente');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al ejecutar la migración:', error);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration(); 