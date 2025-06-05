import { FORMATS, CONFIG } from './config.js';

// Funciones de formato
export const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(price);
};

export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// Funciones de manejo de errores
export const handleError = (error) => {
    console.error('Error:', error);
    if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/pages/login.html';
    }
    return error;
};

// Funciones de alertas
export const showAlert = (message, type) => {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
};

// Funciones de navegación
export const redirectToLogin = () => {
    window.location.href = '/pages/login.html';
};

export const redirectToHome = () => {
    window.location.href = '/index.html';
}; 