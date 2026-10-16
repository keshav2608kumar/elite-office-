document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  
  // Listen for cart changes across tabs or other events
  window.addEventListener('cart-updated', () => {
    renderCart();
  });
});

function renderCart() {
  if (!window.CartManager) return;
  
  const items = window.CartManager.getItems();
  const contentEl = document.getElementById('cart-content');
  const emptyEl = document.getElementById('empty-cart');
  const container = document.getElementById('cart-items-container');

  if (items.length === 0) {
    contentEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  contentEl.style.display = 'grid';
  emptyEl.style.display = 'none';
  container.innerHTML = '';

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';

    // Image
    const img = document.createElement('img');
    img.src = window.Utils.getImageUrl(item.image);
    img.className = 'cart-item-img';
    img.alt = item.name;
    img.onerror = function() { this.src = '/images/placeholder.jpg'; };

    // Details
    const details = document.createElement('div');
    details.className = 'cart-item-details';
    
    const title = document.createElement('a');
    title.href = `/product.html?slug=${item.slug}`;
    title.className = 'cart-item-title';
    title.style.display = 'block';
    title.textContent = item.name;
    
    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = window.Utils.formatPrice(item.price);
    
    details.appendChild(title);
    details.appendChild(price);

    // Qty
    const qtyWrap = document.createElement('div');
    qtyWrap.className = 'cart-item-qty';
    
    const minus = document.createElement('button');
    minus.textContent = '-';
    minus.onclick = () => window.CartManager.updateQuantity(item.productId, item.quantity - 1);
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = item.quantity;
    input.min = '1';
    input.onchange = (e) => window.CartManager.updateQuantity(item.productId, parseInt(e.target.value) || 1);
    
    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.onclick = () => window.CartManager.updateQuantity(item.productId, item.quantity + 1);

    qtyWrap.appendChild(minus);
    qtyWrap.appendChild(input);
    qtyWrap.appendChild(plus);

    // Total
    const total = document.createElement('div');
    total.className = 'cart-item-total';
    total.textContent = window.Utils.formatPrice(item.price * item.quantity);

    // Remove
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Remove item';
    removeBtn.onclick = () => window.CartManager.removeItem(item.productId);

    row.appendChild(img);
    row.appendChild(details);
    row.appendChild(qtyWrap);
    row.appendChild(total);
    row.appendChild(removeBtn);

    container.appendChild(row);
  });

  updateTotals();
}

function updateTotals() {
  const subtotal = window.CartManager.getSubtotal();
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  document.getElementById('summary-subtotal').textContent = window.Utils.formatPrice(subtotal);
  document.getElementById('summary-tax').textContent = window.Utils.formatPrice(tax);
  document.getElementById('summary-total').textContent = window.Utils.formatPrice(total);
}
