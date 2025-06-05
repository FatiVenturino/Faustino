import { CONFIG } from './config.js';
// import { showAlert } from './utils.js'; // Ya no usaremos showAlert para errores de login aquí
import { auth } from './auth.js';
import { updateNavbar } from '../components/navbar.js';

// Obtener los elementos de la alerta de error
const loginErrorAlert = document.getElementById('loginErrorAlert');
const loginErrorMessage = document.getElementById('loginErrorMessage');

// Función para mostrar el error de login
const showLoginError = (message) => {
    loginErrorMessage.textContent = message;
    loginErrorAlert.classList.remove('d-none');
};

// Función para ocultar el error de login
const hideLoginError = () => {
    loginErrorAlert.classList.add('d-none');
    loginErrorMessage.textContent = '';
};

// Manejar el inicio de sesión
const handleLogin = async (e) => {
    e.preventDefault();
    
    hideLoginError(); // Ocultar cualquier error previo al intentar logear
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Limpiar cualquier estado anterior
        localStorage.clear();
        
        const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('Respuesta de login exitosa. Guardando en localStorage...');
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Datos guardados en localStorage.');
            window.location.href = '../index.html';
        } else {
            console.error('Error de respuesta del servidor (' + response.status + '):', data);
            showLoginError(data.message || 'Error al iniciar sesión');
            document.getElementById('password').value = '';
        }
    } catch (error) {
        console.error('Error de conexión o inesperado:', error);
        showLoginError('Error al conectar con el servidor');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Si ya está autenticado, redirigir al inicio
    if (auth.isAuthenticated()) {
        window.location.href = '../index.html';
        return;
    }
    
    // Formulario de login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}); 