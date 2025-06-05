import { auth } from './auth.js';
import { cart } from './cart.js';

// Configuración de la API
const API_URL = 'http://localhost:3000/api';

// Funciones de utilidad
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(price);
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Funciones de autenticación
const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
};

const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.rol === 'admin';
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearCart();
    window.location.href = '/index.html';
};

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Funciones de manejo de errores
const handleError = (error) => {
    console.error('Error:', error);
    if (error.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/pages/login.html';
    }
    return error;
};

// Funciones de carrito
const getCart = () => {
    return JSON.parse(localStorage.getItem('cart')) || [];
};

const saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const addToCart = (product, quantity = 1) => {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.nombre,
            price: product.precio,
            quantity: quantity,
            image: product.imagen
        });
    }
    
    saveCart(cart);
    updateCartUI();
};

const removeFromCart = (productId) => {
    const cart = getCart();
    const updatedCart = cart.filter(item => item.id !== productId);
    saveCart(updatedCart);
    updateCartUI();
};

const updateCartQuantity = (productId, quantity) => {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
        updateCartUI();
    }
};

const clearCart = () => {
    localStorage.removeItem('cart');
    updateCartUI();
};

const updateCartUI = () => {
    const cart = getCart();
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cartCount) {
        cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = formatPrice(total);
    }
};

// Funciones de navegación
const redirectToLogin = () => {
    window.location.href = '/pages/login.html';
};

const redirectToHome = () => {
    window.location.href = '/index.html';
};

// Función para actualizar la UI según el estado de autenticación
const updateAuthUI = () => {
    const authButtons = document.getElementById('authButtons');
    const userDropdown = document.getElementById('userDropdown');
    const userName = document.getElementById('userName');
    const cartCount = document.getElementById('cartCount');
    
    if (auth.isAuthenticated()) {
        // Ocultar botones de autenticación
        if (authButtons) authButtons.style.display = 'none';
        
        // Mostrar dropdown de usuario
        if (userDropdown) {
            userDropdown.style.display = 'block';
            const user = auth.getUser();
            if (userName) userName.textContent = user.nombre;
        }
        
        // Actualizar contador del carrito
        if (cartCount) {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
        }
    } else {
        // Mostrar botones de autenticación
        if (authButtons) authButtons.style.display = 'block';
        
        // Ocultar dropdown de usuario
        if (userDropdown) userDropdown.style.display = 'none';
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Actualizar UI de autenticación
    updateAuthUI();
    
    // Botón cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
            });
        }
    
    // Actualizar UI del carrito
    if (cart && cart.updateUI) {
        cart.updateUI();
    }
}); 