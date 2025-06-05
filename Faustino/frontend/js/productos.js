import { CONFIG } from './config.js';
import { formatPrice, showAlert } from './utils.js';
import { cart } from '../components/cart.js';

let currentPage = 1;
const itemsPerPage = 12;
let allProducts = []; // Para almacenar todos los productos cargados
let filteredProducts = []; // Para almacenar los productos después de aplicar filtros/búsqueda

// Función para renderizar productos en la cuadrícula
const renderProducts = (productsToRender) => {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = productsToRender.map(product => `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="card h-100 product-card">
                <img src="${product.imagen || '../img/no-image.jpg'}" 
                     class="card-img-top" 
                     alt="${product.nombre}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.nombre}</h5>
                    <p class="card-text flex-grow-1">${product.descripcion.substring(0, 100)}...</p> <!-- Mostrar descripción corta -->
                    <p class="card-text"><strong>${formatPrice(product.precio)}</strong></p>
                    <div class="mt-auto">
                        <button class="btn btn-primary add-to-cart-btn" data-product-id="${product.id}">
                            Agregar al carrito
                        </button>
                        <button class="btn btn-secondary view-details-btn" data-product-id="${product.id}" data-bs-toggle="modal" data-bs-target="#productModal">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Agregar event listeners a los botones de "Agregar al carrito" y "Ver Detalles"
    attachProductEventListeners();
};

// Función para adjuntar event listeners a los botones de productos
const attachProductEventListeners = () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.productId);
            // Buscar el producto en el array de productos filtrados
            const product = filteredProducts.find(p => p.id === productId);
            if (product) {
                cart.add(product);
                showAlert(`${product.nombre} agregado al carrito.`, 'success');
            }
        });
    });

    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.productId);
            // Buscar el producto en el array de productos filtrados
            const product = filteredProducts.find(p => p.id === productId);
            if (product) {
                showProductModal(product);
            }
        });
    });
};

// Mostrar modal de detalle de producto
const showProductModal = (product) => {
    document.getElementById('productModalTitle').textContent = product.nombre;
    document.getElementById('productModalImage').src = product.imagen || '../img/no-image.jpg';
    document.getElementById('productModalImage').alt = product.nombre;
    document.getElementById('productModalPrice').textContent = formatPrice(product.precio);
    document.getElementById('productModalDescription').textContent = product.descripcion;
    
    // Establecer el ID del producto en el botón "Agregar al Carrito" del modal
    const modalAddToCartButton = document.getElementById('addToCartButton');
    modalAddToCartButton.dataset.productId = product.id;
    
    // Reiniciar cantidad en el modal
    document.getElementById('quantity').value = 1;
};

// Agregar event listener al botón "Agregar al Carrito" dentro del modal
document.getElementById('addToCartButton').addEventListener('click', (e) => {
    const productId = parseInt(e.target.dataset.productId);
    const quantity = parseInt(document.getElementById('quantity').value);
    // Buscar el producto en el array de productos filtrados
    const product = filteredProducts.find(p => p.id === productId);
    if (product && quantity > 0) {
        cart.add(product, quantity);
        showAlert(`${product.nombre} (x${quantity}) agregado al carrito.`, 'success');
        // Cerrar el modal después de agregar al carrito
        const productModal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        if (productModal) {
            productModal.hide();
        }
    }
});

// Cargar categorías
const loadCategories = async () => {
    try {
        const response = await fetch(`${CONFIG.API_URL}/categorias`);
        const data = await response.json();
        
        const categoryButtonGroup = document.querySelector('.btn-group[role="group"]');
        let categoriesHTML = `
            <button
              type="button"
              class="btn btn-outline-primary active"
              data-category="all"
            >
              Todos
            </button>
        `;

        // Asegurarse de que las categorías recibidas coincidan con las esperadas si es posible
        // o actualizar los botones dinámicamente
        data.categorias.forEach(category => {
            categoriesHTML += `
                <button
                  type="button"
                  class="btn btn-outline-primary" 
                  data-category="${category.id}"
                >
                  ${category.nombre}
                </button>
            `;
        });
        
        // Si tienes botones estáticos en el HTML que quieres mantener, puedes comentar la línea anterior y solo agregar event listeners
        // Por ahora, vamos a reemplazar los botones dinámicamente
         categoryButtonGroup.innerHTML = categoriesHTML;

        // Agregar event listeners a los botones de categoría
        document.querySelectorAll('.btn-group[role="group"] .btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                // Remover clase 'active' de todos los botones
                document.querySelectorAll('.btn-group[role="group"] .btn').forEach(btn => btn.classList.remove('active'));
                // Agregar clase 'active' al botón clickeado
                e.target.classList.add('active');

                const selectedCategory = e.target.dataset.category === 'all' ? null : parseInt(e.target.dataset.category);
                applyFilters(selectedCategory, document.getElementById('searchInput').value);
            });
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
};

// Cargar todos los productos inicialmente
const loadAllProducts = async () => {
    try {
        // Obtener todos los productos sin paginación ni filtro inicial
        // Asegúrate de que tu API tiene un endpoint que permita obtener todos los productos sin paginación si es necesario,
        // o aumenta el límite a un número muy alto.
        const response = await fetch(`${CONFIG.API_URL}/productos`); // Asumiendo que sin limit/page trae todos
        const data = await response.json();
        
        allProducts = data.productos; // Almacenar todos los productos
        applyFilters(null, ''); // Aplicar filtros iniciales (mostrar todos)

    } catch (error) {
        console.error('Error al cargar todos los productos:', error);
        showAlert('Error al cargar productos.', 'danger');
    }
};

// Aplicar filtros y actualizar la vista
const applyFilters = (category, searchTerm) => {
    let tempProducts = allProducts;

    // Filtrar por categoría
    if (category !== null) {
        tempProducts = tempProducts.filter(product => product.categoria_id === category);
    }

    // Filtrar por término de búsqueda (nombre o descripción)
    if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        tempProducts = tempProducts.filter(product => 
            product.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
            product.descripcion.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }

    filteredProducts = tempProducts; // Guardar los productos filtrados
    currentPage = 1; // Resetear a la primera página con nuevos filtros
    updatePagination(filteredProducts.length); // Actualizar paginación con el total filtrado
    renderCurrentPage(); // Renderizar la primera página del resultado filtrado
};

// Renderizar solo los productos de la página actual
const renderCurrentPage = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const productsToRender = filteredProducts.slice(startIndex, endIndex);
    renderProducts(productsToRender);
};

// Actualizar paginación (para ambos contenedores) - Refactorizado para usar delegación
const updatePagination = (totalFilteredItems) => {
    const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
    const paginationTop = document.getElementById('pagination-top');
    const paginationBottom = document.getElementById('pagination-bottom');

    const paginationElements = [paginationTop, paginationBottom];

    paginationElements.forEach(pagination => {
        pagination.innerHTML = ''; // Limpiar paginación existente

        if (totalPages <= 1) {
            return; // No mostrar paginación si solo hay una página
        }
        
        let paginationHTML = '';
        
        // Botón anterior
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}">Anterior</a>
            </li>
        `;
        
        // Números de página
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

         if (endPage < totalPages) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        
        // Botón siguiente
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}">Siguiente</a>
            </li>
        `;
        
        pagination.innerHTML = paginationHTML;
        
        // La lógica de event listeners para paginación ahora usa delegación en la inicialización
        // No necesitamos adjuntar listeners aquí después de renderizar.
    });
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadAllProducts(); // Cargar todos los productos al inicio
    cart.updateUI(); // Actualizar el contador del carrito en el navbar al cargar la página

    // Implementar búsqueda
    document.getElementById('searchButton').addEventListener('click', () => {
        applyFilters(document.querySelector('.btn-group[role="group"] .btn.active').dataset.category === 'all' ? null : parseInt(document.querySelector('.btn-group[role="group"] .btn.active').dataset.category), document.getElementById('searchInput').value);
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
             applyFilters(document.querySelector('.btn-group[role="group"] .btn.active').dataset.category === 'all' ? null : parseInt(document.querySelector('.btn-group[role="group"] .btn.active').dataset.category), document.getElementById('searchInput').value);
        }
    });

    // Implementar delegación de eventos para los enlaces de paginación
    const paginationTop = document.getElementById('pagination-top');
    const paginationBottom = document.getElementById('pagination-bottom');

    [paginationTop, paginationBottom].forEach(pagination => {
        pagination.addEventListener('click', (e) => {
            // Verificar si el elemento clickeado es un enlace de paginación
            const target = e.target.closest('.page-link');
            if (target) {
                // Verificar si el elemento padre (li) está deshabilitado
                if (target.parentElement.classList.contains('disabled')) {
                    e.preventDefault(); // Prevenir la acción por defecto si está deshabilitado
                    return; // Salir de la función
                }

                e.preventDefault();
                const page = parseInt(target.dataset.page);
                const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

                if (!isNaN(page) && page >= 1 && page <= totalPages && page !== currentPage) {
                    currentPage = page;
                    renderCurrentPage(); // Renderizar solo la página actual
                     // Eliminar el scroll automático
                    // document.getElementById('productsGrid').scrollIntoView({ behavior: 'smooth' });

                    // **Actualizar la paginación después de cambiar de página para recalcular deshabilitado/activo**
                    updatePagination(filteredProducts.length);

                    // La lógica de actualizar el estado activo ya está dentro de updatePagination
                    // document.querySelectorAll('#pagination-top .page-item, #pagination-bottom .page-item').forEach(item => {
                    //      item.classList.remove('active');
                    // });
                    // document.querySelectorAll(`[data-page="${currentPage}"]`).forEach(link => {
                    //     link.closest('.page-item').classList.add('active');
                    // });
                }
            }
        });
    });

    // Lógica para agregar producto al carrito
    document.getElementById('productsContainer').addEventListener('click', (event) => {
        if (event.target.classList.contains('add-to-cart-btn')) {
            const productId = parseInt(event.target.dataset.productId);
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                cart.add(product, 1);
                showAlert(`${product.nombre} agregado al carrito.`, 'success'); // Mostrar toast
            }
        }
    });

    // Event listeners para los botones de categoría se agregan dentro de loadCategories
}); 