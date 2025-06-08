import { auth } from '../auth.js';
import { CONFIG } from '../config.js';
import { formatPrice, formatDate, showAlert, getEstadoBadgeColor, getEstadoIcon } from '../utils.js';

class HistorialPedidosManager {
    constructor() {
        this.pedidos = [];
        this.modalDetallePedido = null;
        this.currentPage = 1;
        this.limit = 10;
        this.totalPages = 1;
        this.initializeElements();
        this.setupEventListeners();
        this.checkAdminAccess();
        this.loadHistorialPedidos();
    }

    initializeElements() {
        // Filtros
        this.fechaInicio = document.getElementById('fechaInicio');
        this.fechaFin = document.getElementById('fechaFin');
        this.filtroEstado = document.getElementById('filtroEstado');
        this.idPedido = document.getElementById('idPedido');
        this.btnFiltrar = document.getElementById('btnFiltrar');

        // Tabla
        this.tablaHistorialPedidosBody = document.getElementById('tablaHistorialPedidos').querySelector('tbody');
        this.noPedidosMessage = document.getElementById('noPedidosMessage');

        // Paginación
        this.paginationContainer = document.getElementById('pagination');
        
        // Modal de Detalle
        this.modalDetallePedido = new bootstrap.Modal(document.getElementById('modalDetallePedido'));
        this.detalleIdPedido = document.getElementById('detalleIdPedido');
        this.detalleFechaHora = document.getElementById('detalleFechaHora');
        this.detalleEstado = document.getElementById('detalleEstado');
        this.detalleTotalFacturado = document.getElementById('detalleTotalFacturado');
        this.detalleMetodoPago = document.getElementById('detalleMetodoPago');
        this.detalleClienteNombre = document.getElementById('detalleClienteNombre');
        this.detalleClienteEmail = document.getElementById('detalleClienteEmail');
        this.detalleClienteTelefono = document.getElementById('detalleClienteTelefono');
        this.detalleDireccion = document.getElementById('detalleDireccion');
        this.detalleCiudad = document.getElementById('detalleCiudad');
        this.detalleCodigoPostal = document.getElementById('detalleCodigoPostal');
        this.detalleProductos = document.getElementById('detalleProductos');
    }

    setupEventListeners() {
        this.btnFiltrar.addEventListener('click', () => {
            this.currentPage = 1; // Reset page on filter
            this.loadHistorialPedidos();
        });

        // Asignar el manager a window para poder usarlo en onclick (verDetalle)
        window.historialPedidosManager = this;
    }

    async checkAdminAccess() {
        const isAdmin = await auth.checkAdminStatus();
        if (!isAdmin) {
            window.location.href = '/index.html';
        }
    }

    async loadHistorialPedidos() {
        try {
            const params = new URLSearchParams({
                fechaInicio: this.fechaInicio.value,
                fechaFin: this.fechaFin.value,
                estado: this.filtroEstado.value,
                idPedido: this.idPedido.value,
                page: this.currentPage,
                limit: this.limit
            });

            const response = await fetch(`${CONFIG.API_URL}/pedidos/admin/historial?${params.toString()}`, {
                headers: auth.getAuthHeader()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.pedidos = Array.isArray(data.pedidos) ? data.pedidos : [];
            this.totalPages = data.totalPages || 1;
            this.renderHistorialPedidos();
            this.renderPagination();

        } catch (error) {
            console.error('Error al cargar historial de pedidos:', error);
            showAlert('Error al cargar historial de pedidos: ' + error.message, 'danger');
        }
    }

    renderHistorialPedidos() {
        if (this.pedidos.length === 0) {
            this.tablaHistorialPedidosBody.innerHTML = '';
            this.noPedidosMessage.style.display = 'block';
            return;
        }

        this.noPedidosMessage.style.display = 'none';
        this.tablaHistorialPedidosBody.innerHTML = this.pedidos.map(pedido => `
            <tr>
                <td>#${pedido.id_pedido}</td>
                <td>${formatDate(pedido.fecha)}</td>
                <td>${formatPrice(pedido.total_facturado)}</td>
                <td>
                    <span class="badge bg-${getEstadoBadgeColor(pedido.estado_pedido)}">
                        ${getEstadoIcon(pedido.estado_pedido)} ${pedido.estado_pedido}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="historialPedidosManager.verDetallePedido(${pedido.id_pedido})">
                        <i class="bi bi-eye"></i> Ver detalles
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        if (!this.paginationContainer) return;

        let paginationHtml = '';
        if (this.totalPages > 1) {
            paginationHtml += `
                <nav>
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${this.currentPage - 1}">Anterior</a>
                        </li>
            `;

            for (let i = 1; i <= this.totalPages; i++) {
                paginationHtml += `
                    <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }

            paginationHtml += `
                        <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${this.currentPage + 1}">Siguiente</a>
                        </li>
                    </ul>
                </nav>
            `;
        }
        this.paginationContainer.innerHTML = paginationHtml;

        // Add event listeners for pagination buttons
        this.paginationContainer.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page > 0 && page <= this.totalPages) {
                    this.currentPage = page;
                    this.loadHistorialPedidos();
                }
            });
        });
    }

    async verDetallePedido(id) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/pedidos/admin/detalle/${id}`, {
                headers: auth.getAuthHeader()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const { pedido, detalle } = data;

            this.detalleIdPedido.textContent = `#${pedido.id_pedido}`;
            this.detalleFechaHora.textContent = formatDate(pedido.fecha);
            this.detalleEstado.textContent = ` ${getEstadoIcon(pedido.estado_pedido)} ${pedido.estado_pedido}`;
            this.detalleTotalFacturado.textContent = formatPrice(pedido.total_facturado);
            this.detalleMetodoPago.textContent = pedido.metodo_pago;
            this.detalleClienteNombre.textContent = pedido.nombre_cliente;
            this.detalleClienteEmail.textContent = pedido.email_cliente;
            this.detalleClienteTelefono.textContent = pedido.telefono_envio || 'N/A';
            this.detalleDireccion.textContent = pedido.direccion_envio;
            this.detalleCiudad.textContent = pedido.ciudad_envio;
            this.detalleCodigoPostal.textContent = pedido.codigo_postal_envio;

            this.detalleProductos.innerHTML = detalle.map(item => `
                <tr>
                    <td>${item.nombre_producto}</td>
                    <td>${item.cantidad}</td>
                    <td>${formatPrice(item.precio_unitario)}</td>
                    <td>${formatPrice(item.subtotal)}</td>
                </tr>
            `).join('');

            this.modalDetallePedido.show();

        } catch (error) {
            console.error('Error al cargar detalles del pedido:', error);
            showAlert('Error al cargar detalles del pedido: ' + error.message, 'danger');
        }
    }

    // getEstadoLabel(estado) {
    //     switch (estado) {
    //         case 'pendiente': return 'Pendiente';
    //         case 'en_preparacion': return 'En preparación';
    //         case 'enviado': return 'Enviado';
    //         case 'entregado': return 'Entregado';
    //         case 'cancelado': return 'Cancelado';
    //         default: return estado;
    //     }
    // }
}

document.addEventListener('DOMContentLoaded', () => {
    new HistorialPedidosManager();
}); 