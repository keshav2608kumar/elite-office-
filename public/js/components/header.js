class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.render();
    this.setupListeners();
    this.updateCartBadge();
  }

  render() {
    const currentPath = window.location.pathname;
    
    this.innerHTML = `
      <header class="site-header">
        <div class="topbar">
          <div class="container topbar-content">
            <div>Your Trusted Partner for Office Technology Solutions</div>
            <div>
              <span id="header-phone">📞 +91 91677 11966</span> | 
              <span id="header-email">✉️ info@eliteoffice.com</span>
            </div>
          </div>
        </div>
        <div class="main-header">
          <div class="container main-header-content" style="display:flex; align-items:center; justify-content:space-between;">
            <a href="/" class="logo" aria-label="Elite Office Technologies Home">
              <img src="/images/logo.png" alt="Elite Office Technologies" class="logo-img" style="height: 50px;">
            </a>
            
            <nav class="nav-links" id="main-nav">
              <a href="/" class="nav-link ${currentPath === '/' || currentPath === '/index.html' ? 'active' : ''}">Home</a>
              <a href="/products.html" class="nav-link ${currentPath.includes('product') ? 'active' : ''}">Products</a>
              <a href="/services.html" class="nav-link ${currentPath.includes('service') ? 'active' : ''}">Services</a>
              <a href="/about.html" class="nav-link ${currentPath.includes('about') ? 'active' : ''}">About</a>
              <a href="/contact.html" class="nav-link ${currentPath.includes('contact') ? 'active' : ''}">Contact</a>
            </nav>

            <div class="header-actions" style="display:flex; align-items:center; gap: 1.5rem;">
              <a href="/admin/index.html" class="admin-link" style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted); text-decoration: none;">Admin</a>
              <a href="/cart.html" class="cart-icon" aria-label="View Cart" style="position:relative; color: var(--text-primary); text-decoration: none;">
                🛒
                <span class="cart-badge" id="cart-badge">0</span>
              </a>
              <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle Menu">
                ☰
              </button>
            </div>
          </div>
        </div>
      </header>
    `;

    // Fetch config for topbar
    if (window.api) {
      window.api.get('/config/public')
        .then(res => {
          const config = res.data?.config || {};
          const phoneEl = this.querySelector('#header-phone');
          const emailEl = this.querySelector('#header-email');
          if (phoneEl && config.phone) phoneEl.textContent = `📞 ${config.phone}`;
          if (emailEl && config.email) emailEl.textContent = `✉️ ${config.email}`;
        })
        .catch(err => console.error('Failed to load header config', err));
    }
  }

  setupListeners() {
    const mobileBtn = this.querySelector('#mobile-menu-btn');
    const nav = this.querySelector('#main-nav');

    if (mobileBtn && nav) {
      mobileBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileBtn.textContent = nav.classList.contains('active') ? '✕' : '☰';
      });
    }

    window.addEventListener('cart-updated', () => {
      this.updateCartBadge();
    });
  }

  updateCartBadge() {
    const badge = this.querySelector('#cart-badge');
    if (badge && window.CartManager) {
      const count = window.CartManager.getCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }
}

customElements.define('site-header', SiteHeader);
