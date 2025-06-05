import { auth } from '../auth.js';
import { CONFIG } from '../config.js';
import { formatPrice, formatDate, showAlert } from '../utils.js';

class PedidosManager {
    constructor() {
        this.pedidos = [];
        this.modal = null;
        this.pedidoActual = null;
        this.initializeElements();
        this.setupEventListeners();
        this.checkAdminAccess();
        this.loadPedidos();
        this.startAutoRefresh();
    }

    initializeElements() {
        // Modal
        this.modal = new bootstrap.Modal(document.getElementById('modalPedido'));

        // Botones y controles
        this.btnBuscar = document.getElementById('btnBuscar');
        this.btnActualizar = document.getElementById('btnActualizar');
        this.btnExportar = document.getElementById('btnExportar');
        this.buscarPedido = document.getElementById('buscarPedido');
        this.filtroEstado = document.getElementById('filtroEstado');
        this.filtroFecha = document.getElementById('filtroFecha');

        // Tabla
        this.tablaPedidos = document.getElementById('tablaPedidos');
    }

    setupEventListeners() {
        // Eventos de búsqueda y filtros
        this.btnBuscar.addEventListener('click', () => this.filterPedidos());
        this.buscarPedido.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.filterPedidos();
        });
        this.filtroEstado.addEventListener('change', () => this.filterPedidos());
        this.filtroFecha.addEventListener('change', () => this.filterPedidos());

        // Eventos de botones
        this.btnActualizar.addEventListener('click', () => this.loadPedidos());
        this.btnExportar.addEventListener('click', () => this.exportarPedidos());
    }

    async checkAdminAccess() {
        const isAdmin = await auth.checkAdminStatus();
        if (!isAdmin) {
            window.location.href = '/index.html';
        }
    }

    startAutoRefresh() {
        // Actualizar pedidos cada 30 segundos
        setInterval(() => this.loadPedidos(), 30000);
    }

    async loadPedidos() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/pedidos/admin/todos`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar pedidos');
            
            this.pedidos = await response.json();
            this.renderPedidos();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar pedidos', 'danger');
        }
    }

    renderPedidos(pedidos = this.pedidos) {
        this.tablaPedidos.innerHTML = pedidos.map(pedido => `
            <tr>
                <td>${pedido.numero_pedido}</td>
                <td>${pedido.usuario.nombre}</td>
                <td>${this.formatDate(pedido.created_at)}</td>
                <td>${this.formatCurrency(pedido.total)}</td>
                <td>
                    <span class="badge ${this.getEstadoBadgeClass(pedido.estado)}">
                        ${this.getEstadoLabel(pedido.estado)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="pedidosManager.verDetalle(${pedido.id})">
                        <i class="bi bi-eye"></i> Ver detalle
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async verDetalle(pedidoId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/pedidos/${pedidoId}`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar detalles del pedido');
            
            const pedido = await response.json();
            this.pedidoActual = pedido;

            // Actualizar información del pedido
            document.getElementById('detalleNumeroPedido').textContent = pedido.numero_pedido;
            document.getElementById('detalleFechaHora').textContent = this.formatDate(pedido.created_at);
            document.getElementById('detalleEstado').innerHTML = `
                <span class="badge ${this.getEstadoBadgeClass(pedido.estado)}">
                    ${this.getEstadoLabel(pedido.estado)}
                </span>
            `;
            document.getElementById('detalleMetodoPago').textContent = pedido.metodo_pago;

            // Actualizar información del cliente
            document.getElementById('detalleClienteNombre').textContent = pedido.usuario.nombre;
            document.getElementById('detalleClienteEmail').textContent = pedido.usuario.email;
            document.getElementById('detalleClienteTelefono').textContent = pedido.usuario.telefono || 'No especificado';

            // Renderizar productos
            this.renderProductos(pedido.detalles);

            // Actualizar total
            document.getElementById('detalleTotal').textContent = this.formatCurrency(pedido.total);

            // Mostrar modal
            this.modal.show();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar detalles del pedido', 'danger');
        }
    }

    renderProductos(detalles) {
        const tbody = document.getElementById('detalleProductos');
        tbody.innerHTML = detalles.map(detalle => `
            <tr>
                <td>${detalle.producto.nombre}</td>
                <td>${detalle.cantidad}</td>
                <td>${this.formatCurrency(detalle.precio_unitario)}</td>
                <td>${this.formatCurrency(detalle.subtotal)}</td>
            </tr>
        `).join('');
    }

    async actualizarEstado(nuevoEstado) {
        if (!this.pedidoActual) return;

        try {
            const response = await fetch(`${CONFIG.API_URL}/pedidos/${this.pedidoActual.id}/estado`, {
                method: 'PUT',
                headers: {
                    ...auth.getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) throw new Error('Error al actualizar estado');

            this.showAlert('Estado actualizado exitosamente', 'success');
            this.modal.hide();
            this.loadPedidos();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al actualizar estado', 'danger');
        }
    }

    filterPedidos() {
        const searchTerm = this.buscarPedido.value.toLowerCase();
        const estado = this.filtroEstado.value;
        const fecha = this.filtroFecha.value;

        let filtered = this.pedidos.filter(pedido => {
            const matchesSearch = 
                pedido.numero_pedido.toLowerCase().includes(searchTerm) ||
                pedido.usuario.nombre.toLowerCase().includes(searchTerm);
            
            const matchesEstado = !estado || pedido.estado === estado;
            
            const matchesFecha = !fecha || 
                new Date(pedido.created_at).toISOString().split('T')[0] === fecha;

            return matchesSearch && matchesEstado && matchesFecha;
        });

        this.renderPedidos(filtered);
    }

    async exportarPedidos() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/pedidos/export`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al exportar pedidos');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al exportar pedidos', 'danger');
        }
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
            'en_preparacion': 'bg-primary',
            'enviado': 'bg-info',
            'entregado': 'bg-success',
            'cancelado': 'bg-danger'
        };
        return clases[estado] || 'bg-secondary';
    }

    getEstadoLabel(estado) {
        const labels = {
            'pendiente': 'Pendiente',
            'confirmado': 'Confirmado',
            'en_preparacion': 'En Preparación',
            'enviado': 'Enviado',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado'
        };
        return labels[estado] || estado;
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
    window.pedidosManager = new PedidosManager();
}); 