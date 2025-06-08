import { CONFIG } from './config.js';
import { formatPrice, showAlert } from './utils.js';
import { auth } from './auth.js';
import { cart } from '../components/cart.js';

// Verificar autenticación
if (!auth.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Función para cargar y renderizar los items del carrito
const loadAndRenderCartItems = () => {
    const items = cart.getItems();
    const cartItemsContainer = document.getElementById('cartItems');
    const emptyCartMessage = document.getElementById('emptyCart');
    const checkoutButton = document.getElementById('checkoutButton');
    
    if (items.length === 0) {
        cartItemsContainer.innerHTML = ''; // Limpiar items
        cartItemsContainer.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        checkoutButton.disabled = true;
    } else {
        cartItemsContainer.style.display = 'block';
        emptyCartMessage.style.display = 'none';
        checkoutButton.disabled = false;
        
        // Renderizar los items
        cartItemsContainer.innerHTML = items.map(item => `
            <div class="card mb-3">
                <div class="row g-0">
                    <div class="col-md-3">
                        <img src="${item.categoria ? `../assets/images/${item.categoria.toLowerCase()}/${item.imagen}` : `../assets/images/${item.imagen}`}" 
                             class="img-fluid rounded-start" 
                             alt="${item.nombre}"
                             style="height: 150px; object-fit: cover;">
                    </div>
                    <div class="col-md-9">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <h5 class="card-title">${item.nombre}</h5>
                                <button type="button" class="btn-close remove-item-btn" aria-label="Close" data-product-id="${item.id}"></button>
                            </div>
                            <p class="card-text mb-1">Precio unitario: <strong>${formatPrice(item.precio)}</strong></p>
                            <div class="d-flex align-items-center">
                                <label for="quantity-${item.id}" class="form-label me-2 mb-0">Cantidad:</label>
                                <input type="number" 
                                       class="form-control quantity-input" 
                                       id="quantity-${item.id}" 
                                       value="${item.quantity}" 
                                       min="1" 
                                       style="width: 80px;" 
                                       data-product-id="${item.id}">
                            </div>
                            <p class="card-text mt-2"><strong class="item-subtotal">Subtotal: ${formatPrice(item.precio * item.quantity)}</strong></p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // La actualización del resumen ahora se llama dentro de loadAndRenderCartItems
        updateOrderSummary();

        // Re-adjuntar event listeners a los nuevos elementos renderizados
        attachItemEventListeners();
    }
};

// Función para adjuntar event listeners a los items del carrito
const attachItemEventListeners = () => {
    const cartItemsContainer = document.getElementById('cartItems');

    // Listener para actualizar la cantidad de un producto (delegación)
    cartItemsContainer.removeEventListener('change', handleQuantityChange); // Remover listener anterior si existe
    cartItemsContainer.addEventListener('change', handleQuantityChange); // Agregar nuevo listener

    // Listener para eliminar un item del carrito (delegación)
    cartItemsContainer.removeEventListener('click', handleRemoveItemClick); // Remover listener anterior si existe
    cartItemsContainer.addEventListener('click', handleRemoveItemClick); // Agregar nuevo listener
};

// Handler para cambio de cantidad
const handleQuantityChange = (e) => {
    if (e.target.classList.contains('quantity-input')) {
        const productId = parseInt(e.target.dataset.productId);
        const newQuantity = parseInt(e.target.value);
        if (!isNaN(newQuantity) && newQuantity > 0) {
             const items = cart.getItems();
             const itemIndex = items.findIndex(item => item.id === productId);
             if(itemIndex > -1) {
                 items[itemIndex].quantity = newQuantity;
                 cart.saveItems(items); // Esto ya actualiza localStorage y el contador del navbar
                 
                 // Re-renderizar el carrito completo y actualizar el resumen
                 loadAndRenderCartItems();
             }
        } else {
            const items = cart.getItems();
            const item = items.find(item => item.id === productId);
            if(item) e.target.value = item.quantity; // Revertir a la cantidad anterior
            showAlert('La cantidad debe ser al menos 1.', 'warning');
        }
    }
};

// Handler para eliminar item
const handleRemoveItemClick = (e) => {
    if (e.target.classList.contains('remove-item-btn')) {
        const productId = parseInt(e.target.dataset.productId);
        cart.remove(productId); // Usar el método remove del componente cart (llama a cart.saveItems)
        loadAndRenderCartItems(); // Volver a cargar y renderizar todo el carrito y resumen
        showAlert('Producto eliminado del carrito.', 'success');
    }
};

// Actualizar resumen del pedido
const updateOrderSummary = () => {
    const items = cart.getItems();
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');
    const shippingElement = document.getElementById('shipping');
    
    const subtotal = items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 5; // Envío gratis para pedidos mayores a $50
    const total = subtotal + shipping;

    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(subtotal);
    }
    
    if(shippingElement) {
        shippingElement.textContent = formatPrice(shipping);
    }

    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }
};

// Manejar el proceso de checkout
async function checkout() {
    const token = localStorage.getItem('token');
    if (!token) {
        showAlert('Debes iniciar sesión para realizar una compra', 'warning');
        return;
    }

    const cartItems = cart.getItems();
    if (cartItems.length === 0) {
        showAlert('El carrito está vacío', 'warning');
        return;
    }

    const paymentMethod = document.getElementById('paymentMethod');
    if (!paymentMethod || !paymentMethod.value) {
        showAlert('Por favor, selecciona un método de pago', 'warning');
        return;
    }

    const orderNotes = document.getElementById('orderNotes').value;

    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: cartItems.map(item => ({
                    producto_id: item.id,
                    cantidad: item.quantity,
                    precio_unitario: item.price
                })),
                metodo_pago: paymentMethod.value,
                notas: orderNotes
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al procesar el pedido');
        }

        const data = await response.json();
        showAlert('¡Pedido realizado con éxito!', 'success');
        
        // Limpiar el carrito
        cart.clear();
        
        // Redirigir a la página de mis pedidos después de 2 segundos
        setTimeout(() => {
            window.location.href = 'mis-pedidos.html';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        showAlert(error.message || 'Error al procesar el pedido', 'danger');
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadAndRenderCartItems();
    
    // Agregar event listener al botón de checkout
    const checkoutButton = document.getElementById('checkoutButton');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', checkout);
    }
});

// Función para agregar al carrito
function addToCart(producto) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    const existingItem = carrito.find(item => item.id === producto.id);
    
    if (existingItem) {
        existingItem.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            imagen: producto.imagen
        });
    }
    
    localStorage.setItem('carrito', JSON.stringify(carrito));
    updateCartDisplay();
    showAlert('Producto agregado al carrito', 'success');
}

// Función para actualizar la visualización del carrito
function updateCartDisplay() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const cartContainer = document.querySelector('.cart-items');
    const emptyCart = document.querySelector('.empty-cart');
    const cartSummary = document.querySelector('.cart-summary');
    
    if (carrito.length === 0) {
        if (cartContainer) cartContainer.innerHTML = '';
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'block';
    
    if (cartContainer) {
        cartContainer.innerHTML = carrito.map(item => `
            <div class="cart-item mb-3">
                <div class="row align-items-center">
                    <div class="col-2">
                        <img src="${item.imagen}" alt="${item.nombre}" class="img-fluid">
                    </div>
                    <div class="col-4">
                        <h6 class="mb-0">${item.nombre}</h6>
                    </div>
                    <div class="col-2">
                        <p class="mb-0">$${item.precio}</p>
                    </div>
                    <div class="col-2">
                        <div class="input-group input-group-sm">
                            <button class="btn btn-outline-secondary" onclick="updateQuantity(${item.id}, ${item.cantidad - 1})">-</button>
                            <input type="text" class="form-control text-center" value="${item.cantidad}" readonly>
                            <button class="btn btn-outline-secondary" onclick="updateQuantity(${item.id}, ${item.cantidad + 1})">+</button>
                        </div>
                    </div>
                    <div class="col-2">
                        <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    updateOrderSummary();
}

// Función para actualizar la cantidad de un producto
function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const item = carrito.find(item => item.id === productId);
    
    if (item) {
        item.cantidad = newQuantity;
        localStorage.setItem('carrito', JSON.stringify(carrito));
        updateCartDisplay();
    }
}

// Función para remover un producto del carrito
function removeFromCart(productId) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito = carrito.filter(item => item.id !== productId);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    updateCartDisplay();
    showAlert('Producto removido del carrito', 'info');
} 