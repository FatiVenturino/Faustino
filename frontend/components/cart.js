// Componente reutilizable para gestionar el carrito de compras

export const cart = {
    // Obtiene los items del carrito desde localStorage
    getItems: () => {
        const items = localStorage.getItem('cart');
        return items ? JSON.parse(items) : [];
    },

    // Guarda los items del carrito en localStorage
    saveItems: (items) => {
        localStorage.setItem('cart', JSON.stringify(items));
        cart.updateUI(); // Actualizar la UI del carrito (ej: contador en navbar)
    },

    // Agrega un producto al carrito o incrementa su cantidad
    add: (product, quantity = 1) => {
        const items = cart.getItems();
        const existingItemIndex = items.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            // El producto ya está en el carrito, incrementar cantidad
            items[existingItemIndex].quantity += quantity;
        } else {
            // Agregar nuevo producto al carrito
            items.push({
                id: product.id,
                nombre: product.nombre,
                precio: product.precio,
                quantity: quantity,
                imagen: product.imagen || product.producto_imagen || '../img/no-image.jpg',
                categoria: product.categoria_nombre
            });
        }

        cart.saveItems(items);
    },

    // Elimina un producto del carrito o decrementa su cantidad
    remove: (productId, quantityToRemove = null) => {
        let items = cart.getItems();
        const existingItemIndex = items.findIndex(item => item.id === productId);

        if (existingItemIndex > -1) {
            if (quantityToRemove === null || items[existingItemIndex].quantity <= quantityToRemove) {
                items.splice(existingItemIndex, 1);
            } else {
                items[existingItemIndex].quantity -= quantityToRemove;
            }
            cart.saveItems(items); // Esto guarda en localStorage y llama a updateUI (contador navbar)
            // Llamar explícitamente a la función de actualización del resumen si existe en la página actual
            if (typeof updateOrderSummary === 'function') {
                updateOrderSummary();
            }
        }
    },

    // Limpia completamente el carrito
    clear: () => {
        localStorage.removeItem('cart');
        cart.updateUI(); // Actualizar la UI del carrito (contador navbar)
         // Llamar explícitamente a la función de actualización del resumen si existe en la página actual
         if (typeof updateOrderSummary === 'function') {
            updateOrderSummary();
         }
    },

    // Actualiza elementos visuales relacionados con el carrito (ej: contador en navbar)
    updateUI: () => {
        const cartCountElement = document.getElementById('cartCount');
        if (cartCountElement) {
            const items = cart.getItems();
            const totalItems = items.reduce((total, item) => total + item.quantity, 0);
            cartCountElement.textContent = totalItems;
        }
        // Puedes añadir aquí lógica para actualizar otros elementos del carrito si existen en la página actual
        // Por ejemplo, actualizar la lista de items en la página del carrito.
        // Sin embargo, es mejor que las páginas que necesitan mostrar la lista completa del carrito
        // tengan su propia función para renderizarla llamando a getItems.
    }
}; 