// Configuración global
export const CONFIG = {
    API_URL: process.env.API_URL || 'http://localhost:3000/api',
    SHIPPING_COST: 500,
    CURRENCY: 'ARS',
    LOCALE: 'es-AR'
};

// Configuración de formatos
export const FORMATS = {
    price: {
        style: 'currency',
        currency: CONFIG.CURRENCY
    },
    date: {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
}; 