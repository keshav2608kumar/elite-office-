document.addEventListener('admin:load:brands', loadBrands);

async function loadBrands() {
    try {
        const data = await adminApi.get('/api/admin/brands');
        renderBrands(data);
    } catch(e) {
        window.notify('Failed to load brands', 'error');
    }
}

function renderBrands(brands) {
    const tbody = document.querySelector('#brands-table tbody');
    tbody.innerHTML = '';
    brands.forEach(b => {
        const tr = document.createElement('tr');
        
        const tdLogo = document.createElement('td'); 
        if(b.logoUrl) {
            const img = document.createElement('img');
            img.src = b.logoUrl;
            img.style.height = '40px';
            tdLogo.appendChild(img);
        }
        
        const tdName = document.createElement('td'); tdName.textContent = b.name;
        
        const tdStatus = document.createElement('td');
        tdStatus.textContent = b.isActive ? 'Active' : 'Inactive';
        
        const tdAction = document.createElement('td');
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Delete';
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.onclick = () => deleteBrand(b._id);
        tdAction.appendChild(btnDelete);
        
        tr.append(tdLogo, tdName, tdStatus, tdAction);
        tbody.appendChild(tr);
    });
}

async function deleteBrand(id) {
    if(!confirm('Are you sure?')) return;
    try {
        await adminApi.delete(`/api/admin/brands/${id}`);
        window.notify('Deleted successfully', 'success');
        loadBrands();
    } catch(e) {
        window.notify(e.message, 'error');
    }
}
