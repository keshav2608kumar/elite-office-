document.addEventListener('admin:load:orders', loadOrders);

async function loadOrders() {
    try {
        const data = await adminApi.get('/api/admin/orders');
        renderOrders(data.orders || data);
    } catch(e) {
        window.notify('Failed to load orders', 'error');
    }
}

function formatCurrency(paise) {
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function renderOrders(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    tbody.innerHTML = '';
    orders.forEach(o => {
        const tr = document.createElement('tr');
        
        const tdId = document.createElement('td'); tdId.textContent = o.orderNumber;
        const tdCust = document.createElement('td'); tdCust.textContent = o.customer ? o.customer.name : 'Unknown';
        const tdTotal = document.createElement('td'); tdTotal.textContent = formatCurrency(o.total || 0);
        
        const tdPay = document.createElement('td'); tdPay.textContent = o.paymentStatus;
        const tdStatus = document.createElement('td'); tdStatus.textContent = o.status;
        
        const tdDate = document.createElement('td'); tdDate.textContent = new Date(o.createdAt).toLocaleDateString();
        
        tr.append(tdId, tdCust, tdTotal, tdPay, tdStatus, tdDate);
        tbody.appendChild(tr);
    });
}
