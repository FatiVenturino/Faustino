import { CONFIG } from '../config.js';
import { showAlert } from '../utils.js';
import { auth } from '../auth.js';

let currentPage = 1;
const itemsPerPage = 10;

// Verificar si es admin
if (!auth.isAdmin()) {
    window.location.href = '../index.html';
}

// Cargar categorías
const loadCategories = async () => {
    try {
        let url = `${CONFIG.API_URL}/admin/categorias?page=${currentPage}&limit=${itemsPerPage}`;
        
        const response = await fetch(url, {
            headers: auth.getAuthHeader()
        });
        const data = await response.json();
        
        const categoriesTable = document.getElementById('categoriesTable');
        categoriesTable.innerHTML = data.categorias.map(category => `
            <tr>
                <td>${category.nombre}</td>
                <td>${category.descripcion || ''}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" 
                                onclick="editCategory(${category.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" 
                                onclick="deleteCategory(${category.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        updatePagination(data.total);
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        showAlert('Error al cargar categorías', 'danger');
    }
};

// Actualizar paginación
const updatePagination = (totalItems) => {
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
                loadCategories();
            }
        });
    });
};

// Guardar categoría
const saveCategory = async (formData) => {
    const categoryId = formData.get('id');
    const url = categoryId ? 
        `${CONFIG.API_URL}/admin/categorias/${categoryId}` :
        `${CONFIG.API_URL}/admin/categorias`;
    
    try {
        const response = await fetch(url, {
            method: categoryId ? 'PUT' : 'POST',
            headers: {
                ...auth.getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: formData.get('nombre'),
                descripcion: formData.get('descripcion')
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Categoría guardada exitosamente', 'success');
            $('#categoryModal').modal('hide');
            loadCategories();
        } else {
            showAlert(data.message || 'Error al guardar la categoría', 'danger');
        }
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Eliminar categoría
const deleteCategory = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/categorias/${id}`, {
            method: 'DELETE',
            headers: auth.getAuthHeader()
        });
        
        if (response.ok) {
            showAlert('Categoría eliminada exitosamente', 'success');
            loadCategories();
        } else {
            const data = await response.json();
            showAlert(data.message || 'Error al eliminar la categoría', 'danger');
        }
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        showAlert('Error al conectar con el servidor', 'danger');
    }
};

// Editar categoría
const editCategory = async (id) => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/admin/categorias/${id}`, {
            headers: auth.getAuthHeader()
        });
        
        const category = await response.json();
        
        // Llenar el formulario con los datos de la categoría
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.nombre;
        document.getElementById('categoryDescription').value = category.descripcion || '';
        
        // Mostrar el modal
        $('#categoryModal').modal('show');
    } catch (error) {
        console.error('Error al cargar categoría:', error);
        showAlert('Error al cargar la categoría', 'danger');
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    
    // Formulario de categoría
    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await saveCategory(formData);
    });
    
    // Botón nueva categoría
    document.getElementById('newCategoryBtn').addEventListener('click', () => {
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        $('#categoryModal').modal('show');
    });
}); 