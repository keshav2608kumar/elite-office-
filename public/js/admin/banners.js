const AdminBanners = {
    init() {
        this.tableBody = document.querySelector('#banners-table tbody');
        this.btnCreate = document.getElementById('btn-create-banner');
        
        if (this.btnCreate) {
            this.btnCreate.addEventListener('click', () => this.showModal());
        }

        document.querySelector('.nav-link[data-panel="banners"]')?.addEventListener('click', () => {
            this.loadBanners();
        });
    },

    async loadBanners() {
        try {
            const res = await window.api.get('/admin/banners');
            const banners = res.data?.banners || [];
            this.renderTable(banners);
        } catch (error) {
            console.error('Failed to load banners:', error);
            window.showToast?.('Failed to load banners', 'error');
        }
    },

    renderTable(banners) {
        if (!this.tableBody) return;
        
        this.tableBody.innerHTML = banners.map(b => `
            <tr>
                <td><img src="${b.image || ''}" alt="Banner" style="width: 100px; height: auto; border-radius: var(--radius-sm);"></td>
                <td>${b.title}</td>
                <td>${b.ctaLink}</td>
                <td>
                    <span class="status-badge status-${b.isActive ? 'delivered' : 'pending'}">
                        ${b.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${b.displayOrder}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="AdminBanners.deleteBanner('${b._id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    async deleteBanner(id) {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        
        try {
            await window.api.delete(`/admin/banners/${id}`);
            window.showToast?.('Banner deleted', 'success');
            this.loadBanners();
        } catch (error) {
            window.showToast?.('Failed to delete banner', 'error');
        }
    },

    showModal() {
        window.showToast?.('Add Banner functionality coming soon.', 'info');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AdminBanners.init();
});
