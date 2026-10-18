document.addEventListener('admin:load:orders', loadOrders);

let allOrders = [];

async function loadOrders() {
    try {
        const res = await adminApi.get('/api/admin/orders');
        const orders = (res && res.data && res.data.orders) ? res.data.orders : (res.orders || res || []);
        allOrders = Array.isArray(orders) ? orders : [];
        applyOrderFilters();
    } catch(e) {
        console.error('Failed to load orders', e);
        if (window.notify) window.notify('Failed to load orders', 'error');
    }
}

// Setup search & filter listeners once
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('order-search');
    const statusFilter = document.getElementById('order-status-filter');

    if (searchInput) {
        searchInput.addEventListener('input', applyOrderFilters);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', applyOrderFilters);
    }
});

function applyOrderFilters() {
    const searchInput = document.getElementById('order-search');
    const statusFilter = document.getElementById('order-status-filter');

    const search = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const status = statusFilter ? statusFilter.value.trim() : '';

    const filtered = allOrders.filter(o => {
        const matchesStatus = !status || (o.orderStatus === status || o.status === status);
        const orderNum = (o.orderNumber || '').toLowerCase();
        const custName = (o.customer && o.customer.name ? o.customer.name : '').toLowerCase();
        const custCompany = (o.customer && o.customer.company ? o.customer.company : '').toLowerCase();
        const custEmail = (o.customer && o.customer.email ? o.customer.email : '').toLowerCase();
        
        const matchesSearch = !search || 
            orderNum.includes(search) || 
            custName.includes(search) || 
            custCompany.includes(search) || 
            custEmail.includes(search);

        return matchesStatus && matchesSearch;
    });

    renderOrders(filtered);
}

function formatCurrency(paise) {
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function getStatusBadge(status) {
    const s = (status || 'enquiry').toLowerCase();
    let badgeClass = 'badge-warning';
    let label = 'Enquiry';

    if (s === 'enquiry') {
        badgeClass = 'badge-warning';
        label = 'Enquiry';
    } else if (s === 'quote_prepared') {
        badgeClass = 'badge-info';
        label = 'Quote Prepared';
    } else if (s === 'confirmed') {
        badgeClass = 'badge-success';
        label = 'Confirmed';
    } else if (s === 'processing') {
        badgeClass = 'badge-info';
        label = 'Processing';
    } else if (s === 'shipped') {
        badgeClass = 'badge-info';
        label = 'Shipped';
    } else if (s === 'delivered') {
        badgeClass = 'badge-success';
        label = 'Delivered';
    } else if (s === 'cancelled') {
        badgeClass = 'badge-error';
        label = 'Cancelled';
    } else {
        label = s.toUpperCase();
    }

    return `<span class="badge ${badgeClass}">${label}</span>`;
}

function renderOrders(orders) {
    const tbody = document.querySelector('#orders-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--color-text-muted);">No orders or enquiries found.</td></tr>';
        return;
    }

    orders.forEach(o => {
        const tr = document.createElement('tr');
        
        const tdId = document.createElement('td'); 
        tdId.innerHTML = `<strong>${o.orderNumber}</strong>`;

        const tdCust = document.createElement('td'); 
        const custName = o.customer ? o.customer.name : 'Unknown';
        const company = o.customer && o.customer.company ? `<br><small style="color:var(--color-text-muted);">${o.customer.company}</small>` : '';
        tdCust.innerHTML = `${custName}${company}`;

        const tdTotal = document.createElement('td'); 
        tdTotal.textContent = formatCurrency(o.totalAmount || o.total || 0);
        
        const tdPay = document.createElement('td'); 
        tdPay.textContent = o.paymentStatus || 'pending';

        const tdStatus = document.createElement('td'); 
        tdStatus.innerHTML = getStatusBadge(o.orderStatus || o.status);
        
        const tdDate = document.createElement('td'); 
        tdDate.textContent = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '-';

        const tdAction = document.createElement('td');
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-secondary btn-sm';
        viewBtn.textContent = 'View & Update';
        viewBtn.style.padding = '0.35rem 0.75rem';
        viewBtn.style.fontSize = '0.85rem';
        viewBtn.onclick = () => viewOrderDetail(o._id || o.id);
        tdAction.appendChild(viewBtn);
        
        tr.append(tdId, tdCust, tdTotal, tdPay, tdStatus, tdDate, tdAction);
        tbody.appendChild(tr);
    });
}

async function viewOrderDetail(orderId) {
    const container = document.getElementById('order-detail-container');
    if (!container) return;

    try {
        const res = await adminApi.get(`/api/admin/orders/${orderId}`);
        const order = (res && res.data && res.data.order) ? res.data.order : (res.order || res);

        const cleanPhone = (order.customer && order.customer.phone) ? order.customer.phone.replace(/[^0-9]/g, '') : '';
        const waMsg = encodeURIComponent(`Hello ${order.customer ? order.customer.name : 'Customer'}, regarding your Order Enquiry #${order.orderNumber} from Elite Office Technologies:`);

        let itemsHtml = '';
        if (order.items && order.items.length > 0) {
            order.items.forEach(it => {
                const itemTotal = it.total || (it.price * it.quantity);
                itemsHtml += `
                    <tr>
                        <td><strong>${it.name || 'Product'}</strong></td>
                        <td>${it.sku || '-'}</td>
                        <td>${it.quantity}</td>
                        <td>${formatCurrency(it.price || 0)}</td>
                        <td><strong>${formatCurrency(itemTotal)}</strong></td>
                    </tr>
                `;
            });
        }

        let historyHtml = '';
        if (order.statusHistory && order.statusHistory.length > 0) {
            historyHtml = order.statusHistory.map(h => `
                <li style="margin-bottom:0.5rem; font-size:0.85rem;">
                    <strong>${(h.status || '').toUpperCase()}</strong> - ${h.note || h.comment || 'Status updated'} 
                    <span style="color:var(--color-text-muted);">(${new Date(h.timestamp).toLocaleString()})</span>
                </li>
            `).join('');
        }

        container.classList.remove('hidden');
        container.style.display = 'block';
        container.innerHTML = `
            <div style="background:#fff; border:2px solid var(--color-border); border-radius:var(--radius-md); padding:1.75rem; margin-top:2rem; box-shadow:var(--shadow-md);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--color-border); padding-bottom:1rem; margin-bottom:1.5rem;">
                    <div>
                        <h3 style="margin:0; font-size:1.4rem;">Enquiry Details: ${order.orderNumber}</h3>
                        <span style="font-size:0.9rem; color:var(--color-text-muted);">Created on: ${new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('order-detail-container').classList.add('hidden'); document.getElementById('order-detail-container').style.display='none';">✕ Close</button>
                </div>

                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin-bottom:1.5rem;">
                    <!-- Customer Information -->
                    <div style="background:#f9fafb; padding:1.25rem; border-radius:var(--radius-sm); border:1px solid var(--color-border);">
                        <h4 style="margin:0 0 0.75rem 0; color:var(--color-primary);">Customer Information</h4>
                        <p style="margin:0 0 0.4rem 0;"><strong>Name:</strong> ${order.customer ? order.customer.name : 'N/A'}</p>
                        ${order.customer && order.customer.company ? `<p style="margin:0 0 0.4rem 0;"><strong>Company:</strong> ${order.customer.company}</p>` : ''}
                        <p style="margin:0 0 0.4rem 0;"><strong>Email:</strong> <a href="mailto:${order.customer ? order.customer.email : ''}">${order.customer ? order.customer.email : 'N/A'}</a></p>
                        <p style="margin:0 0 0.6rem 0;"><strong>Phone:</strong> <a href="tel:${order.customer ? order.customer.phone : ''}">${order.customer ? order.customer.phone : 'N/A'}</a></p>
                        
                        ${cleanPhone ? `
                            <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" class="btn btn-sm" style="background:#25D366; color:white; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 0.8rem; border-radius:var(--radius-sm);">
                                💬 WhatsApp Customer
                            </a>
                        ` : ''}
                    </div>

                    <!-- Delivery Location -->
                    <div style="background:#f9fafb; padding:1.25rem; border-radius:var(--radius-sm); border:1px solid var(--color-border);">
                        <h4 style="margin:0 0 0.75rem 0; color:var(--color-primary);">Delivery Location</h4>
                        <p style="margin:0 0 0.4rem 0;">${order.customer && order.customer.address && order.customer.address.street ? order.customer.address.street : 'Address not specified'}</p>
                        <p style="margin:0 0 0.4rem 0;">${order.customer && order.customer.address ? `${order.customer.address.city || ''}, ${order.customer.address.state || ''} - ${order.customer.address.pincode || ''}` : ''}</p>
                        <p style="margin:0 0 0.4rem 0;">${order.customer && order.customer.address ? (order.customer.address.country || 'India') : ''}</p>
                        ${order.notes ? `<div style="margin-top:0.75rem; padding-top:0.5rem; border-top:1px dashed var(--color-border);"><strong>Enquiry Note:</strong><br><span style="color:var(--color-text-muted); font-size:0.9rem;">${order.notes}</span></div>` : ''}
                    </div>

                    <!-- Status & Update Form -->
                    <div style="background:#f9fafb; padding:1.25rem; border-radius:var(--radius-sm); border:1px solid var(--color-border);">
                        <h4 style="margin:0 0 0.75rem 0; color:var(--color-primary);">Update Order Status</h4>
                        <p style="margin:0 0 0.5rem 0;">Current: ${getStatusBadge(order.orderStatus || order.status)}</p>
                        
                        <div style="margin-top:0.75rem;">
                            <label style="font-size:0.85rem; font-weight:600; display:block; margin-bottom:0.25rem;">Change Status To:</label>
                            <select id="update-status-select" class="form-control" style="width:100%; margin-bottom:0.5rem; padding:0.4rem;">
                                <option value="enquiry" ${order.orderStatus === 'enquiry' ? 'selected' : ''}>Enquiry Received</option>
                                <option value="quote_prepared" ${order.orderStatus === 'quote_prepared' ? 'selected' : ''}>Quotation Prepared</option>
                                <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="processing" ${order.orderStatus === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="shipped" ${order.orderStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                            <input type="text" id="update-status-comment" class="form-control" placeholder="Optional update note/tracking..." style="width:100%; margin-bottom:0.5rem; padding:0.4rem;">
                            <button class="btn btn-primary btn-sm" style="width:100%;" onclick="submitStatusUpdate('${order._id}')">Save Status</button>
                        </div>
                    </div>
                </div>

                <!-- Products Table -->
                <h4 style="margin:0 0 0.75rem 0;">Requested Items</h4>
                <div class="table-responsive" style="margin-bottom:1.5rem;">
                    <table class="admin-table">
                        <thead>
                            <tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Unit Price</th><th>Line Total</th></tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                </div>

                <!-- Financial Summary -->
                <div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
                    <div style="min-width:250px; background:#f9fafb; padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--color-border);">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                            <span>Subtotal:</span><strong>${formatCurrency(order.subtotal || 0)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                            <span>GST (18%):</span><strong>${formatCurrency(order.taxAmount || 0)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:1.15rem; font-weight:700; border-top:1px solid var(--color-border); padding-top:0.5rem; color:var(--color-primary);">
                            <span>Total Amount:</span><span>${formatCurrency(order.totalAmount || 0)}</span>
                        </div>
                    </div>
                </div>

                <!-- Status History Timeline -->
                ${historyHtml ? `
                    <div style="border-top:1px solid var(--color-border); padding-top:1rem;">
                        <h4 style="margin:0 0 0.5rem 0;">Status Timeline</h4>
                        <ul style="padding-left:1.2rem; margin:0;">${historyHtml}</ul>
                    </div>
                ` : ''}
            </div>
        `;

        container.scrollIntoView({ behavior: 'smooth' });

    } catch(err) {
        console.error('Failed to view order', err);
        if (window.notify) window.notify('Failed to load order details', 'error');
    }
}

async function submitStatusUpdate(orderId) {
    const select = document.getElementById('update-status-select');
    const commentInput = document.getElementById('update-status-comment');
    if (!select) return;

    const newStatus = select.value;
    const comment = commentInput ? commentInput.value.trim() : '';

    try {
        await adminApi.put(`/api/admin/orders/${orderId}/status`, {
            status: newStatus,
            comment
        });

        if (window.notify) window.notify('Order status updated successfully!', 'success');
        
        // Refresh orders and reload detail
        await loadOrders();
        await viewOrderDetail(orderId);
    } catch(err) {
        console.error('Status update error', err);
        if (window.notify) window.notify(err.message || 'Failed to update order status', 'error');
    }
}
