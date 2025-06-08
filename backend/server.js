const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');

// Debug: Verificar la ruta del archivo .env
const envPath = path.resolve(__dirname, '../.env');
console.log('Buscando archivo .env en:', envPath);
console.log('¿Existe el archivo .env?', fs.existsSync(envPath));

// Cargar variables de entorno
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error al cargar .env:', result.error);
} else {
    console.log('Archivo .env cargado correctamente');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Debug: Verificar variables de entorno
console.log('Variables de entorno:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '******' : 'undefined');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

app.use(cors());
app.use(express.json());

// Formato personalizado para los logs
morgan.token('body', (req) => JSON.stringify(req.body));
morgan.token('query', (req) => JSON.stringify(req.query));

// Middleware de logging personalizado
app.use(morgan(':method :url :status :response-time ms - :res[content-length] - Query: :query - Body: :body', {
    skip: (req) => req.url === '/favicon.ico'
}));

// Configuración inicial de la base de datos (conectando a postgres)
const initialPool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Conectamos primero a postgres
    port: process.env.DB_PORT || 5432
});

// Configuración de la base de datos para la aplicación
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432
});

// Función para inicializar la base de datos
const initializeDatabase = async () => {
    try {
        // Verificar si la base de datos existe
        const result = await initialPool.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [process.env.DB_NAME]
        );

        if (result.rowCount === 0) {
            // Crear la base de datos si no existe
            await initialPool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log(`Base de datos ${process.env.DB_NAME} creada.`);

            // Leer el script de inicialización
            const initScript = fs.readFileSync(path.join(__dirname, '../database/init.sql'), 'utf8');
            
            // Ejecutar el script usando el pool de la aplicación
            await pool.query(initScript);
            console.log('Script de inicialización ejecutado correctamente.');
        } else {
            console.log(`La base de datos ${process.env.DB_NAME} ya existe.`);
        }
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        // Debug: Mostrar más detalles del error
        console.error('Detalles del error:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
    } finally {
        // Cerrar la conexión inicial
        await initialPool.end();
    }
};

// Inicializar la base de datos al iniciar el servidor
initializeDatabase();

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/categorias', require('./routes/categorias.routes'));
app.use('/api/pedidos', require('./routes/pedidos.routes'));
app.use('/api/promociones', require('./routes/promociones.routes'));
app.use('/api/reportes', require('./routes/reportes.routes'));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 