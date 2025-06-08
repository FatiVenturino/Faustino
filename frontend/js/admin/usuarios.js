import { auth } from '../auth.js';
import { CONFIG } from '../config.js';
import { showAlert, formatDate } from '../utils.js';

// Verificar que el usuario sea administrador
const checkAdminAccess = async () => {
    if (!auth.isAuthenticated()) {
        showAlert('Debes iniciar sesión para acceder a esta página', 'danger');
        window.location.href = '/pages/login.html';
        return false;
    }

    const user = auth.getUser();
    if (!user || user.rol !== 'admin') {
        showAlert('No tienes permisos para acceder a esta página', 'danger');
        window.location.href = '/index.html';
        return false;
    }

    return true;
};

// Cargar usuarios
async function loadUsuarios() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const url = `${CONFIG.API_URL}/auth/admin/usuarios?rol=cliente`;
        console.log('Haciendo petición a:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Respuesta del servidor:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Datos recibidos:', data);

        if (!data.success) {
            throw new Error(data.message || 'Error al cargar usuarios');
        }

        if (!Array.isArray(data.usuarios)) {
            console.error('Formato de datos inválido:', data);
            throw new Error('Formato de respuesta inválido');
        }

        const tbody = document.getElementById('usuariosTableBody');
        if (!tbody) {
            throw new Error('No se encontró el elemento tbody');
        }

        tbody.innerHTML = '';
        
        if (data.usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No hay clientes registrados</td>
                </tr>
            `;
            return;
        }

        data.usuarios.forEach(usuario => {
            console.log('Datos del usuario en el frontend:', usuario);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${usuario.nombre || ''}</td>
                <td>${usuario.email || ''}</td>
                <td>${usuario.telefono || ''}</td>
                <td>${usuario.created_at ? formatDate(usuario.created_at) : ''}</td>
                <td>${usuario.cantidad_pedidos !== undefined && usuario.cantidad_pedidos !== null ? usuario.cantidad_pedidos : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showDetalleUsuario(${usuario.id})">
                        <i class="bi bi-eye"></i> Ver Detalle
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
        const tbody = document.getElementById('usuariosTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        Error al cargar clientes: ${error.message}
                    </td>
                </tr>
            `;
        }
        showAlert('Error al cargar clientes: ' + error.message, 'danger');
    }
}

// Mostrar modal de detalle de usuario
window.showDetalleUsuario = async (usuarioId) => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/admin/usuarios/${usuarioId}`, {
            headers: auth.getAuthHeader()
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const usuario = data.usuario;
            document.getElementById('detalleNombre').textContent = usuario.nombre || '';
            document.getElementById('detalleEmail').textContent = usuario.email || '';
            document.getElementById('detalleTelefono').textContent = usuario.telefono || '';
            document.getElementById('detalleFechaRegistro').textContent = usuario.created_at ? formatDate(usuario.created_at) : '';

            // Datos de pedidos (requieren implementación en backend)
            document.getElementById('detalleTotalPedidos').textContent = 'N/A';
            document.getElementById('detalleTotalGastado').textContent = 'N/A';
            document.getElementById('detalleUltimoPedido').textContent = 'N/A';

            // Historial de Pedidos (requiere implementación en backend)
            const historialPedidosBody = document.getElementById('historialPedidosBody');
            if (historialPedidosBody) {
                historialPedidosBody.innerHTML = `<tr><td colspan="3" class="text-center">Historial no disponible (requiere backend)</td></tr>`;
            }
            
            const modal = new bootstrap.Modal(document.getElementById('modalUsuarioDetalle'));
            modal.show();
        } else {
            showAlert(data.message || 'Error al cargar el detalle del cliente', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor para detalle de cliente', 'danger');
    }
};

// Funciones para agregar/editar (ELIMINADAS)
// window.showUsuarioModal = (usuarioId = null) => {
//     document.getElementById('modalTitle').textContent = usuarioId ? 'Editar Cliente' : 'Nuevo Cliente';
//     document.getElementById('usuarioForm').reset();
//     document.getElementById('usuarioId').value = usuarioId || '';
//     document.getElementById('password').required = !usuarioId;
//     if (usuarioId) {
//         // Cargar datos para edición si es un usuario existente
//         fetch(`${CONFIG.API_URL}/auth/admin/usuarios/${usuarioId}`, {
//             headers: auth.getAuthHeader()
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 document.getElementById('nombre').value = data.usuario.nombre;
//                 document.getElementById('email').value = data.usuario.email;
//                 document.getElementById('telefono').value = data.usuario.telefono || '';
//                 document.getElementById('activo').checked = data.usuario.activo;
//             } else {
//                 showAlert(data.message || 'Error al cargar datos para edición', 'danger');
//             }
//         })
//         .catch(error => {
//             console.error('Error:', error);
//             showAlert('Error al conectar con el servidor para edición', 'danger');
//         });
//     }
//     const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
//     modal.show();
// };

// const saveUsuario = async () => {
//     // Lógica para guardar usuario (se elimina)
// };

// Inicializar la página
const init = async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;

    // Configurar eventos
    // const btnAgregarUsuario = document.getElementById('btnAgregarUsuario');
    const btnBuscar = document.getElementById('btnBuscar');
    const searchUsuario = document.getElementById('searchUsuario');

    // if (btnAgregarUsuario) {
    //     btnAgregarUsuario.addEventListener('click', () => {
    //         showUsuarioModal(); // Llamar a la nueva función
    //     });
    // }

    if (btnBuscar) {
        btnBuscar.addEventListener('click', loadUsuarios);
    }

    if (searchUsuario) {
        searchUsuario.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadUsuarios();
            }
        });
    }

    // Cargar usuarios inicialmente
    await loadUsuarios();
};

// Ejecutar la inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

// Eliminar usuario (mantener para administración, si aplica)
window.deleteUsuario = async (usuarioId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;

    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/admin/usuarios/${usuarioId}`, {
            method: 'DELETE',
            headers: auth.getAuthHeader()
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Cliente eliminado correctamente', 'success');
            loadUsuarios();
        } else {
            showAlert(data.message || 'Error al eliminar el cliente', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Asegurarse de que las funciones estén disponibles globalmente si son llamadas desde el HTML
window.showDetalleUsuario = showDetalleUsuario;
window.deleteUsuario = deleteUsuario;

// Event Listeners (ajustar si es necesario)
document.addEventListener('DOMContentLoaded', () => {
    init(); // Llamar a la función de inicialización principal

    // Filtros (si existen, mantener los existentes)
    const searchUsuario = document.getElementById('searchUsuario');
    if (searchUsuario) searchUsuario.addEventListener('input', loadUsuarios);

    // Delegación de eventos para el botón de guardar usuario (dentro del modal)
    const usuarioModalElement = document.getElementById('usuarioModal');
    if (usuarioModalElement) {
        usuarioModalElement.addEventListener('click', (event) => {
            if (event.target.id === 'saveUsuarioBtn') {
                // saveUsuario();
            }
        });
    }
}); 