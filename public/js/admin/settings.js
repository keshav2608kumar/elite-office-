document.addEventListener('admin:load:settings', loadSettings);

async function loadSettings() {
    try {
        const config = await adminApi.get('/api/admin/config');
        const form = document.getElementById('settings-form');
        
        for (const [key, value] of Object.entries(config)) {
            if (form.elements[key]) {
                form.elements[key].value = value;
            }
        }
    } catch(e) {
        window.notify('Failed to load settings', 'error');
    }
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {};
    for(let el of form.elements) {
        if(el.name) {
            data[el.name] = el.type === 'number' ? Number(el.value) : el.value;
        }
    }
    
    try {
        await adminApi.put('/api/admin/config', data);
        window.notify('Settings saved successfully', 'success');
    } catch(e) {
        window.notify(e.message || 'Failed to save settings', 'error');
    }
});
