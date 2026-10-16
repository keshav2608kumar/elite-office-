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
    if(window.showToast) window.showToast('Failed to validate cart prices. Please refresh.', 'error');
    container.innerHTML = '<div style="color:red">Error loading cart. Please try again.</div>';
  }
}

function renderOrderSummary(data) {
  const container = document.getElementById('checkout-items');
  container.innerHTML = '';

  data.items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'summary-item';
    
    const img = document.createElement('img');
    img.src = window.Utils.getImageUrl(item.image);
    img.className = 'summary-item-img';
    
    const info = document.createElement('div');
    info.className = 'summary-item-info';
    
    const title = document.createElement('div');
    title.style.fontSize = '0.9rem';
    title.textContent = item.name;
    
    const qty = document.createElement('div');
    qty.style.fontSize = '0.8rem';
    qty.style.color = 'var(--color-text-muted)';
    qty.textContent = `Qty: ${item.quantity}`;
    
    info.appendChild(title);
    info.appendChild(qty);
    
    const price = document.createElement('div');
    price.className = 'summary-item-price';
    price.textContent = window.Utils.formatPrice(item.price * item.quantity);
    
    el.appendChild(img);
    el.appendChild(info);
    el.appendChild(price);
    container.appendChild(el);
  });

  const subtotal = data.subtotal;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;

  document.getElementById('co-subtotal').textContent = window.Utils.formatPrice(subtotal);
  document.getElementById('co-tax').textContent = window.Utils.formatPrice(tax);
  document.getElementById('co-total').textContent = window.Utils.formatPrice(total);
}

function setupForm() {
  const form = document.getElementById('checkout-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity() || !validatedCartData) {
      if(window.showToast) window.showToast('Please fill all required fields correctly.', 'error');
      return;
    }

    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const formData = new FormData(form);
    const orderPayload = {
      customer: {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: {
          street: formData.get('address'),
          city: formData.get('city'),
          state: formData.get('state'),
          pincode: formData.get('pincode')
        }
      },
      items: window.CartManager.getItems().map(i => ({ productId: i.productId, quantity: i.quantity })),
      paymentMethod: formData.get('paymentMethod')
    };

    try {
      const orderRes = await window.api.post('/orders', orderPayload);
      
      if (orderPayload.paymentMethod === 'razorpay') {
        await processRazorpay(orderRes);
      } else {
        // COD
        window.CartManager.clear();
        window.location.href = `/order-confirmation.html?order=${orderRes.orderNumber}&email=${encodeURIComponent(orderPayload.customer.email)}`;
      }
    } catch (error) {
      console.error(error);
      if(window.showToast) window.showToast(error.message || 'Failed to place order', 'error');
      btn.disabled = false;
      btn.textContent = 'Place Order';
    }
  });
}

async function processRazorpay(order) {
  try {
    const rpOrder = await window.api.post('/payments/create-order', { orderId: order._id });
    
    const options = {
      key: "YOUR_RAZORPAY_KEY", // Should ideally be fetched from backend config
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      name: "Elite Office Technologies",
      description: `Order ${order.orderNumber}`,
      order_id: rpOrder.id,
      handler: async function (response) {
        try {
          await window.api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          window.CartManager.clear();
          window.location.href = `/order-confirmation.html?order=${order.orderNumber}&email=${encodeURIComponent(order.customer.email)}`;
        } catch (err) {
          if(window.showToast) window.showToast('Payment verification failed. Please contact support.', 'error');
          document.getElementById('place-order-btn').disabled = false;
          document.getElementById('place-order-btn').textContent = 'Try Again';
        }
      },
      prefill: {
        name: `${order.customer.firstName} ${order.customer.lastName}`,
        email: order.customer.email,
        contact: order.customer.phone
      },
      theme: {
        color: "#0a1628"
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', function (response){
      if(window.showToast) window.showToast('Payment failed. Please try again.', 'error');
      document.getElementById('place-order-btn').disabled = false;
      document.getElementById('place-order-btn').textContent = 'Place Order';
    });
    rzp.open();
  } catch (error) {
    if(window.showToast) window.showToast('Failed to initiate payment', 'error');
    document.getElementById('place-order-btn').disabled = false;
    document.getElementById('place-order-btn').textContent = 'Place Order';
  }
}
