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
                        <img src="${item.imagen || '../img/no-image.jpg'}" 
                             class="img-fluid rounded-start" 
                             alt="${item.nombre}">
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
    console.log('Actualizando resumen del pedido...');
    const items = cart.getItems();
    console.log('Items del carrito:', items);
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');
    const shippingElement = document.getElementById('shipping');
    
    const subtotal = items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    console.log('Subtotal calculado:', subtotal);
    const shipping = subtotal > 50 ? 0 : 5; // Ejemplo simple
    console.log('Envío calculado:', shipping);
    const total = subtotal + shipping;
    console.log('Total calculado:', total);

    if (subtotalElement) {
        subtotalElement.textContent = formatPrice(subtotal);
        console.log('Subtotal actualizado en HTML');
    } else {
        console.error('Elemento #subtotal no encontrado!');
    }
    
    if(shippingElement) {
        shippingElement.textContent = formatPrice(shipping);
        console.log('Envío actualizado en HTML');
    } else {
         console.warn('Elemento #shipping no encontrado. Saltando actualización de envío.');
    }

    if (totalElement) {
        totalElement.textContent = formatPrice(total);
        console.log('Total actualizado en HTML');
    } else {
        console.error('Elemento #total no encontrado!');
    }
};

// Manejar el proceso de checkout
const checkout = async () => {
    const items = cart.getItems();
    const deliveryAddressInput = document.getElementById('deliveryAddress');
    const deliveryAddress = deliveryAddressInput.value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const orderNotes = document.getElementById('orderNotes').value;

    if (items.length === 0) {
        showAlert('Tu carrito está vacío.', 'warning');
        return;
    }

    if (!deliveryAddress) {
        showAlert('Por favor, ingresa una dirección de entrega.', 'warning');
        deliveryAddressInput.focus();
        return;
    }

    try {
        const response = await fetch(`${CONFIG.API_URL}/pedidos`, {
            method: 'POST',
            headers: auth.getAuthHeader(),
            body: JSON.stringify({
                items: items.map(item => ({ product_id: item.id, quantity: item.quantity, precio_unitario: parseFloat(item.precio) })),
                direccion_entrega: deliveryAddress,
                metodo_pago: paymentMethod,
                notas: orderNotes
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Pedido realizado con éxito!', 'success');
            cart.clear();
            window.location.href = 'mis-pedidos.html';
        } else {
            console.error('Error al finalizar la compra:', data);
             showAlert(data.message || 'Error al procesar el pedido.', 'danger');
        }
    } catch (error) {
        console.error('Error de conexión al finalizar compra:', error);
        showAlert('Error al conectar con el servidor para finalizar la compra.', 'danger');
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    loadAndRenderCartItems();
    cart.updateUI();

    document.getElementById('checkoutButton').addEventListener('click', checkout);

    // Adjuntar event listeners iniciales a los items (usando delegación)
    attachItemEventListeners();
}); 