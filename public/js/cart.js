const CartManager = {
  STORAGE_KEY: 'elite_office_cart',

  getItems() {
    try {
      const items = localStorage.getItem(this.STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch (e) {
      console.error('Error reading cart', e);
      return [];
    }
  },

  saveItems(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { items } }));
  },

  addItem(product, quantity = 1) {
    const items = this.getItems();
    const existingIndex = items.findIndex(item => item.productId === product._id || item.productId === product.id);

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantity;
    } else {
      items.push({
        productId: product._id || product.id,
        name: product.name,
        price: product.price, // Stored in paise
        image: product.image || product.images?.[0],
        slug: product.slug,
        quantity: quantity
      });
    }

    this.saveItems(items);
    if(window.showToast) window.showToast('Item added to cart', 'success');
  },

  removeItem(productId) {
    const items = this.getItems().filter(item => item.productId !== productId);
    this.saveItems(items);
  },

  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    const items = this.getItems();
    const item = items.find(item => item.productId === productId);
    if (item) {
      item.quantity = quantity;
      this.saveItems(items);
    }
  },

  getCount() {
    return this.getItems().reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal() {
    return this.getItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  clear() {
    this.saveItems([]);
  },

  async validateWithServer() {
    const items = this.getItems();
    if (items.length === 0) return { items: [], subtotal: 0 };

    try {
      const payload = {
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity }))
      };
      
      const validatedCart = await window.api.post('/cart/validate', payload);
      // Update local cart with verified prices/names if needed
      if(validatedCart && validatedCart.items) {
          const updatedItems = validatedCart.items.map(vItem => {
             const localItem = items.find(i => i.productId === vItem.productId);
             return {
                 ...localItem,
                 price: vItem.price,
                 name: vItem.name
             };
          });
          this.saveItems(updatedItems);
      }
      return validatedCart;
    } catch (error) {
      console.error('Cart validation failed', error);
      throw error;
    }
  }
};

window.CartManager = CartManager;
