const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Replace corrupted trust icons (which have 3 occurrences)
html = html.replace(/<div class="trust__icon">.*?<\/div>/g, '<div class="trust__icon">✓</div>');

// Replace categories icons
html = html.replace(/<div style="font-size:3\.5rem; margin-bottom:16px;">.*?<\/div>\s*<h3 class="category-card__name">IT & Office Equipment<\/h3>/, '<div style="font-size:3.5rem; margin-bottom:16px;">💻</div>\n              <h3 class="category-card__name">IT & Office Equipment</h3>');

html = html.replace(/<div style="font-size:3\.5rem; margin-bottom:16px;">.*?<\/div>\s*<h3 class="category-card__name">Printing Solutions<\/h3>/, '<div style="font-size:3.5rem; margin-bottom:16px;">🖨️</div>\n              <h3 class="category-card__name">Printing Solutions</h3>');

html = html.replace(/<div style="font-size:3\.5rem; margin-bottom:16px;">.*?<\/div>\s*<h3 class="category-card__name">Stationery<\/h3>/, '<div style="font-size:3.5rem; margin-bottom:16px;">📎</div>\n              <h3 class="category-card__name">Stationery</h3>');

// Fix 'View All Products' arrow
html = html.replace(/View All Products .*?<\/a>/, 'View All Products &rarr;</a>');

// Fix Services grid
const servicesStart = html.indexOf('<div class="services__grid">');
if (servicesStart > -1) {
  const servicesEnd = html.indexOf('</section>', servicesStart);
  if (servicesEnd > -1) {
    const servicesGrid = `<div class="services__grid">
          <div class="service-card">
            <div class="service-card__icon">💻</div>
            <h4 class="service-card__title">Computer & IT Solutions</h4>
            <p class="service-card__desc">Setup, maintenance, and troubleshooting for office computers and networks.</p>
          </div>
          <div class="service-card">
            <div class="service-card__icon">🖨️</div>
            <h4 class="service-card__title">Printer Solutions</h4>
            <p class="service-card__desc">Sales, service, and AMC for all major printer brands.</p>
          </div>
          <div class="service-card">
            <div class="service-card__icon">📠</div>
            <h4 class="service-card__title">Office Equipment</h4>
            <p class="service-card__desc">Supplying reliable copiers, scanners, and projectors.</p>
          </div>
          <div class="service-card">
            <div class="service-card__icon">📑</div>
            <h4 class="service-card__title">Printing Services</h4>
            <p class="service-card__desc">Professional document printing and binding services.</p>
          </div>
          <div class="service-card">
            <div class="service-card__icon">📎</div>
            <h4 class="service-card__title">Stationery Supply</h4>
            <p class="service-card__desc">Bulk supply of high-quality office stationery.</p>
          </div>
          <div class="service-card">
            <div class="service-card__icon">⚙️</div>
            <h4 class="service-card__title">Business Technology</h4>
            <p class="service-card__desc">Consulting and implementation of tech solutions.</p>
          </div>
        </div>
      </div>
    `;
    html = html.substring(0, servicesStart) + servicesGrid + html.substring(servicesEnd);
  }
}

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Fixed index.html encodings');
