// Funciones de utilidad
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.pedidos-container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

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

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Función para cargar todos los pedidos
async function loadPedidos() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Por favor, inicia sesión como administrador', 'error');
            return;
        }

        const response = await fetch('http://localhost:3000/api/pedidos/admin/todos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar los pedidos');
        }

        const pedidos = await response.json();
        const pedidosContainer = document.querySelector('.pedidos-container');
        
        if (!pedidosContainer) {
            console.error('No se encontró el contenedor de pedidos');
            return;
        }

        if (pedidos.length === 0) {
            pedidosContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-inbox fs-1 text-muted"></i>
                    <h3 class="mt-3">No hay pedidos pendientes</h3>
                    <p class="text-muted">Los nuevos pedidos aparecerán aquí</p>
                </div>
            `;
            return;
        }

        pedidosContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidos.map(pedido => `
                            <tr>
                                <td>#${pedido.numero_pedido}</td>
                                <td>${pedido.usuario.nombre}</td>
                                <td>${formatDate(pedido.fecha)}</td>
                                <td>$${pedido.total.toFixed(2)}</td>
                                <td>
                                    <span class="badge bg-${getEstadoBadgeColor(pedido.estado)}">
                                        ${getEstadoIcon(pedido.estado)} ${pedido.estado.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="verDetallesPedido(${pedido.id})">
                                        Ver Detalles
                                    </button>
                                    <button class="btn btn-sm btn-success" onclick="actualizarEstado(${pedido.id})">
                                        Actualizar Estado
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Error al cargar los pedidos', 'error');
    }
}

// Función para ver detalles de un pedido
async function verDetallesPedido(pedidoId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Por favor, inicia sesión como administrador', 'error');
            return;
        }

        const response = await fetch(`http://localhost:3000/api/pedidos/admin/detalle/${pedidoId}`, {
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
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <h6>Información del Cliente</h6>
                                <p><strong>Nombre:</strong> ${pedido.usuario.nombre}</p>
                                <p><strong>Email:</strong> ${pedido.usuario.email}</p>
                                <p><strong>Teléfono:</strong> ${pedido.usuario.telefono || 'No especificado'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Información del Pedido</h6>
                                <p><strong>Fecha:</strong> ${formatDate(pedido.fecha)}</p>
                                <p><strong>Método de Pago:</strong> ${pedido.metodo_pago}</p>
                                <p><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <h6>Productos</h6>
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unitario</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${pedido.items.map(item => `
                                            <tr>
                                                <td>${item.producto.nombre}</td>
                                                <td>${item.cantidad}</td>
                                                <td>$${item.precio_unitario.toFixed(2)}</td>
                                                <td>$${(item.cantidad * item.precio_unitario).toFixed(2)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
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

// Función para actualizar el estado de un pedido
async function actualizarEstado(pedidoId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Por favor, inicia sesión como administrador', 'error');
            return;
        }

        // Crear modal para seleccionar el nuevo estado
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'actualizarEstadoModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Actualizar Estado del Pedido</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="nuevoEstado" class="form-label">Nuevo Estado</label>
                            <select class="form-select" id="nuevoEstado">
                                <option value="confirmado">✅ Confirmado</option>
                                <option value="en_preparacion">🍳 En Preparación</option>
                                <option value="listo">📦 Listo para Retirar</option>
                                <option value="entregado">🎉 Entregado</option>
                                <option value="cancelado">❌ Cancelado</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="observaciones" class="form-label">Observaciones</label>
                            <textarea class="form-control" id="observaciones" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="guardarEstado(${pedidoId})">
                            Guardar Cambios
                        </button>
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
        showAlert(error.message || 'Error al abrir el modal de actualización', 'error');
    }
}

// Función para guardar el nuevo estado
async function guardarEstado(pedidoId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('Por favor, inicia sesión como administrador', 'error');
            return;
        }

        const nuevoEstado = document.getElementById('nuevoEstado').value;
        const observaciones = document.getElementById('observaciones').value;

        const response = await fetch(`http://localhost:3000/api/pedidos/admin/estado/${pedidoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: nuevoEstado,
                observaciones: observaciones
            })
        });

        if (!response.ok) {
            throw new Error('Error al actualizar el estado del pedido');
        }

        // Cerrar el modal
        const modal = document.getElementById('actualizarEstadoModal');
        const modalInstance = bootstrap.Modal.getInstance(modal);
        modalInstance.hide();

        // Recargar la lista de pedidos
        loadPedidos();
        showAlert('Estado actualizado correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Error al actualizar el estado', 'error');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', loadPedidos); 