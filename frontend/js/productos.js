import { CONFIG } from './config.js';
import { formatPrice, showAlert } from './utils.js';
import { cart } from '../components/cart.js';
import { auth } from './auth.js';

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
                <img src="../assets/images/${product.imagen}" 
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
    // Construir la ruta completa de la imagen
    const imagePath = product.imagen && product.categoria_nombre ?
        `../assets/images/${product.categoria_nombre.toLowerCase()}/${product.imagen}` :
        '../assets/images/no-image.jpg';
    document.getElementById('productModalImage').src = imagePath;
    document.getElementById('productModalImage').alt = product.nombre;
    document.getElementById('productModalPrice').textContent = formatPrice(product.precio);
    document.getElementById('productModalDescription').textContent = product.descripcion;
    
    // Establecer el ID del producto en el botón "Agregar al Carrito" del modal
    const modalAddToCartButton = document.getElementById('addToCartButton');
    if (modalAddToCartButton) {
    modalAddToCartButton.dataset.productId = product.id;
    
        // Remover cualquier listener previo para evitar duplicados
        const oldListener = modalAddToCartButton.onclick; // Esto es una simplificación, idealmente se usaría removeEventListener
        if (oldListener) {
            modalAddToCartButton.removeEventListener('click', oldListener);
        }

// Agregar event listener al botón "Agregar al Carrito" dentro del modal
        modalAddToCartButton.addEventListener('click', (e) => {
    const productId = parseInt(e.target.dataset.productId);
    const quantity = parseInt(document.getElementById('quantity').value);
    const product = filteredProducts.find(p => p.id === productId);
    if (product && quantity > 0) {
        cart.add(product, quantity);
        showAlert(`${product.nombre} (x${quantity}) agregado al carrito.`, 'success');
        // Cerrar el modal después de agregar al carrito
                const productModalElement = document.getElementById('productModal');
                const bsProductModal = bootstrap.Modal.getInstance(productModalElement);
                if (bsProductModal) {
                    bsProductModal.hide();
        }
    }
});
    }
    
    // Reiniciar cantidad en el modal
    document.getElementById('quantity').value = 1;
};

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
        // Verificar si el usuario está autenticado
        if (!auth.isAuthenticated()) {
            showAlert('Debes iniciar sesión para ver los productos', 'warning');
            window.location.href = '/pages/login.html';
            return;
        }

        // Obtener todos los productos sin paginación ni filtro inicial
        const response = await fetch(`${CONFIG.API_URL}/productos`, {
            headers: auth.getAuthHeader()
        });
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al cargar productos');
        }
        
        allProducts = data.productos.map(product => {
            let imageName = null;

            switch (product.nombre) {
                case 'Albondigas de Pollo':
                    imageName = 'pollo/albondigas.webp';
                    break;
                case 'Arrollado de Pollo':
                    imageName = 'pollo/arrollado.webp';
                    break;
                case 'Suprema de Pollo':
                    imageName = 'pollo/suprema.webp';
                    break;
                case 'Medallón de Pollo':
                    imageName = 'pollo/medallon.webp';
                    break;
                case 'Medallón de Pollo con Espinaca y Queso':
                    imageName = 'pollo/espinaca.webp';
                    break;
                case 'Medallón de Pollo con Jamón y Queso':
                    imageName = 'pollo/jamon_queso.webp';
                    break;
                case 'Nuggets de Pollo':
                    imageName = 'pollo/nuggets.webp';
                    break;
                case 'Dinosaurios de Pollo':
                    imageName = 'pollo/dinosaurios.webp';
                    break;
                case 'Patitas de Pollo':
                    imageName = 'pollo/patitas.webp';
                    break;
                case 'Patitas de Pollo con Jamón y Queso':
                    imageName = 'pollo/patitas_jq.webp';
                    break;
                case 'Pechuguitas de Pollo a la Romana':
                    imageName = 'pollo/romana.webp';
                    break;
                case 'Deditos de Pollo':
                    imageName = 'pollo/deditos.webp';
                    break;
                case 'Filet de Merluza Rebozado':
                    imageName = 'pescado/rebozado.webp';
                    break;
                case 'Filet de Merluza Finas Hierbas':
                    imageName = 'pescado/hierbas.webp';
                    break;
                case 'Filet de Merluza a la Romana':
                    imageName = 'pescado/romana.webp';
                    break;
                case 'Medallón de Merluza':
                    imageName = 'pescado/medallon.webp';
                    break;
                case 'Medallón de Merluza con Espinaca y Queso':
                    imageName = 'pescado/espinaca.webp';
                    break;
                case 'Crocante de Merluza':
                    imageName = 'pescado/crocante.webp';
                    break;
                case 'Medallón de Arroz Yamani y Lentejas':
                    imageName = 'verduras/medallon_yamani.webp';
                    break;
                case 'Croquetas de papa con Jamón y Queso':
                    imageName = 'verduras/croquetas.webp';
                    break;
                case 'Medallón de Espinaca':
                    imageName = 'verduras/espinaca.webp';
                    break;
                case 'Medallón de Garbanzos':
                    imageName = 'verduras/garbanzos.webp';
                    break;
                case 'Nuggets de Brócoli':
                    imageName = 'verduras/brocoli.webp';
                    break;
                case 'Milanesas de Arroz y Vegetales':
                    imageName = 'verduras/arroz_vegetales.webp';
                    break;
                case 'Milanesa de Soja con Calabaza':
                    imageName = 'verduras/soja_calabaza.webp';
                    break;
                case 'Papas Noisette':
                    imageName = 'verduras/noisette.webp';
                    break;
                case 'Papas Carita':
                    imageName = 'verduras/carita.webp';
                    break;
                case 'Bocaditos de Espinaca':
                    imageName = 'verduras/bocadito_espinaca.webp';
                    break;
                case 'Bocaditos de Calabaza y Queso':
                    imageName = 'verduras/bocadito_calabaza.webp';
                    break;
                case 'Bastoncitos de Muzzarella':
                    imageName = 'verduras/muzzarella.webp';
                    break;
                case 'Fideos Nº 1':
                    imageName = 'pastas/fideos1.webp';
                    break;
                case 'Fideos Nº 2':
                    imageName = 'pastas/fideos2.webp';
                    break;
                case 'Fideos Nº 3':
                    imageName = 'pastas/fideos3.webp';
                    break;
                case 'Fideos Nº 4':
                    imageName = 'pastas/fideos4.webp';
                    break;
                case 'Fusiless':
                    imageName = 'pastas/fusiles.webp';
                    break;
                case 'Ñoquis':
                    imageName = 'pastas/noquis.webp';
                    break;
                case 'Fideos verdes Nº 1':
                    imageName = 'pastas/verdes1.webp';
                    break;
                case 'Fideos verdes Nº 4':
                    imageName = 'pastas/verdes4.webp';
                    break;
                case 'Fideos morrón Nº 1':
                    imageName = 'pastas/morron1.webp';
                    break;
                case 'Fideos morrón Nº 4':
                    imageName = 'pastas/morron4.webp';
                    break;
                case 'Canastita Calabresa':
                    imageName = 'canastitas/calabresa.webp';
                    break;
                case 'Canastita Humita':
                    imageName = 'canastitas/humita.webp';
                    break;
                case 'Canastita Capresse':
                    imageName = 'canastitas/capresse.webp';
                    break;
                case 'Pizza Muzzarella':
                    imageName = 'pizzas/muzzarella.webp';
                    break;
                case 'Pizza Jamón y Queso':
                    imageName = 'pizzas/jamon_queso.webp';
                    break;
                case 'Tarta de Calabacín y Queso':
                    imageName = 'tartas/calabacin_queso.webp';
                    break;
                case 'Tarta de Verdura':
                    imageName = 'tartas/verdura.webp';
                    break;
                case 'Tarta Jamón y Queso':
                    imageName = 'tartas/jamon_queso.webp';
                    break;
                case 'Rodajas de merluza':
                    imageName = 'mariscos/rodajas_merluza.webp';
                    break;
                case 'Trucha':
                    imageName = 'mariscos/trucha.webp';
                    break;
                case 'Merluza':
                    imageName = 'mariscos/merluza.webp';
                    break;
                case 'Lomitos de atún':
                    imageName = 'mariscos/atun.webp';
                    break;
                case 'Salmón':
                    imageName = 'mariscos/salmon.webp';
                    break;
                case 'Rabas':
                    imageName = 'mariscos/rabas.webp';
                    break;
                case 'Langostinos':
                    imageName = 'mariscos/langostinos.webp';
                    break;
                case 'Bandeja de mariscos':
                    imageName = 'mariscos/bandeja.webp';
                    break;
                case 'Pacú':
                    imageName = 'mariscos/pacu.webp';
                    break;
                case 'Camarones':
                    imageName = 'mariscos/camarones.webp';
                    break;
                case 'Medallón de Salmón':
                    imageName = 'mariscos/medallon_salmon.webp';
                    break;
                case 'Mejillón pelado':
                    imageName = 'mariscos/mejillon.webp';
                    break;
                case 'Vieyras':
                    imageName = 'mariscos/vieyras.webp';
                    break;
                default:
                    imageName = 'no-image.jpg'; // Imagen por defecto si no hay coincidencia
            }
            
            return { ...product, imagen: imageName };
        });
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
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', () => {
            applyFilters(document.querySelector('.btn-group[role="group"] .btn.active').dataset.category === 'all' ? null : parseInt(document.querySelector('.btn-group[role="group"] .btn.active').dataset.category), searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters(document.querySelector('.btn-group[role="group"] .btn.active').dataset.category === 'all' ? null : parseInt(document.querySelector('.btn-group[role="group"] .btn.active').dataset.category), searchInput.value);
            }
        });
    } else {
        console.warn("Elementos de búsqueda (searchButton o searchInput) no encontrados. Asegúrate de que los IDs sean correctos en el HTML.");
    }

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

    // Lógica para agregar producto al carrito desde el modal (usando delegación de eventos en el modal)
    // REMOVIDO: Ahora se maneja directamente en showProductModal

    // Event listeners para los botones de categoría se agregan dentro de loadCategories
}); 