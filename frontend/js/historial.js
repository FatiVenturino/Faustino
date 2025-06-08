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
        
        let url = `${CONFIG.API_URL}/pedidos/admin/historial?page=${currentPage}&limit=${itemsPerPage}`;
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
            <td>#${order.id_pedido}</td>
            <td>${formatDate(order.fecha)}</td>
            <td>${formatPrice(order.total_facturado)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.estado_pedido)}">
                    ${order.estado_pedido}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id_pedido})">
                    <i class="bi bi-eye"></i> Ver Detalles
                </button>
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
                <strong>Número de Pedido:</strong> #${data.pedido.id_pedido}<br>
                <strong>Fecha:</strong> ${formatDate(data.pedido.fecha)}<br>
                <strong>Cliente:</strong> ${data.pedido.nombre_cliente}<br>
                <strong>Método de Pago:</strong> ${data.pedido.metodo_pago}<br>
            `;
            
            // Llenar estado del pedido
            document.getElementById('orderStatus').innerHTML = `
                <div class="progress mb-2">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${getProgressPercentage(data.pedido.estado_pedido)}%">
                    </div>
                </div>
                <div class="d-flex justify-content-between">
                    <span class="badge ${data.pedido.estado_pedido === 'pendiente' ? 'bg-warning' : 'bg-success'}">Pendiente</span>
                    <span class="badge ${data.pedido.estado_pedido === 'confirmado' ? 'bg-warning' : 'bg-success'}">Confirmado</span>
                    <span class="badge ${data.pedido.estado_pedido === 'preparacion' ? 'bg-warning' : 'bg-success'}">En Preparación</span>
                    <span class="badge ${data.pedido.estado_pedido === 'listo' ? 'bg-warning' : 'bg-success'}">Listo</span>
                    <span class="badge ${data.pedido.estado_pedido === 'entregado' ? 'bg-warning' : 'bg-success'}">Entregado</span>
                </div>
            `;
            
            // Llenar items del pedido
            document.getElementById('orderItems').innerHTML = data.detalle.map(item => {
                console.log('Producto: ', item.nombre_producto, ', Imagen: ', item.producto_imagen);
                return `
                <tr>
                    <td>
                        <img src="../assets/images/${item.producto_imagen}" alt="${item.nombre_producto}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;">
                        ${item.nombre_producto}
                    </td>
                    <td>${item.cantidad}</td>
                    <td>${formatPrice(item.precio_unitario)}</td>
                    <td>${formatPrice(item.cantidad * item.precio_unitario)}</td>
                </tr>
            `;
            }).join('');
            
            // Llenar total
            document.getElementById('orderTotal').textContent = formatPrice(data.pedido.total_facturado);
            
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

// Descargar comprobante
const downloadReceipt = async () => {
    if (!currentOrder) return;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos/${currentOrder.pedido.id_pedido}/comprobante`, {
            headers: auth.getAuthHeader()
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `comprobante-${currentOrder.pedido.id_pedido}.pdf`;
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
    // Verificar que los elementos existan antes de agregar listeners
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Cargar pedidos inicialmente
    loadOrders();
    
    // Agregar listeners solo si los elementos existen
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            loadOrders();
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            currentPage = 1;
            loadOrders();
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentPage = 1;
            loadOrders();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentPage = 1;
                loadOrders();
            }
        });
    }
    
    if (downloadReceiptBtn) {
        downloadReceiptBtn.addEventListener('click', downloadReceipt);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
            window.location.href = 'login.html';
        });
    }
}); 