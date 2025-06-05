import { CONFIG } from './config.js';
import { formatPrice, formatDate } from './utils.js';
import { auth } from './auth.js';

// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Cargar pedidos del usuario
const loadPedidos = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos/mis-pedidos`, {
            headers: auth.getAuthHeader()
        });

        const data = await response.json();

        if (response.ok) {
            renderPedidos(data.pedidos);
        } else {
            console.error('Error al cargar pedidos:', data);
            showAlert(data.message || 'Error al cargar pedidos', 'danger');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Renderizar pedidos en la tabla
const renderPedidos = (pedidos) => {
    const tableBody = document.getElementById('pedidosTableBody');
    const emptyState = document.getElementById('emptyPedidos');

    if (pedidos.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tableBody.innerHTML = pedidos.map(pedido => `
        <tr>
            <td>${pedido.numero_pedido}</td>
            <td>${formatDate(pedido.created_at)}</td>
            <td>${formatPrice(pedido.total)}</td>
            <td>
                <span class="badge ${getEstadoBadgeClass(pedido.estado)}">
                    ${formatEstado(pedido.estado)}
                </span>
            </td>
            <td>${formatMetodoPago(pedido.metodo_pago)}</td>
            <td>${pedido.productos}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary ver-detalle-btn" 
                        data-pedido-id="${pedido.id}">
                    <i class="bi bi-eye"></i> Ver Detalle
                </button>
            </td>
        </tr>
    `).join('');

    // Agregar event listeners a los botones de ver detalle
    document.querySelectorAll('.ver-detalle-btn').forEach(button => {
        button.addEventListener('click', () => {
            const pedidoId = button.dataset.pedidoId;
            showPedidoDetalle(pedidoId);
        });
    });
};

// Mostrar detalle del pedido en el modal
const showPedidoDetalle = async (pedidoId) => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos/${pedidoId}`, {
            headers: auth.getAuthHeader()
        });

        const data = await response.json();

        if (response.ok) {
            const pedido = data.pedido;
            
            // Llenar información básica
            document.getElementById('modalNumeroPedido').textContent = pedido.numero_pedido;
            document.getElementById('modalFecha').textContent = formatDate(pedido.created_at);
            document.getElementById('modalEstado').textContent = formatEstado(pedido.estado);
            document.getElementById('modalTotal').textContent = formatPrice(pedido.total);
            document.getElementById('modalDireccion').textContent = pedido.direccion_entrega;
            document.getElementById('modalMetodoPago').textContent = formatMetodoPago(pedido.metodo_pago);
            document.getElementById('modalNotas').textContent = pedido.notas || 'Sin notas';

            // Llenar tabla de detalles
            const detallesBody = document.getElementById('modalDetallesTableBody');
            detallesBody.innerHTML = pedido.detalles.map(detalle => `
                <tr>
                    <td>${detalle.producto_nombre}</td>
                    <td>${detalle.cantidad}</td>
                    <td>${formatPrice(detalle.precio_unitario)}</td>
                    <td>${formatPrice(detalle.subtotal)}</td>
                </tr>
            `).join('');

            // Mostrar el modal
            const modal = new bootstrap.Modal(document.getElementById('pedidoDetalleModal'));
            modal.show();
        } else {
            console.error('Error al cargar detalle del pedido:', data);
            showAlert(data.message || 'Error al cargar detalle del pedido', 'danger');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Funciones auxiliares
const getEstadoBadgeClass = (estado) => {
    const classes = {
        'pendiente': 'bg-warning',
        'confirmado': 'bg-info',
        'en_preparacion': 'bg-primary',
        'enviado': 'bg-info',
        'entregado': 'bg-success',
        'cancelado': 'bg-danger'
    };
    return classes[estado] || 'bg-secondary';
};

const formatEstado = (estado) => {
    const estados = {
        'pendiente': 'Pendiente',
        'confirmado': 'Confirmado',
        'en_preparacion': 'En Preparación',
        'enviado': 'Enviado',
        'entregado': 'Entregado',
        'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
};

const formatMetodoPago = (metodo) => {
    const metodos = {
        'efectivo': 'Efectivo',
        'tarjeta': 'Tarjeta de Crédito/Débito'
    };
    return metodos[metodo] || metodo;
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadPedidos();
}); 