document.addEventListener('admin:load:dashboard', loadDashboard);
let dashboardInterval;

async function loadDashboard() {
    if(dashboardInterval) clearInterval(dashboardInterval);
    await fetchDashboardData();
    dashboardInterval = setInterval(fetchDashboardData, 60000);
}

async function fetchDashboardData() {
    try {
        const stats = await adminApi.get('/api/admin/dashboard/stats');
        renderStats(stats);
        renderRecentOrders(stats.recentOrders || []);
        renderLowStock(stats.lowStock || []);
        renderChart(stats.revenueData || []);
    } catch(e) {
        console.error('Failed to load dashboard data:', e);
    }
}

function formatCurrency(paise) {
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function renderStats(stats) {
    const grid = document.getElementById('dashboard-stats');
    grid.innerHTML = '';
    const cards = [
        { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue || 0) },
        { label: 'Total Orders', value: stats.totalOrders || 0 },
        { label: 'Pending Orders', value: stats.pendingOrders || 0 },
        { label: 'Low Stock Products', value: stats.lowStockCount || 0 }
    ];
    cards.forEach(c => {
        const div = document.createElement('div');
        div.className = 'stat-card';
        const h4 = document.createElement('h4');
        h4.textContent = c.label;
        const p = document.createElement('p');
        p.textContent = c.value;
        div.appendChild(h4);
        div.appendChild(p);
        grid.appendChild(div);
    });
}

function renderRecentOrders(orders) {
    const tbody = document.querySelector('#recent-orders-table tbody');
    tbody.innerHTML = '';
    orders.forEach(o => {
        const tr = document.createElement('tr');
        const tdId = document.createElement('td'); tdId.textContent = o.orderNumber;
        const tdCust = document.createElement('td'); tdCust.textContent = o.customerName;
        const tdTotal = document.createElement('td'); tdTotal.textContent = formatCurrency(o.total || 0);
        const tdStatus = document.createElement('td'); 
        const badge = document.createElement('span');
        badge.className = `badge badge-${o.status}`;
        badge.textContent = o.status;
        tdStatus.appendChild(badge);
        const tdDate = document.createElement('td'); tdDate.textContent = new Date(o.createdAt).toLocaleDateString();
        tr.append(tdId, tdCust, tdTotal, tdStatus, tdDate);
        tbody.appendChild(tr);
    });
}

function renderLowStock(items) {
    const list = document.getElementById('low-stock-list');
    list.innerHTML = '';
    if(!items.length) {
        const li = document.createElement('li');
        li.textContent = "All products have sufficient stock.";
        list.appendChild(li);
        return;
    }
    items.forEach(i => {
        const li = document.createElement('li');
        li.textContent = `${i.name} - Stock: ${i.stock}`;
        list.appendChild(li);
    });
}

function renderChart(data) {
    const container = document.getElementById('revenue-bars');
    container.innerHTML = '';
    if(!data.length) return;
    const max = Math.max(...data.map(d => d.amount));
    data.forEach(d => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = max ? `${(d.amount/max)*100}%` : '0';
        bar.title = `${d.date}: ${formatCurrency(d.amount)}`;
        container.appendChild(bar);
    });
}
