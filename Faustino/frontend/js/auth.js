import { CONFIG } from './config.js';
import { redirectToLogin } from './utils.js';

// Funciones de autenticación
export const auth = {
    // Verificar si el usuario está autenticado
    isAuthenticated: () => {
        return localStorage.getItem('token') !== null;
    },

    // Obtener el token de autenticación
    getToken: () => {
        return localStorage.getItem('token');
    },

    // Obtener información del usuario
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Obtener headers de autenticación
    getAuthHeader: () => {
        const token = localStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    },

    // Verificar si el usuario es admin consultando el backend
    checkAdminStatus: async () => {
        if (!auth.isAuthenticated()) {
             localStorage.setItem('isAdmin', 'false'); // Asegurar que la clave exista aunque no esté logueado
            return false; // No es admin si no está autenticado
        }
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/is-admin`, {
                headers: auth.getAuthHeader()
            });

            const data = await response.json();

            if (response.ok && data.success) {
                localStorage.setItem('isAdmin', data.isAdmin.toString()); // Guardar el estado de admin en localStorage como cadena
                return data.isAdmin; // Devuelve true o false
            } else {
                console.error('Error al verificar estado de admin:', data.message);
                localStorage.setItem('isAdmin', 'false'); // En caso de error, asumir no admin
                return false; // Asumir que no es admin en caso de error
            }
        } catch (error) {
            console.error('Error de conexión al verificar estado de admin:', error);
             localStorage.setItem('isAdmin', 'false'); // En caso de error de conexión, asumir no admin
            return false; // Asumir que no es admin en caso de error de conexión
        }
    },

    // Cerrar sesión
    logout: () => {
        localStorage.clear(); // Limpiar todo el localStorage
        window.location.href = '/pages/login.html';
    },

    isAdmin: () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user && user.rol === 'admin';
    },

    login: async (email, password) => {
        try {
            const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                return data;
            } else {
                throw new Error(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            throw error;
        }
    },

    updateUI: () => {
        const authLinks = document.querySelectorAll('.auth-link');
        const userLinks = document.querySelectorAll('.user-link');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (auth.isAuthenticated()) {
            const user = auth.getUser();
            authLinks.forEach(link => link.style.display = 'none');
            userLinks.forEach(link => link.style.display = 'block');
            if (userName) userName.textContent = user.nombre;
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.logout();
                });
            }
        } else {
            authLinks.forEach(link => link.style.display = 'block');
            userLinks.forEach(link => link.style.display = 'none');
        }
    }
}; 