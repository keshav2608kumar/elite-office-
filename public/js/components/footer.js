class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div style="margin-bottom: 2rem;">
              <img src="/images/logo.png" alt="Elite Office Technologies" style="height: 60px; border-radius: 4px; margin-bottom: 12px;">
              <p style="color: #ccc; line-height: 1.6;">Your Trusted Partner for Enterprise IT, Networking, Printing & Office Solutions, and office stationery.</p>
            </div>
            
            <div>
              <h3 class="footer-heading">Quick Links</h3>
              <ul style="list-style:none; padding:0;">
                <li><a href="/about.html" class="footer-link">About Us</a></li>
                <li><a href="/products.html" class="footer-link">Products</a></li>
                <li><a href="/contact.html" class="footer-link">Contact</a></li>
                <li><a href="/track-order.html" class="footer-link">Track Order</a></li>
              </ul>
            </div>
            
            <div>
              <h3 class="footer-heading">Categories</h3>
              <ul style="list-style:none; padding:0;" id="footer-categories">
                <li><a href="/products.html?category=IT+%26+Office+Equipment" class="footer-link">IT & Office Equipment</a></li>
                <li><a href="/products.html?category=Printing" class="footer-link">Printing</a></li>
                <li><a href="/products.html?category=Stationery" class="footer-link">Stationery</a></li>
              </ul>
            </div>
            
            <div>
              <h3 class="footer-heading">Contact Info</h3>
              <ul style="list-style:none; padding:0; color:#ccc;">
                <li id="footer-address" style="margin-bottom:0.5rem;">📍 Bengaluru, Karnataka, India</li>
                <li id="footer-whatsapp" style="margin-bottom:0.5rem;">📞 +91 91677 11966</li>
                <li id="footer-landline" style="margin-bottom:0.5rem;">☎️ 080 45256229</li>
                <li id="footer-email">✉️ info@eliteoffice.com</li>
              </ul>
            </div>
          </div>
          
          <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} Elite Office Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    `;

    this.loadData();
  }

  async loadData() {
    if (!window.api) return;

    try {
      const res = await window.api.get('/config/public');
      const config = res.data?.config || {};
      const addressEl = this.querySelector('#footer-address');
      const phoneEl = this.querySelector('#footer-phone');
      const emailEl = this.querySelector('#footer-email');

      if (addressEl && config.address) addressEl.textContent = `📍 ${config.address}`;
      if (phoneEl && config.phone) phoneEl.textContent = `📞 ${config.phone}`;
      if (emailEl && config.email) emailEl.textContent = `✉️ ${config.email}`;
    } catch (e) {
      console.error('Footer data load failed', e);
    }
  }
}

customElements.define('site-footer', SiteFooter);
