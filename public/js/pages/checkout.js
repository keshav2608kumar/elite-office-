let validatedCartData = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.CartManager || window.CartManager.getItems().length === 0) {
    window.location.href = '/cart.html';
    return;
  }

  await validateCart();
  setupForm();
});

async function validateCart() {
  const container = document.getElementById('checkout-items');
  try {
    const data = await window.CartManager.validateWithServer();
    validatedCartData = data;
    renderOrderSummary(data);
  } catch (error) {
    console.error('Cart validation failed', error);
    if (window.showToast) window.showToast('Could not sync current prices. Showing cart items.', 'warning');
    
    // Fallback to local cart items
    const localItems = window.CartManager.getItems();
    let subtotal = 0;
    const items = localItems.map(item => {
      subtotal += (item.price || 0) * (item.quantity || 1);
      return {
        productId: item.productId,
        name: item.name || 'Product',
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || '/images/placeholder.png'
      };
    });
    validatedCartData = { items, subtotal };
    renderOrderSummary(validatedCartData);
  }
}

function renderOrderSummary(data) {
  const container = document.getElementById('checkout-items');
  if (!container) return;
  container.innerHTML = '';

  if (!data || !data.items || data.items.length === 0) {
    container.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--color-text-muted);">No items in cart</div>';
    return;
  }

  data.items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'summary-item';
    
    const img = document.createElement('img');
    img.src = window.Utils ? window.Utils.getImageUrl(item.image) : (item.image || '/images/placeholder.png');
    img.className = 'summary-item-img';
    img.alt = item.name;
    img.onerror = () => { img.src = '/images/placeholder.png'; };
    
    const info = document.createElement('div');
    info.className = 'summary-item-info';
    
    const title = document.createElement('div');
    title.style.fontSize = '0.9rem';
    title.style.fontWeight = '600';
    title.textContent = item.name;
    
    const qty = document.createElement('div');
    qty.style.fontSize = '0.8rem';
    qty.style.color = 'var(--color-text-muted)';
    qty.textContent = `Quantity: ${item.quantity}`;
    
    info.appendChild(title);
    info.appendChild(qty);
    
    const price = document.createElement('div');
    price.className = 'summary-item-price';
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    price.textContent = window.Utils ? window.Utils.formatPrice(itemTotal) : `₹${(itemTotal/100).toFixed(2)}`;
    
    el.appendChild(img);
    el.appendChild(info);
    el.appendChild(price);
    container.appendChild(el);
  });

  const subtotal = data.subtotal || 0;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  const subEl = document.getElementById('co-subtotal');
  const taxEl = document.getElementById('co-tax');
  const totEl = document.getElementById('co-total');

  if (subEl) subEl.textContent = window.Utils ? window.Utils.formatPrice(subtotal) : `₹${(subtotal/100).toFixed(2)}`;
  if (taxEl) taxEl.textContent = window.Utils ? window.Utils.formatPrice(tax) : `₹${(tax/100).toFixed(2)}`;
  if (totEl) totEl.textContent = window.Utils ? window.Utils.formatPrice(total) : `₹${(total/100).toFixed(2)}`;
}

function setupForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!form.checkValidity()) {
      form.reportValidity();
      if (window.showToast) window.showToast('Please fill all required fields correctly.', 'error');
      return;
    }

    const cartItems = window.CartManager.getItems();
    if (!cartItems || cartItems.length === 0) {
      if (window.showToast) window.showToast('Your cart is empty.', 'error');
      window.location.href = '/cart.html';
      return;
    }

    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting Enquiry...';

    const formData = new FormData(form);
    const orderPayload = {
      customer: {
        name: formData.get('name').trim(),
        company: (formData.get('company') || '').trim(),
        email: formData.get('email').trim().toLowerCase(),
        phone: formData.get('phone').trim(),
        address: {
          street: formData.get('address').trim(),
          city: formData.get('city').trim(),
          state: formData.get('state').trim(),
          pincode: formData.get('pincode').trim()
        }
      },
      items: cartItems.map(i => ({ 
        productId: i.productId, 
        quantity: i.quantity 
      })),
      notes: (formData.get('notes') || '').trim(),
      paymentMethod: 'enquiry'
    };

    try {
      const orderRes = await window.api.post('/orders', orderPayload);
      const order = (orderRes && orderRes.data && orderRes.data.order) ? orderRes.data.order : (orderRes.order || orderRes);

      if (window.showToast) {
        window.showToast('Enquiry submitted successfully! Redirecting...', 'success');
      }

      // Clear the local cart
      window.CartManager.clear();

      // Redirect to confirmation
      const orderNum = order.orderNumber || 'EOT-ORDER';
      const emailParam = encodeURIComponent(orderPayload.customer.email);
      setTimeout(() => {
        window.location.href = `/order-confirmation.html?order=${encodeURIComponent(orderNum)}&email=${emailParam}`;
      }, 500);

    } catch (error) {
      console.error('Enquiry submission error:', error);
      if (window.showToast) {
        window.showToast(error.message || 'Failed to submit enquiry. Please try again.', 'error');
      }
      btn.disabled = false;
      btn.textContent = '📩 Submit Order Enquiry & Request Quote';
    }
  });
}
