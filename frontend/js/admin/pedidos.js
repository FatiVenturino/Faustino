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
            
            const data = await response.json();
            console.log('[DEBUG] Respuesta del servidor:', data);
            
            // Asegurarse de que pedidos sea un array
            this.pedidos = Array.isArray(data.pedidos) ? data.pedidos : [];
            console.log('[DEBUG] Pedidos después de asegurar que sea array:', this.pedidos);
            
            this.renderPedidos();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar pedidos', 'danger');
        }
    }

    renderPedidos(pedidos = this.pedidos) {
        if (!Array.isArray(pedidos)) {
            console.error('[DEBUG] pedidos no es un array:', pedidos);
            pedidos = [];
        }
        
        this.tablaPedidos.innerHTML = pedidos.map(pedido => `
            <tr>
                <td>${pedido.numero_pedido}</td>
                <td>${pedido.usuario ? pedido.usuario.nombre : (pedido.cliente_nombre || pedido.usuario_id || 'Sin nombre')}</td>
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
            console.log('[DEBUG] Intentando ver detalle del pedido con ID:', pedidoId);
            const response = await fetch(`${CONFIG.API_URL}/pedidos/${pedidoId}`, {
                headers: auth.getAuthHeader()
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('[DEBUG] Datos de detalle de pedido recibidos:', data);
            const pedido = data.pedido;
            this.pedidoActual = pedido; // Asegurar que el pedido actual se guarda para futuras acciones (ej. actualizar estado)

            // Actualizar información del pedido
            document.getElementById('detalleNumeroPedido').textContent = pedido.numero_pedido || 'N/A';
            document.getElementById('detalleFechaHora').textContent = pedido.created_at ? this.formatDate(pedido.created_at) : 'Invalid Date';
            document.getElementById('detalleEstado').innerHTML = `
                <span class="badge ${this.getEstadoBadgeClass(pedido.estado)}">
                    ${this.getEstadoLabel(pedido.estado || 'undefined')}
                </span>
            `;
            document.getElementById('detalleMetodoPago').textContent = pedido.metodo_pago || 'No especificado';

            // Actualizar información del cliente
            document.getElementById('detalleClienteNombre').textContent = pedido.usuario && pedido.usuario.nombre ? pedido.usuario.nombre : (pedido.cliente_nombre || pedido.usuario_id || 'Sin nombre');
            document.getElementById('detalleClienteEmail').textContent = pedido.usuario && pedido.usuario.email ? pedido.usuario.email : (pedido.cliente_email || '-');
            document.getElementById('detalleClienteTelefono').textContent = pedido.usuario && pedido.usuario.telefono ? (pedido.usuario.telefono || 'No especificado') : (pedido.cliente_telefono || 'No especificado');

            // Renderizar productos
            this.renderProductos(pedido.detalles);

            // Actualizar total
            document.getElementById('detalleTotal').textContent = this.formatCurrency(pedido.total || 0);

            // Mostrar modal
            this.modal.show();
        } catch (error) {
            console.error('Error al cargar detalles del pedido:', error);
            this.showAlert('Error al cargar detalles del pedido: ' + error.message, 'danger');
        }
    }

    renderProductos(detalles) {
        const tbody = document.getElementById('detalleProductos');
        if (!Array.isArray(detalles) || detalles.length === 0) {
            console.error('[DEBUG] detalles no es un array o está vacío:', detalles);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">No hay productos para mostrar.</td></tr>';
            return;
        }
        tbody.innerHTML = detalles.map(detalle => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="../../assets/images/${detalle.producto.categoria_nombre.toLowerCase()}/${detalle.producto.imagen}" 
                             alt="${detalle.producto ? detalle.producto.nombre : 'N/A'}"
                             style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;"
                             class="rounded">
                        <span>${detalle.producto && detalle.producto.nombre ? detalle.producto.nombre : 'N/A'}</span>
                    </div>
                </td>
                <td>${detalle.cantidad || 0}</td>
                <td>${this.formatCurrency(detalle.precio_unitario || 0)}</td>
                <td>${this.formatCurrency(detalle.subtotal || 0)}</td>
            </tr>
        `).join('');
    }

    async actualizarEstado(nuevoEstado) {
        if (!this.pedidoActual || !this.pedidoActual.id) {
            this.showAlert('Error: ID de pedido no disponible para actualizar', 'danger');
            console.error('Error: this.pedidoActual o this.pedidoActual.id es undefined/null', this.pedidoActual);
            return;
        }

        try {
            console.log('[DEBUG] Intentando actualizar estado para pedido ID:', this.pedidoActual.id, 'a estado:', nuevoEstado);
            const response = await fetch(`${CONFIG.API_URL}/pedidos/admin/estado/${this.pedidoActual.id}`, {
                method: 'PUT',
                headers: {
                    ...auth.getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            this.showAlert('Estado actualizado exitosamente', 'success');
            this.modal.hide();
            this.loadPedidos();
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            this.showAlert('Error al actualizar estado: ' + error.message, 'danger');
        }
    }

    filterPedidos() {
        const searchTerm = this.buscarPedido.value.toLowerCase();
        const estado = this.filtroEstado.value;
        const fecha = this.filtroFecha.value;

        let filtered = this.pedidos.filter(pedido => {
            const matchesSearch = 
                pedido.numero_pedido.toLowerCase().includes(searchTerm) ||
                (pedido.usuario && pedido.usuario.nombre.toLowerCase().includes(searchTerm)) ||
                (pedido.cliente_nombre && pedido.cliente_nombre.toLowerCase().includes(searchTerm));
            
            const matchesEstado = !estado || pedido.estado === estado;
            
            const matchesFecha = !fecha || 
                new Date(pedido.created_at).toISOString().split('T')[0] === fecha;

            return matchesSearch && matchesEstado && matchesFecha;
        });

        this.renderPedidos(filtered);
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('es-MX', options);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    getEstadoBadgeClass(estado) {
        switch (estado) {
            case 'pendiente': return 'bg-secondary';
            case 'confirmado': return 'bg-primary';
            case 'en_preparacion': return 'bg-info';
            case 'enviado': return 'bg-warning';
            case 'entregado': return 'bg-success';
            case 'cancelado': return 'bg-danger';
            default: return 'bg-light text-dark';
        }
    }

    getEstadoLabel(estado) {
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'confirmado': return 'Confirmado';
            case 'en_preparacion': return 'En preparación';
            case 'enviado': return 'Enviado';
            case 'entregado': return 'Entregado';
            case 'cancelado': return 'Cancelado';
            default: return estado;
        }
    }

    showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    }
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.pedidosManager = new PedidosManager();
}); 