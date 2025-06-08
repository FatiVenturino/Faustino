import { CONFIG } from '../config.js';
import { formatPrice, formatDate, showAlert } from '../utils.js';
import { auth } from '../auth.js';

// Verificar que el usuario sea administrador
const checkAdminAccess = async () => {
    if (!auth.isAuthenticated()) {
        showAlert('Debes iniciar sesión para acceder a esta página', 'danger');
        window.location.href = '/pages/login.html';
        return false;
    }

    try {
        const isAdmin = await auth.checkAdminStatus();
        if (!isAdmin) {
            showAlert('No tienes permisos para acceder a esta página', 'danger');
            window.location.href = '/index.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error al verificar permisos de administrador:', error);
        showAlert('Error al verificar permisos', 'danger');
        window.location.href = '/index.html';
        return false;
    }
};

// Inicializar la página
const init = async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;
    
    // Aquí puedes agregar la lógica de inicialización del dashboard
    console.log('Dashboard inicializado');
};

// Ejecutar la inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

// Cargar datos generales del dashboard
const loadDashboardData = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/dashboard`, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('totalOrders').textContent = data.totalPedidos;
            document.getElementById('totalSales').textContent = formatPrice(data.totalVentas);
            document.getElementById('totalProducts').textContent = data.totalProductos;
            document.getElementById('totalCustomers').textContent = data.totalClientes;
        } else {
            showAlert(data.message || 'Error al cargar los datos del dashboard', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Cargar pedidos recientes
const loadRecentOrders = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/pedidos/recientes`, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const recentOrders = document.getElementById('recentOrders');
            recentOrders.innerHTML = '';
            
            data.forEach(order => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${order.numero_pedido}</td>
                    <td>${order.usuario.nombre}</td>
                    <td>${formatPrice(order.total)}</td>
                    <td><span class="badge ${getStatusBadgeClass(order.estado)}">${order.estado}</span></td>
                    <td>${formatDate(order.created_at)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="updateOrderStatus(${order.id})">
                            <i class="bi bi-check-circle"></i>
                        </button>
                    </td>
                `;
                recentOrders.appendChild(tr);
            });
        } else {
            showAlert(data.message || 'Error al cargar los pedidos recientes', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Cargar productos más vendidos
const loadTopProducts = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/productos/mas-vendidos`, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const topProducts = document.getElementById('topProducts');
            topProducts.innerHTML = '';
            
            data.forEach(product => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${product.nombre}</td>
                    <td>${product.categoria.nombre}</td>
                    <td>${product.unidades_vendidas}</td>
                    <td>${formatPrice(product.total_vendido)}</td>
                `;
                topProducts.appendChild(tr);
            });
        } else {
            showAlert(data.message || 'Error al cargar los productos más vendidos', 'danger');
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
        'entregado': 'bg-secondary'
    };
    return statusClasses[status] || 'bg-secondary';
};

const viewOrder = (orderId) => {
    window.location.href = `pedidos.html?id=${orderId}`;
};

const updateOrderStatus = async (orderId) => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/pedidos/${orderId}/estado`, {
            method: 'PUT',
            headers: auth.getAuthHeader(),
            body: JSON.stringify({
                estado: 'confirmado'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Estado del pedido actualizado correctamente', 'success');
            loadRecentOrders();
        } else {
            showAlert(data.message || 'Error al actualizar el estado del pedido', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

//const showAlert = (message, type) => {
 //   const alertContainer = document.getElementById('alertContainer');
  //  alertContainer.innerHTML = `
  //      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
  //          ${message}
 //           <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
 //       </div>
 //   `;
//}; 