let state = {
  page: 1,
  limit: 12,
  category: '',
  brand: '',
  search: '',
  sort: ''
};

document.addEventListener('DOMContentLoaded', () => {
  parseUrlParams();
  loadCategories();
  loadBrands();
  setupEventListeners();
  fetchProducts();
});

function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  state.category = urlParams.get('category') || '';
  state.brand = urlParams.get('brand') || '';
  state.search = urlParams.get('search') || '';
  state.sort = urlParams.get('sort') || '';
  state.page = parseInt(urlParams.get('page')) || 1;

  document.getElementById('search-input').value = state.search;
  document.getElementById('sort-select').value = state.sort;
}

function updateUrl() {
  const url = new URL(window.location);
  Object.keys(state).forEach(key => {
    if (state[key]) {
      url.searchParams.set(key, state[key]);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.pushState({}, '', url);
}

async function loadCategories() {
  try {
    const res = await window.api.get('/categories');
    const categories = res.data?.categories || [];
    const list = document.getElementById('category-list');
    
    categories.forEach(cat => {
      const pill = document.createElement('div');
      pill.className = `category-pill ${state.category === cat.slug || state.category === cat.name ? 'active' : ''}`;
      pill.dataset.category = cat.name;
      pill.textContent = cat.name;
      list.appendChild(pill);
    });

    // Deactivate "All" if a category is pre-selected
    if (state.category) {
      const allPill = list.querySelector('[data-category=""]');
      if (allPill) allPill.classList.remove('active');
    }
  } catch (error) {
    console.error('Failed to load categories', error);
  }
}

async function loadBrands() {
  try {
    const res = await window.api.get('/brands');
    const brands = res.data?.brands || [];
    const list = document.getElementById('brand-list');
    
    brands.forEach(brand => {
      const pill = document.createElement('div');
      pill.className = `category-pill ${state.brand === brand.slug || state.brand === brand.name ? 'active' : ''}`;
      pill.dataset.brand = brand.name;
      pill.textContent = brand.name;
      list.appendChild(pill);
    });
  } catch (error) {
    console.error('Failed to load brands', error);
  }
}

function setupEventListeners() {
  // Category clicks
  document.getElementById('category-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('category-pill')) {
      document.querySelectorAll('#category-list .category-pill').forEach(el => el.classList.remove('active'));
      e.target.classList.add('active');
      state.category = e.target.dataset.category;
      state.page = 1;
      updateUrl();
      fetchProducts();
    }
  });

  // Brand clicks
  document.getElementById('brand-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('category-pill')) {
      document.querySelectorAll('#brand-list .category-pill').forEach(el => el.classList.remove('active'));
      e.target.classList.add('active');
      state.brand = e.target.dataset.brand;
      state.page = 1;
      updateUrl();
      fetchProducts();
    }
  });

  // Search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', window.Utils.debounce((e) => {
    state.search = e.target.value;
    state.page = 1;
    updateUrl();
    fetchProducts();
  }, 500));

  document.getElementById('search-btn').addEventListener('click', () => {
    state.search = searchInput.value;
    state.page = 1;
    updateUrl();
    fetchProducts();
  });

  // Sort
  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.sort = e.target.value;
    state.page = 1;
    updateUrl();
    fetchProducts();
  });
}

async function fetchProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem;"><div class="spinner" style="width:40px;height:40px;margin:0 auto;"></div><p style="margin-top:16px; color:var(--text-muted);">Loading products...</p></div>';
  async function loadProducts() {
    grid.innerHTML = '<div class="loader" style="grid-column: 1/-1; margin: 4rem auto; text-align:center;">Loading products...</div>';
    
    // Build query
    const params = new URLSearchParams();
    if (state.category) params.append('category', state.category);
    if (state.brand) params.append('brand', state.brand);
    if (state.search) params.append('search', state.search);
    if (state.page > 1) params.append('page', state.page);
    params.append('sort', state.sort);
    
    try {
      const res = await window.api.get(`/products?${params.toString()}`);
      const products = res.data?.products || [];
      const meta = res.data?.meta || {};
      
      if (products.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <p>No products found matching your criteria.</p>
            <button class="btn btn-outline" onclick="window.location.href='/products.html'" style="margin-top: 1rem;">Clear Filters</button>
          </div>
        `;
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.innerHTML = '';
        return;
      }

      renderProducts(products);
      renderPagination(meta.totalPages || 1);
    } catch (error) {
      console.error('API Error:', error);
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <p style="color: var(--error); margin-bottom: 1rem;">Unable to load products. Please try again.</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
        </div>`;
    }
  }
  await loadProducts();
}

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  if (!products || products.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.gridColumn = '1/-1';
    empty.innerHTML = `
      <div class="empty-state__icon">🔍</div>
      <h3 class="empty-state__title">No products found</h3>
      <p class="empty-state__desc">Try adjusting your search or filters.</p>
    `;
    grid.appendChild(empty);
    return;
  }

  products.forEach(product => {
    grid.appendChild(window.createProductCard(product));
  });
}

function renderPagination(totalPages) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  if (totalPages <= 1) return;

  // Prev
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pagination__btn';
  prevBtn.textContent = '←';
  prevBtn.disabled = state.page === 1;
  prevBtn.onclick = () => {
    if (state.page > 1) {
      state.page--;
      updateUrl();
      fetchProducts();
      window.scrollTo(0,0);
    }
  };
  pagination.appendChild(prevBtn);

  // Pages
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `pagination__btn ${state.page === i ? 'pagination__btn--active' : ''}`;
    btn.textContent = i;
    btn.onclick = () => {
      state.page = i;
      updateUrl();
      fetchProducts();
      window.scrollTo(0,0);
    };
    pagination.appendChild(btn);
  }

  // Next
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pagination__btn';
  nextBtn.textContent = '→';
  nextBtn.disabled = state.page === totalPages;
  nextBtn.onclick = () => {
    if (state.page < totalPages) {
      state.page++;
      updateUrl();
      fetchProducts();
      window.scrollTo(0,0);
    }
  };
  pagination.appendChild(nextBtn);
}
