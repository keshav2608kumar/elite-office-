document.addEventListener('admin:load:categories', loadCategories);

async function loadCategories() {
    try {
        const data = await adminApi.get('/api/admin/categories');
        renderCategories(data);
    } catch(e) {
        window.notify('Failed to load categories', 'error');
    }
}

function renderCategories(categories) {
    const tbody = document.querySelector('#categories-table tbody');
    tbody.innerHTML = '';
    categories.forEach(c => {
        const tr = document.createElement('tr');
        
        const tdName = document.createElement('td'); tdName.textContent = c.name;
        const tdSlug = document.createElement('td'); tdSlug.textContent = c.slug;
        
        const tdStatus = document.createElement('td');
        tdStatus.textContent = c.isActive ? 'Active' : 'Inactive';
        
        const tdOrder = document.createElement('td'); tdOrder.textContent = c.displayOrder || 0;
        
        const tdAction = document.createElement('td');
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Delete';
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.onclick = () => deleteCategory(c._id);
        tdAction.appendChild(btnDelete);
        
        tr.append(tdName, tdSlug, tdStatus, tdOrder, tdAction);
        tbody.appendChild(tr);
    });
}

async function deleteCategory(id) {
    if(!confirm('Are you sure?')) return;
    try {
        await adminApi.delete(`/api/admin/categories/${id}`);
        window.notify('Deleted successfully', 'success');
        loadCategories();
    } catch(e) {
        window.notify(e.message, 'error');
    }
}
