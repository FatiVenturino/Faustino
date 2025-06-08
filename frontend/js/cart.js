import { CONFIG } from './config.js';
import { formatPrice, showAlert } from './utils.js';
import { auth } from './auth.js';

export const cart = {
    get: () => {
        return JSON.parse(localStorage.getItem('cart')) || [];
    },

    save: (cartItems) => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    },

    add: (product, quantity = 1) => {
        const cartItems = cart.get();
        const existingItem = cartItems.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cartItems.push({
                id: product.id,
                name: product.nombre,
                price: product.precio,
                quantity: quantity,
                image: product.imagen
            });
        }
        
        cart.save(cartItems);
        cart.updateUI();
    },

    remove: (productId) => {
        const cartItems = cart.get();
        const updatedCart = cartItems.filter(item => item.id !== productId);
        cart.save(updatedCart);
        cart.updateUI();
    },

    updateQuantity: (productId, quantity) => {
        const cartItems = cart.get();
        const item = cartItems.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            cart.save(cartItems);
            cart.updateUI();
        }
    },

    clear: () => {
        localStorage.removeItem('cart');
        cart.updateUI();
    },

    getTotal: () => {
        const cartItems = cart.get();
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getTotalWithShipping: () => {
        return cart.getTotal() + CONFIG.SHIPPING_COST;
    },

    updateUI: () => {
        const cartItems = cart.get();
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartCount) {
            cartCount.textContent = cartItems.reduce((total, item) => total + item.quantity, 0);
        }
        
        if (cartTotal) {
            cartTotal.textContent = formatPrice(cart.getTotal());
        }
    },

    renderItems: () => {
        const cartItems = cart.get();
        const cartItemsContainer = document.getElementById('cartItems');
        const emptyCart = document.getElementById('emptyCart');
        const cartContent = document.getElementById('cartContent');
        
        if (!cartItemsContainer) return;
        
        if (cartItems.length === 0) {
            emptyCart.style.display = 'block';
            cartContent.style.display = 'none';
            return;
        }
        
        emptyCart.style.display = 'none';
        cartContent.style.display = 'block';
        
        cartItemsContainer.innerHTML = '';
        cartItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'card mb-3';
            itemElement.innerHTML = `
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <img src="${item.image || '../img/no-image.jpg'}" class="img-fluid rounded" alt="${item.name}">
                        </div>
                        <div class="col-md-4">
                            <h5 class="card-title">${item.name}</h5>
                            <p class="card-text">${formatPrice(item.price)}</p>
                        </div>
                        <div class="col-md-3">
                            <div class="input-group">
                                <button class="btn btn-outline-secondary" type="button" onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                                <input type="number" class="form-control text-center" value="${item.quantity}" min="1" onchange="cart.updateQuantity(${item.id}, this.value)">
                                <button class="btn btn-outline-secondary" type="button" onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                        <div class="col-md-2">
                            <p class="card-text"><strong>${formatPrice(item.price * item.quantity)}</strong></p>
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-danger btn-sm" onclick="cart.remove(${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
        
        cart.updateOrderSummary();
    },

    updateOrderSummary: () => {
        const subtotal = cart.getTotal();
        const total = cart.getTotalWithShipping();
        
        const subtotalElement = document.getElementById('subtotal');
        const shippingElement = document.getElementById('shipping');
        const totalElement = document.getElementById('total');
        
        if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
        if (shippingElement) shippingElement.textContent = formatPrice(CONFIG.SHIPPING_COST);
        if (totalElement) totalElement.textContent = formatPrice(total);
    },

    checkout: async () => {
        if (!auth.isAuthenticated()) {
            window.location.href = '/pages/login.html';
            return;
        }
        
        const cartItems = cart.get();
        if (cartItems.length === 0) {
            showAlert('El carrito está vacío', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API_URL}/pedidos`, {
                method: 'POST',
                headers: auth.getAuthHeader(),
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        producto_id: item.id,
                        cantidad: item.quantity,
                        precio_unitario: item.price
                    }))
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                cart.clear();
                showAlert('Pedido realizado con éxito', 'success');
                setTimeout(() => {
                    window.location.href = 'mis-pedidos.html';
                }, 2000);
            } else {
                showAlert(data.message || 'Error al procesar el pedido', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Error al conectar con el servidor', 'danger');
        }
    }
}; 