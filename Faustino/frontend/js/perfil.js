import { CONFIG } from './config.js';
import { showAlert } from './utils.js';
import { auth } from './auth.js';

// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Cargar datos del perfil
const loadProfile = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Mostrar datos del usuario
            document.getElementById('nombre').value = data.user.nombre;
            document.getElementById('email').value = data.user.email;
            document.getElementById('telefono').value = data.user.telefono || '';
            
            // Deshabilitar campos para solo lectura
            document.getElementById('nombre').disabled = true;
            document.getElementById('email').disabled = true;
            document.getElementById('telefono').disabled = true;
            
            // Ocultar botón de guardar
            document.getElementById('saveProfileBtn').style.display = 'none';
        } else {
            showAlert(data.message || 'Error al cargar el perfil', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Guardar cambios del perfil
const saveProfile = async (e) => {
    e.preventDefault();
    
    const profileData = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        preferencias: {
            email: document.getElementById('prefEmail').checked,
            whatsapp: document.getElementById('prefWhatsapp').checked
        }
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/usuarios/perfil`, {
            method: 'PUT',
            headers: {
                ...auth.getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Perfil actualizado correctamente', 'success');
            // Actualizar nombre en la navbar
            document.getElementById('userName').textContent = profileData.nombre;
        } else {
            showAlert(data.message || 'Error al actualizar el perfil', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Cambiar contraseña
const changePassword = async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/change-password`, {
            method: 'PUT',
            headers: {
                ...auth.getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Contraseña actualizada correctamente', 'success');
            e.target.reset();
        } else {
            showAlert(data.message || 'Error al cambiar la contraseña', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Cargar direcciones
const loadAddresses = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/usuarios/direcciones`, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const addressesList = document.getElementById('addressesList');
            addressesList.innerHTML = data.map(address => `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${address.nombre}</h5>
                            <p class="card-text">
                                ${address.calle}<br>
                                ${address.ciudad}, ${address.provincia}<br>
                                ${address.codigo_postal}
                            </p>
                            ${address.notas ? `<p class="card-text"><small class="text-muted">${address.notas}</small></p>` : ''}
                            <div class="btn-group">
                                <button class="btn btn-sm btn-primary" onclick="editAddress(${address.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteAddress(${address.id})">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            showAlert(data.message || 'Error al cargar las direcciones', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Guardar dirección
const saveAddress = async () => {
    const form = document.getElementById('addressForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const addressData = {
        nombre: document.getElementById('addressName').value,
        calle: document.getElementById('addressStreet').value,
        ciudad: document.getElementById('addressCity').value,
        provincia: document.getElementById('addressState').value,
        codigo_postal: document.getElementById('addressZip').value,
        notas: document.getElementById('addressNotes').value
    };
    
    const addressId = document.getElementById('addressId').value;
    const method = addressId ? 'PUT' : 'POST';
    const url = addressId ? 
        `${CONFIG.API_URL}/usuarios/direcciones/${addressId}` :
        `${CONFIG.API_URL}/usuarios/direcciones`;
    
    try {
        const response = await fetch(url, {
            method,
            headers: {
                ...auth.getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(addressData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Dirección guardada correctamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addressModal')).hide();
            form.reset();
            loadAddresses();
        } else {
            showAlert(data.message || 'Error al guardar la dirección', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Editar dirección
const editAddress = async (id) => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/usuarios/direcciones/${id}`, {
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('addressId').value = data.id;
            document.getElementById('addressName').value = data.nombre;
            document.getElementById('addressStreet').value = data.calle;
            document.getElementById('addressCity').value = data.ciudad;
            document.getElementById('addressState').value = data.provincia;
            document.getElementById('addressZip').value = data.codigo_postal;
            document.getElementById('addressNotes').value = data.notas || '';
            
            document.querySelector('#addressModal .modal-title').textContent = 'Editar Dirección';
            new bootstrap.Modal(document.getElementById('addressModal')).show();
        } else {
            showAlert(data.message || 'Error al cargar la dirección', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Eliminar dirección
const deleteAddress = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/usuarios/direcciones/${id}`, {
            method: 'DELETE',
            headers: auth.getAuthHeader()
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Dirección eliminada correctamente', 'success');
            loadAddresses();
        } else {
            showAlert(data.message || 'Error al eliminar la dirección', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    
    // Formulario de perfil
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    
    // Formulario de contraseña
    document.getElementById('passwordForm').addEventListener('submit', changePassword);
    
    // Botón guardar dirección
    document.getElementById('saveAddressBtn').addEventListener('click', saveAddress);
    
    // Botón cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        auth.logout();
        window.location.href = 'login.html';
    });
    
    // Limpiar formulario de dirección al abrir modal
    document.getElementById('addressModal').addEventListener('show.bs.modal', () => {
        if (!document.getElementById('addressId').value) {
            document.getElementById('addressForm').reset();
            document.querySelector('#addressModal .modal-title').textContent = 'Nueva Dirección';
        }
    });
}); 