import { auth } from '../auth.js';
import { CONFIG } from '../config.js';
import { showAlert } from '../utils.js';

class UsuariosManager {
    constructor() {
        this.usuarios = [];
        this.modal = null;
        this.initializeElements();
        this.setupEventListeners();
        this.checkAdminAccess();
        this.loadUsuarios();
    }

    initializeElements() {
        // Modal
        this.modal = new bootstrap.Modal(document.getElementById('modalUsuario'));

        // Botones y controles
        this.btnBuscar = document.getElementById('btnBuscar');
        this.btnExportar = document.getElementById('btnExportar');
        this.buscarUsuario = document.getElementById('buscarUsuario');
        this.filtroPedidos = document.getElementById('filtroPedidos');
        this.ordenarPor = document.getElementById('ordenarPor');

        // Tabla
        this.tablaUsuarios = document.getElementById('tablaUsuarios');
    }

    setupEventListeners() {
        // Eventos de búsqueda y filtros
        this.btnBuscar.addEventListener('click', () => this.filterUsuarios());
        this.buscarUsuario.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.filterUsuarios();
        });
        this.filtroPedidos.addEventListener('change', () => this.filterUsuarios());
        this.ordenarPor.addEventListener('change', () => this.filterUsuarios());

        // Evento de exportación
        this.btnExportar.addEventListener('click', () => this.exportarDatos());
    }

    async checkAdminAccess() {
        const isAdmin = await auth.checkAdminStatus();
        if (!isAdmin) {
            window.location.href = '/index.html';
        }
    }

    async loadUsuarios() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/usuarios`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar usuarios');
            
            this.usuarios = await response.json();
            this.renderUsuarios();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar usuarios', 'danger');
        }
    }

    renderUsuarios(usuarios = this.usuarios) {
        this.tablaUsuarios.innerHTML = usuarios.map(usuario => `
            <tr>
                <td>${usuario.nombre}</td>
                <td>${usuario.email}</td>
                <td>${usuario.telefono || 'No especificado'}</td>
                <td>${this.formatDate(usuario.created_at)}</td>
                <td>${usuario.total_pedidos || 0}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="usuariosManager.verDetalle(${usuario.id})">
                        <i class="bi bi-eye"></i> Ver detalle
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async verDetalle(usuarioId) {
        try {
            // Cargar datos del usuario
            const response = await fetch(`${CONFIG.API_URL}/usuarios/${usuarioId}`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar datos del usuario');
            
            const usuario = await response.json();

            // Cargar historial de pedidos
            const pedidosResponse = await fetch(`${CONFIG.API_URL}/pedidos/usuario/${usuarioId}`, {
                headers: auth.getAuthHeader()
            });
            if (!pedidosResponse.ok) throw new Error('Error al cargar historial de pedidos');
            
            const pedidos = await pedidosResponse.json();

            // Actualizar modal con datos del usuario
            document.getElementById('detalleNombre').textContent = usuario.nombre;
            document.getElementById('detalleEmail').textContent = usuario.email;
            document.getElementById('detalleTelefono').textContent = usuario.telefono || 'No especificado';
            document.getElementById('detalleFechaRegistro').textContent = this.formatDate(usuario.created_at);
            document.getElementById('detalleTotalPedidos').textContent = pedidos.length;
            document.getElementById('detalleTotalGastado').textContent = this.formatCurrency(
                pedidos.reduce((total, pedido) => total + pedido.total, 0)
            );
            document.getElementById('detalleUltimoPedido').textContent = pedidos.length > 0 
                ? this.formatDate(pedidos[0].created_at) 
                : 'Sin pedidos';

            // Renderizar historial de pedidos
            this.renderHistorialPedidos(pedidos);

            // Mostrar modal
            this.modal.show();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar detalles del usuario', 'danger');
        }
    }

    renderHistorialPedidos(pedidos) {
        const tbody = document.getElementById('historialPedidos');
        tbody.innerHTML = pedidos.map(pedido => `
            <tr>
                <td>${pedido.numero_pedido}</td>
                <td>${this.formatDate(pedido.created_at)}</td>
                <td>${this.formatCurrency(pedido.total)}</td>
                <td>
                    <span class="badge ${this.getEstadoBadgeClass(pedido.estado)}">
                        ${pedido.estado}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="usuariosManager.verPedido(${pedido.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterUsuarios() {
        const searchTerm = this.buscarUsuario.value.toLowerCase();
        const filtroPedidos = this.filtroPedidos.value;
        const ordenarPor = this.ordenarPor.value;

        let filtered = this.usuarios.filter(usuario => {
            const matchesSearch = usuario.nombre.toLowerCase().includes(searchTerm) ||
                                usuario.email.toLowerCase().includes(searchTerm);
            
            if (filtroPedidos === 'frecuentes') {
                return matchesSearch && (usuario.total_pedidos || 0) > 5;
            } else if (filtroPedidos === 'recientes') {
                const fechaRegistro = new Date(usuario.created_at);
                const unMesAtras = new Date();
                unMesAtras.setMonth(unMesAtras.getMonth() - 1);
                return matchesSearch && fechaRegistro > unMesAtras;
            }
            
            return matchesSearch;
        });

        // Ordenar resultados
        filtered.sort((a, b) => {
            switch (ordenarPor) {
                case 'nombre':
                    return a.nombre.localeCompare(b.nombre);
                case 'fecha':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'pedidos':
                    return (b.total_pedidos || 0) - (a.total_pedidos || 0);
                default:
                    return 0;
            }
        });

        this.renderUsuarios(filtered);
    }

    async exportarDatos() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/usuarios/export`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al exportar datos');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al exportar datos', 'danger');
        }
    }

    async verPedido(pedidoId) {
        // Implementar vista detallada del pedido
        console.log('Ver pedido:', pedidoId);
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount);
    }

    getEstadoBadgeClass(estado) {
        const clases = {
            'pendiente': 'bg-warning',
            'confirmado': 'bg-info',
            'en_proceso': 'bg-primary',
            'enviado': 'bg-info',
            'entregado': 'bg-success',
            'cancelado': 'bg-danger'
        };
        return clases[estado] || 'bg-secondary';
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.usuariosManager = new UsuariosManager();
}); 