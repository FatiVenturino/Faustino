const { Pool } = require('pg');
require('dotenv').config();

// Debug: Verificar variables de entorno
console.log('Configuración de la base de datos:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Password:', process.env.DB_PASSWORD ? '******' : 'undefined');
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT);

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432
});

// Verificar la conexión
pool.connect()
    .then(() => console.log('Conexión a la base de datos establecida correctamente'))
    .catch(err => console.error('Error al conectar a la base de datos:', err));

module.exports = pool; 