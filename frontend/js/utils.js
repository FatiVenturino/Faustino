import { FORMATS, CONFIG } from './config.js';

// Funciones de formato
export const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(price);
};

export function formatDate(dateString) {
    if (!dateString) {
        return 'Fecha no disponible';
    }

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Fecha inválida';
        }
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'Fecha inválida';
    }
}

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
export const showAlert = (message, type = 'info') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Intentar encontrar el contenedor por ID primero
    let container = document.getElementById('alertContainer');
    
    // Si no se encuentra por ID, buscar por clase
    if (!container) {
        container = document.querySelector('.cart-container');
    }
    
    // Si se encontró un contenedor, insertar la alerta
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-cerrar la alerta después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    } else {
        console.warn('No se encontró un contenedor para mostrar la alerta');
    }
};

// Funciones para obtener el color e icono del badge según el estado
export function getEstadoBadgeColor(estado) {
    const estados = {
        'pendiente': 'warning',
        'confirmado': 'info',
        'en_preparacion': 'primary',
        'listo': 'success',
        'entregado': 'success',
        'cancelado': 'danger'
    };
    return estados[estado] || 'secondary';
}

export function getEstadoIcon(estado) {
    const iconos = {
        'pendiente': '⏳',
        'confirmado': '✅',
        'en_preparacion': '🍳',
        'listo': '📦',
        'entregado': '🎉',
        'cancelado': '❌'
    };
    return iconos[estado] || '❓';
}

// Funciones de navegación
export const redirectToLogin = () => {
    window.location.href = '/pages/login.html';
};

export const redirectToHome = () => {
    window.location.href = '/index.html';
}; 