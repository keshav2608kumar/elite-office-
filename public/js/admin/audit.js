document.addEventListener('admin:load:audit', loadAuditLogs);

async function loadAuditLogs() {
    try {
        const logs = await adminApi.get('/api/admin/audit-logs');
        renderAuditLogs(logs);
    } catch(e) {
        window.notify('Failed to load audit logs', 'error');
    }
}

function renderAuditLogs(logs) {
    const tbody = document.querySelector('#audit-table tbody');
    tbody.innerHTML = '';
    logs.forEach(log => {
        const tr = document.createElement('tr');
        
        const tdTime = document.createElement('td');
        tdTime.textContent = new Date(log.timestamp).toLocaleString();
        
        const tdAction = document.createElement('td');
        tdAction.textContent = log.action;
        
        const tdActor = document.createElement('td');
        tdActor.textContent = log.actorEmail || log.actorId;
        
        const tdResource = document.createElement('td');
        tdResource.textContent = log.resource;
        
        const tdDetails = document.createElement('td');
        tdDetails.textContent = JSON.stringify(log.details || {});
        
        tr.append(tdTime, tdAction, tdActor, tdResource, tdDetails);
        tbody.appendChild(tr);
    });
}
