document.addEventListener('admin:load:testimonials', loadTestimonials);

async function loadTestimonials() {
    try {
        const data = await adminApi.get('/api/admin/testimonials');
        renderTestimonials(data);
    } catch(e) {
        window.notify('Failed to load testimonials', 'error');
    }
}

function renderTestimonials(testimonials) {
    const tbody = document.querySelector('#testimonials-table tbody');
    tbody.innerHTML = '';
    testimonials.forEach(t => {
        const tr = document.createElement('tr');
        
        const tdName = document.createElement('td'); tdName.textContent = t.name;
        const tdComp = document.createElement('td'); tdComp.textContent = t.company || '';
        const tdRating = document.createElement('td'); tdRating.textContent = '⭐'.repeat(t.rating);
        
        const tdStatus = document.createElement('td');
        tdStatus.textContent = t.isActive ? 'Active' : 'Inactive';
        
        const tdAction = document.createElement('td');
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Delete';
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.onclick = () => deleteTestimonial(t._id);
        tdAction.appendChild(btnDelete);
        
        tr.append(tdName, tdComp, tdRating, tdStatus, tdAction);
        tbody.appendChild(tr);
    });
}

async function deleteTestimonial(id) {
    if(!confirm('Are you sure?')) return;
    try {
        await adminApi.delete(`/api/admin/testimonials/${id}`);
        window.notify('Deleted successfully', 'success');
        loadTestimonials();
    } catch(e) {
        window.notify(e.message, 'error');
    }
}
