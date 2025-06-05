import { CONFIG } from './config.js';
import { formatPrice, formatDate, showAlert } from './utils.js';
import { auth } from './auth.js';
import { cart } from './cart.js';

// Variables globales
let currentPage = 1;
const itemsPerPage = 10;
let currentOrder = null;

// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Cargar historial de pedidos
const loadOrders = async () => {
    try {
        const status = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchQuery = document.getElementById('searchInput').value;
        
        let url = `${CONFIG.API_URL}/pedidos/historial?page=${currentPage}&limit=${itemsPerPage}`;
        if (status) url += `&estado=${status}`;
        if (dateFilter) url += `&dias=${dateFilter}`;
        if (searchQuery) url += `&search=${searchQuery}`;
        
        const response = await fetch(url, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            renderOrders(data.pedidos);
            renderPagination(data.total);
        } else {
            showAlert(data.message || 'Error al cargar el historial', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Renderizar lista de pedidos
const renderOrders = (orders) => {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.numero_pedido}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>${formatPrice(order.total)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.estado)}">
                    ${order.estado}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">
                    <i class="bi bi-eye"></i> Ver Detalles
                </button>
                ${order.estado === 'entregado' ? `
                    <button class="btn btn-sm btn-success" onclick="repeatOrder(${order.id})">
                        <i class="bi bi-arrow-repeat"></i> Repetir
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
};

// Renderizar paginación
const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    let paginationHTML = '';
    
    // Botón anterior
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
        </li>
    `;
    
    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    // Botón siguiente
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // Agregar event listeners a los enlaces de paginación
    document.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage) {
                currentPage = page;
                loadOrders();
            }
        });
    });
};

// Ver detalles del pedido
const viewOrder = async (orderId) => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos/${orderId}`, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentOrder = data;
            
            // Llenar información del pedido
            document.getElementById('orderInfo').innerHTML = `
                <strong>Número de Pedido:</strong> #${data.numero_pedido}<br>
                <strong>Fecha:</strong> ${formatDate(data.created_at)}<br>
                <strong>Cliente:</strong> ${data.usuario.nombre}<br>
                <strong>Método de Pago:</strong> ${data.metodo_pago}<br>
                <strong>Dirección de Entrega:</strong> ${data.direccion}
            `;
            
            // Llenar estado del pedido
            document.getElementById('orderStatus').innerHTML = `
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${getProgressPercentage(data.estado)}%">
                    </div>
                </div>
                <div class="d-flex justify-content-between">
                    <span class="badge ${data.estado === 'pendiente' ? 'bg-warning' : 'bg-success'}">Pendiente</span>
                    <span class="badge ${data.estado === 'confirmado' ? 'bg-warning' : 'bg-success'}">Confirmado</span>
                    <span class="badge ${data.estado === 'preparacion' ? 'bg-warning' : 'bg-success'}">En Preparación</span>
                    <span class="badge ${data.estado === 'listo' ? 'bg-warning' : 'bg-success'}">Listo</span>
                    <span class="badge ${data.estado === 'entregado' ? 'bg-warning' : 'bg-success'}">Entregado</span>
                </div>
            `;
            
            // Llenar items del pedido
            document.getElementById('orderItems').innerHTML = data.items.map(item => `
                <tr>
                    <td>${item.producto.nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>${formatPrice(item.precio_unitario)}</td>
                    <td>${formatPrice(item.cantidad * item.precio_unitario)}</td>
                </tr>
            `).join('');
            
            // Llenar total
            document.getElementById('orderTotal').textContent = formatPrice(data.total);
            
            // Mostrar/ocultar botón de repetir pedido
            document.getElementById('repeatOrderBtn').style.display = 
                data.estado === 'entregado' ? 'block' : 'none';
            
            // Mostrar modal
            new bootstrap.Modal(document.getElementById('orderModal')).show();
        } else {
            showAlert(data.message || 'Error al cargar los detalles del pedido', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Repetir pedido
const repeatOrder = async (orderId) => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos/${orderId}/repetir`, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Agregar items al carrito
            data.items.forEach(item => {
                cart.add({
                    id: item.producto.id,
                    nombre: item.producto.nombre,
                    precio: item.precio_unitario,
                    cantidad: item.cantidad
                });
            });
            
            showAlert('Productos agregados al carrito', 'success');
            bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
            window.location.href = 'carrito.html';
        } else {
            showAlert(data.message || 'Error al repetir el pedido', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Descargar comprobante
const downloadReceipt = async () => {
    if (!currentOrder) return;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos/${currentOrder.id}/comprobante`, {
            headers: auth.getAuthHeader()
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobante-${currentOrder.numero_pedido}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } else {
            const data = await response.json();
            showAlert(data.message || 'Error al descargar el comprobante', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Funciones de utilidad
const getStatusBadgeClass = (status) => {
    const statusClasses = {
        'pendiente': 'bg-warning',
        'confirmado': 'bg-info',
        'preparacion': 'bg-primary',
        'listo': 'bg-success',
        'entregado': 'bg-secondary',
        'cancelado': 'bg-danger'
    };
    return statusClasses[status] || 'bg-secondary';
};

const getProgressPercentage = (status) => {
    const progressMap = {
        'pendiente': 0,
        'confirmado': 25,
        'preparacion': 50,
        'listo': 75,
        'entregado': 100
    };
    return progressMap[status] || 0;
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    
    // Filtros
    document.getElementById('statusFilter').addEventListener('change', () => {
        currentPage = 1;
        loadOrders();
    });
    
    document.getElementById('dateFilter').addEventListener('change', () => {
        currentPage = 1;
        loadOrders();
    });
    
    document.getElementById('searchBtn').addEventListener('click', () => {
        currentPage = 1;
        loadOrders();
    });
    
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            loadOrders();
        }
    });
    
    // Botones del modal
    document.getElementById('repeatOrderBtn').addEventListener('click', () => {
        if (currentOrder) {
            repeatOrder(currentOrder.id);
        }
    });
    
    document.getElementById('downloadReceiptBtn').addEventListener('click', downloadReceipt);
    
    // Botón cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
        window.location.href = 'login.html';
    });
}); 