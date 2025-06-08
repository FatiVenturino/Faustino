import { CONFIG } from '../config.js';
import { formatPrice, showAlert } from '../utils.js';
import { auth } from '../auth.js';

// Variables globales
let currentPage = 1;
const itemsPerPage = 10;
let categorias = [];

class ProductosManager {
    constructor() {
        this.productos = [];
        this.categorias = [];
        this.modal = null;
        this.form = null;
        this.initializeElements();
        this.setupEventListeners();
        this.checkAdminAccess();
        this.loadCategorias();
        this.loadProductos();
    }

    initializeElements() {
        // Modal y Form
        this.modal = new bootstrap.Modal(document.getElementById('modalProducto'));
        this.form = document.getElementById('formProducto');

        // Botones y controles
        this.btnAgregarProducto = document.getElementById('btnAgregarProducto');
        this.btnGuardarProducto = document.getElementById('btnGuardarProducto');
        this.btnBuscar = document.getElementById('btnBuscar');
        this.buscarProducto = document.getElementById('buscarProducto');
        this.filtroCategoria = document.getElementById('filtroCategoria');
        this.filtroEstado = document.getElementById('filtroEstado');

        // Tabla
        this.tablaProductos = document.getElementById('tablaProductos');
    }

    setupEventListeners() {
        // Eventos de botones
        this.btnAgregarProducto.addEventListener('click', () => this.showModal());
        this.btnGuardarProducto.addEventListener('click', () => this.saveProducto());
        this.btnBuscar.addEventListener('click', () => this.filterProductos());
        this.buscarProducto.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.filterProductos();
        });

        // Eventos de filtros
        this.filtroCategoria.addEventListener('change', () => this.filterProductos());
        this.filtroEstado.addEventListener('change', () => this.filterProductos());

        // Evento de imagen
        document.getElementById('imagen').addEventListener('change', (e) => this.handleImagePreview(e));
    }

    async checkAdminAccess() {
        const isAdmin = await auth.checkAdminStatus();
        if (!isAdmin) {
            window.location.href = '/index.html';
        }
    }

    async loadCategorias() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/categorias`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar categorías');
            const data = await response.json();
            this.categorias = Array.isArray(data.categorias) ? data.categorias : [];
            this.updateCategoriasSelect();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar categorías', 'danger');
        }
    }

    updateCategoriasSelect() {
        const categorias = Array.isArray(this.categorias) ? this.categorias : [];
        const options = categorias.map(cat => 
            `<option value="${cat.id}">${cat.nombre}</option>`
        ).join('');
        this.filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>' + options;
        document.getElementById('categoria').innerHTML = options;
    }

    async loadProductos() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/productos`, {
                headers: auth.getAuthHeader()
            });
            if (!response.ok) throw new Error('Error al cargar productos');
            const data = await response.json();
            this.productos = Array.isArray(data.productos) ? data.productos : [];
            this.renderProductos();
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error al cargar productos', 'danger');
        }
    }

    renderProductos(productos = this.productos) {
        productos = Array.isArray(productos) ? productos : [];
        this.tablaProductos.innerHTML = productos.map(producto => `
            <tr>
            <td>
                    <img src="${producto.imagen || '/images/no-image.jpg'}" 
                     alt="${producto.nombre}" 
                     class="img-thumbnail" 
                         style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>${producto.nombre}</td>
                <td>${this.getCategoriaNombre(producto.categoria_id)}</td>
                <td>$${!isNaN(Number(producto.precio)) ? Number(producto.precio).toFixed(2) : '0.00'}</td>
            <td>${producto.stock}</td>
            <td>
                <span class="badge ${producto.estado === 'activo' ? 'bg-success' : 'bg-danger'}">
                    ${producto.estado}
                </span>
            </td>
            <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="productosManager.editProducto(${producto.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="productosManager.deleteProducto(${producto.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
            </tr>
        `).join('');
    }

    getCategoriaNombre(categoriaId) {
        const categoria = this.categorias.find(cat => cat.id === categoriaId);
        return categoria ? categoria.nombre : 'Sin categoría';
    }

    filterProductos() {
        const searchTerm = this.buscarProducto.value.toLowerCase();
        const categoriaId = this.filtroCategoria.value;
        const estado = this.filtroEstado.value;

        const filtered = this.productos.filter(producto => {
            const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm);
            const matchesCategoria = !categoriaId || producto.categoria_id === parseInt(categoriaId);
            const matchesEstado = !estado || producto.estado === estado;
            return matchesSearch && matchesCategoria && matchesEstado;
        });

        this.renderProductos(filtered);
    }

    showModal(producto = null) {
        document.getElementById('modalTitle').textContent = producto ? 'Editar Producto' : 'Agregar Producto';
        document.getElementById('productoId').value = producto ? producto.id : '';
        
        if (producto) {
            document.getElementById('nombre').value = producto.nombre;
            document.getElementById('descripcion').value = producto.descripcion;
            document.getElementById('precio').value = producto.precio;
            document.getElementById('stock').value = producto.stock;
            document.getElementById('categoria').value = producto.categoria_id;
            document.getElementById('estado').value = producto.estado;

            // Mostrar imagen actual
            const previewDiv = document.getElementById('previewImagen');
            previewDiv.innerHTML = producto.imagen ? 
                `<img src="${producto.imagen}" class="img-thumbnail" style="max-height: 200px;">` : '';
        } else {
            this.form.reset();
            document.getElementById('previewImagen').innerHTML = '';
        }

        this.modal.show();
        }

    async handleImagePreview(event) {
        const file = event.target.files[0];
        if (!file) return;

        const previewDiv = document.getElementById('previewImagen');
        const reader = new FileReader();

        reader.onload = (e) => {
            previewDiv.innerHTML = `<img src="${e.target.result}" class="img-thumbnail" style="max-height: 200px;">`;
        };

        reader.readAsDataURL(file);
    }

    async saveProducto() {
        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }

        const formData = new FormData(this.form);
        const productoId = formData.get('productoId');
        const isEdit = productoId !== '';

        try {
            const url = `${CONFIG.API_URL}/productos${isEdit ? `/${productoId}` : ''}`;
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: auth.getAuthHeader(),
                body: formData
            });

            if (!response.ok) throw new Error('Error al guardar el producto');

            this.showAlert(`Producto ${isEdit ? 'actualizado' : 'creado'} exitosamente`, 'success');
            this.modal.hide();
            this.loadProductos();
    } catch (error) {
        console.error('Error:', error);
            this.showAlert('Error al guardar el producto', 'danger');
    }
    }

    async deleteProducto(id) {
        if (!confirm('¿Está seguro de eliminar este producto?')) return;

    try {
            const response = await fetch(`${CONFIG.API_URL}/productos/${id}`, {
            method: 'DELETE',
            headers: auth.getAuthHeader()
        });
        
            if (!response.ok) throw new Error('Error al eliminar el producto');

            this.showAlert('Producto eliminado exitosamente', 'success');
            this.loadProductos();
    } catch (error) {
        console.error('Error:', error);
            this.showAlert('Error al eliminar el producto', 'danger');
    }
    }

    editProducto(id) {
        const producto = this.productos.find(p => p.id === id);
        if (producto) {
            this.showModal(producto);
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.productosManager = new ProductosManager();
}); 