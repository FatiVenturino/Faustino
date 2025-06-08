import { CONFIG } from './config.js';
import { formatPrice, formatDate } from './utils.js';
import { auth } from './auth.js';

// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Función para mostrar alertas
// function showAlert(message, type = 'info') {
//     const alertDiv = document.createElement('div');
//     alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
//     alertDiv.role = 'alert';
//     alertDiv.innerHTML = `
//         ${message}
//         <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
//     `;
    
//     const container = document.querySelector('.pedidos-container');
//     if (container) {
//         container.insertBefore(alertDiv, container.firstChild);
//     }
    
//     setTimeout(() => {
//         alertDiv.remove();
//     }, 5000);
// }

// Función para obtener el color del badge según el estado
function getEstadoBadgeColor(estado) {
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

function getEstadoIcon(estado) {
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

// Función para cargar los pedidos del usuario
async function loadPedidos() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAlert('Debes iniciar sesión para ver tus pedidos', 'warning');
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos/usuario`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los pedidos');
        }

        const data = await response.json();
        
        // Asegurarnos de que pedidos sea un array
        const pedidos = Array.isArray(data) ? data : (data.pedidos || []);
        
        const pedidosContainer = document.querySelector('.pedidos-container');
        if (!pedidosContainer) {
            throw new Error('No se encontró el contenedor de pedidos');
        }

        if (pedidos.length === 0) {
            pedidosContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h3 class="mt-3">No tienes pedidos</h3>
                    <p class="text-muted">Cuando realices un pedido, aparecerá aquí.</p>
                    <a href="productos.html" class="btn btn-primary mt-3">Ver Productos</a>
                </div>
            `;
            return;
        }

        pedidosContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Número de Pedido</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Método de Pago</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidos.map(pedido => {
                            // Asegurarnos de que todos los campos necesarios estén presentes
                            const pedidoId = pedido.id || 'N/A';
                            const fecha = pedido.fecha || pedido.created_at || new Date().toISOString();
                            const total = parseFloat(pedido.total) || 0;
                            const estado = pedido.estado || 'Pendiente';
                            const metodoPago = pedido.metodo_pago || 'No especificado';

                            return `
                                <tr>
                                    <td>#${pedidoId}</td>
                                    <td>${formatDate(fecha)}</td>
                                    <td>$${total.toFixed(2)}</td>
                                    <td>
                                        <span class="badge bg-${getEstadoBadgeColor(estado)}">
                                            ${getEstadoIcon(estado)} ${estado}
                                        </span>
                                    </td>
                                    <td>${metodoPago}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="verDetallesPedido(${pedidoId})">
                                            <i class="bi bi-eye"></i> Ver Detalles
                                        </button>
                                        ${estado === 'Entregado' ? `
                                            <button class="btn btn-sm btn-success" onclick="repetirPedido(${pedidoId})">
                                                <i class="bi bi-arrow-repeat"></i> Repetir Pedido
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        showAlert(error.message, 'danger');
        const pedidosContainer = document.querySelector('.pedidos-container');
        if (pedidosContainer) {
            pedidosContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i> ${error.message}
                </div>
            `;
        }
    }
}

// Función para ver detalles de un pedido
async function verDetallesPedido(pedidoId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Por favor, inicia sesión para ver los detalles', 'error');
            return;
        }

        const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los detalles del pedido');
        }

        const pedido = await response.json();
        
        // Crear modal con los detalles
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'detallesPedidoModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles del Pedido #${pedido.numero_pedido}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-4">
                            <h6>Estado del Pedido</h6>
                            <div class="progress mb-3">
                                ${['confirmado', 'en_preparacion', 'listo', 'entregado'].map((estado, index) => `
                                    <div class="progress-bar bg-${getEstadoBadgeColor(estado)}" 
                                         role="progressbar" 
                                         style="width: 25%"
                                         aria-valuenow="${pedido.estado === estado ? 100 : 0}"
                                         aria-valuemin="0" 
                                         aria-valuemax="100">
                                        ${getEstadoIcon(estado)} ${estado.replace('_', ' ')}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <h6>Información del Pedido</h6>
                                <p><strong>Fecha:</strong> ${formatDate(pedido.fecha)}</p>
                                <p><strong>Método de Pago:</strong> ${pedido.metodo_pago}</p>
                                <p><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Productos</h6>
                                <ul class="list-group">
                                    ${pedido.items.map(item => `
                                        <li class="list-group-item d-flex justify-content-between align-items-center">
                                            ${item.producto.nombre}
                                            <span class="badge bg-primary rounded-pill">
                                                ${item.cantidad} x $${item.precio_unitario}
                                            </span>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        ${pedido.observaciones ? `
                            <div class="alert alert-info">
                                <strong>Observaciones:</strong> ${pedido.observaciones}
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Error al cargar los detalles', 'error');
    }
}

// Función para repetir un pedido
async function repetirPedido(pedidoId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Por favor, inicia sesión para repetir el pedido', 'error');
            return;
        }

        const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los detalles del pedido');
        }

        const pedido = await response.json();
        
        // Agregar productos al carrito
        const items = pedido.items.map(item => ({
            id: item.producto.id,
            nombre: item.producto.nombre,
            precio: item.precio_unitario,
            cantidad: item.cantidad,
            imagen: item.producto.imagen
        }));

        localStorage.setItem('carrito', JSON.stringify(items));
        showAlert('Productos agregados al carrito', 'success');
        
        // Redirigir al carrito
        window.location.href = '/pages/carrito.html';
    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Error al repetir el pedido', 'error');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', loadPedidos); 