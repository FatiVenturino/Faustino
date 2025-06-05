import { auth } from '../js/auth.js';
import { cart } from '../components/cart.js';

class Navbar extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                <div class="container">
                    <a class="navbar-brand" href="/index.html">Faustino</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item" id="nav-inicio">
                                <a class="nav-link" href="/index.html">Inicio</a>
                            </li>
                            <li class="nav-item" id="nav-productos">
                                <a class="nav-link" href="/pages/productos.html">Productos</a>
                            </li>
                            <li class="nav-item" id="nav-mis-pedidos">
                                <a class="nav-link" href="/pages/mis-pedidos.html">Mis Pedidos</a>
                            </li>
                            <li class="nav-item" id="nav-historial">
                                <a class="nav-link" href="/pages/historial.html">Historial</a>
                            </li>
                            <!-- Enlace solo para Admin -->
                            <li class="nav-item d-none" id="nav-dashboard">
                                <a class="nav-link" href="/pages/admin/dashboard.html">Dashboard</a>
                            </li>
                        </ul>
                        <div class="d-flex align-items-center">
                            <a href="/pages/carrito.html" class="btn btn-outline-light me-2">
                                <i class="bi bi-cart"></i>
                                <span id="cartCount" class="badge bg-danger">0</span>
                            </a>
                            <!-- Botones de autenticación -->
                            <div id="authButtons">
                                <a href="/pages/login.html" class="btn btn-outline-light me-2">Iniciar Sesión</a>
                                <a href="/pages/registro.html" class="btn btn-light">Registrarse</a>
                            </div>
                            <!-- Dropdown de usuario -->
                            <div id="userDropdown" class="dropdown" style="display: none;">
                                <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    <span id="userName">Usuario</span>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <a class="dropdown-item" href="/pages/perfil.html">Mi Perfil</a>
                                    </li>
                                    <li><hr class="dropdown-divider" /></li>
                                    <li>
                                        <a class="dropdown-item" href="#" id="logoutBtn">Cerrar Sesión</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    setupEventListeners() {
        // Botón cerrar sesión
        const logoutBtn = this.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                auth.logout();
            });
        }

        // Actualizar UI inicial
        this.updateUI();
    }

    // Convertir updateUI a async
    async updateUI() {
        const authButtons = this.querySelector('#authButtons');
        const userDropdown = this.querySelector('#userDropdown');
        const userName = this.querySelector('#userName');
        const cartCount = this.querySelector('#cartCount');

        // Obtener referencias a los elementos de navegación
        const navInicio = this.querySelector('#nav-inicio');
        const navProductos = this.querySelector('#nav-productos');
        const navMisPedidos = this.querySelector('#nav-mis-pedidos');
        const navHistorial = this.querySelector('#nav-historial');
        const navDashboard = this.querySelector('#nav-dashboard');

        // Función auxiliar para mostrar/ocultar enlaces basada en si es admin
        const toggleAdminLinks = (isAdmin) => {
             if (isAdmin) {
                // Admin ve todo
                if(navInicio) navInicio.classList.remove('d-none');
                if(navProductos) navProductos.classList.remove('d-none');
                if(navMisPedidos) navMisPedidos.classList.remove('d-none');
                if(navHistorial) navHistorial.classList.remove('d-none');
                if(navDashboard) navDashboard.classList.remove('d-none');
            } else { // No es admin (cliente)
                 // Cliente solo ve Inicio, Productos, Mis Pedidos
                if(navInicio) navInicio.classList.remove('d-none');
                if(navProductos) navProductos.classList.remove('d-none');
                if(navMisPedidos) navMisPedidos.classList.remove('d-none');
                
                // Ocultar Historial y Dashboard
                if(navHistorial) navHistorial.classList.add('d-none');
                if(navDashboard) navDashboard.classList.add('d-none');
            }
        };

        if (auth.isAuthenticated()) {
            // Usuario autenticado
            if (authButtons) authButtons.style.display = 'none';
            if (userDropdown) {
                userDropdown.style.display = 'block';
                const user = auth.getUser();
                if (userName) userName.textContent = user ? user.nombre : 'Usuario';

                // 1. Intentar leer el estado de admin desde localStorage (caché)
                const cachedIsAdmin = localStorage.getItem('isAdmin');
                let isAdminUser = cachedIsAdmin === 'true';
                console.log('Estado de admin cacheado:', isAdminUser);

                // Actualizar la UI inicialmente con el valor cacheado
                toggleAdminLinks(isAdminUser);

                // 2. Realizar la llamada asíncrona al backend para obtener el estado actual
                const liveIsAdmin = await auth.checkAdminStatus();
                console.log('Estado de admin del backend:', liveIsAdmin);

                // 3. Si el estado del backend difiere del cacheado, actualizar la UI nuevamente
                if (liveIsAdmin !== isAdminUser) {
                    console.log('El estado de admin cambió. Actualizando UI...');
                    toggleAdminLinks(liveIsAdmin);
                }
            }

            // Actualizar contador del carrito
            if (cartCount) {
                const cartItems = cart.getItems();
                cartCount.textContent = cartItems.reduce((total, item) => total + item.quantity, 0);
            }
        } else {
            // Usuario no autenticado
            if (authButtons) authButtons.style.display = 'block';
            if (userDropdown) userDropdown.style.display = 'none';

            // Solo mostrar Inicio y Productos
            if(navInicio) navInicio.classList.remove('d-none');
            if(navProductos) navProductos.classList.remove('d-none');
            
            if(navMisPedidos) navMisPedidos.classList.add('d-none');
            if(navHistorial) navHistorial.classList.add('d-none');
            if(navDashboard) navDashboard.classList.add('d-none');

            // Contador del carrito visible para no logueados también
            if (cartCount) {
                const cartItems = cart.getItems();
                cartCount.textContent = cartItems.reduce((total, item) => total + item.quantity, 0);
            }
            // Asegurarse de que el estado cacheado de admin sea false para no logueados
            localStorage.setItem('isAdmin', 'false');
        }
    }
}

// Registrar el componente
customElements.define('app-navbar', Navbar);

// Exportar función para actualizar el navbar desde cualquier parte
export const updateNavbar = () => {
    const navbar = document.querySelector('app-navbar');
    if (navbar) {
        // Llamar a updateUI, que ahora es async
        navbar.updateUI();
    }
}; 