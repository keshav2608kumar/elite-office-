let currentProduct = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  
  if (slug) {
    fetchProduct(slug);
  } else {
    showError();
  }
});

async function fetchProduct(slug) {
  try {
    const res = await window.api.get(`/products/${slug}`);
    const product = res.data?.product || res.data || res;
    currentProduct = product;
    renderProduct(product);
    fetchRelatedProducts(slug);
  } catch (error) {
    console.error(error);
    showError();
  }
}

function showError() {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('error-state').style.display = 'block';
  document.getElementById('product-content').style.display = 'none';
}

function renderProduct(product) {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('product-content').style.display = 'grid';

  // Title
  document.title = `${product.name} | Elite Office`;
  document.getElementById('product-title').textContent = product.name;
  
  // Breadcrumb - category is a string, not an object
  const bcCategory = document.getElementById('bc-category');
  const bcName = document.getElementById('bc-name');
  if (bcCategory) {
    const catName = typeof product.category === 'string' ? product.category : (product.category?.name || '');
    bcCategory.textContent = catName;
  }
  if (bcName) bcName.textContent = product.name;

  // Price
  document.getElementById('product-price').textContent = window.Utils.formatPrice(product.price);
  const comparePriceEl = document.getElementById('compare-price');
  if (comparePriceEl && product.compareAtPrice > product.price) {
    comparePriceEl.textContent = window.Utils.formatPrice(product.compareAtPrice);
    comparePriceEl.style.display = 'inline';
  }

  // Stock
  const badge = document.getElementById('stock-badge');
  if (product.stock > 0) {
    badge.textContent = 'In Stock';
    badge.className = 'badge badge-success';
  } else {
    badge.textContent = 'Out of Stock';
    badge.className = 'badge badge-error';
    document.getElementById('add-to-cart-btn').disabled = true;
    const qtyInput = document.getElementById('qty-input');
    if (qtyInput) qtyInput.disabled = true;
    const qtyPlus = document.getElementById('qty-plus');
    if (qtyPlus) qtyPlus.disabled = true;
    const qtyMinus = document.getElementById('qty-minus');
    if (qtyMinus) qtyMinus.disabled = true;
  }

  // Description
  document.getElementById('product-desc').textContent = product.description || '';

  // Gallery Slider Logic
  const images = product.images && product.images.length > 0 ? product.images : [];
  const mainImg = document.getElementById('main-image');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');
  const indicatorsContainer = document.getElementById('slider-indicators');
  const thumbContainer = document.getElementById('thumbnail-container');
  
  let currentImageIndex = 0;
  let slideInterval;

  function showImage(index) {
    currentImageIndex = index;
    mainImg.src = window.Utils.getImageUrl(images[currentImageIndex] || product.thumbnail);
    
    // Update active states
    document.querySelectorAll('.thumb').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.indicator-dot').forEach((d, i) => {
      d.style.opacity = i === index ? '1' : '0.5';
    });
  }

  function nextImage() {
    if (images.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % images.length;
    showImage(currentImageIndex);
  }

  function prevImage() {
    if (images.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    showImage(currentImageIndex);
  }

  function startSlideshow() {
    if (images.length > 1) {
      slideInterval = setInterval(nextImage, 4000);
    }
  }

  function stopSlideshow() {
    clearInterval(slideInterval);
  }

  mainImg.onerror = function() { 
    this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="#f3f4f6" width="400" height="400"/><text fill="#9ca3af" font-family="sans-serif" font-size="16" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image Available</text></svg>');
  };

  if (thumbContainer) thumbContainer.innerHTML = '';
  indicatorsContainer.innerHTML = '';

  if (images.length > 1) {
    prevBtn.style.display = 'block';
    nextBtn.style.display = 'block';
    
    prevBtn.onclick = () => { stopSlideshow(); prevImage(); startSlideshow(); };
    nextBtn.onclick = () => { stopSlideshow(); nextImage(); startSlideshow(); };
    
    mainImg.addEventListener('mouseenter', stopSlideshow);
    mainImg.addEventListener('mouseleave', startSlideshow);

    images.forEach((img, index) => {
      // Thumbnails
      if (thumbContainer) {
        const thumb = document.createElement('img');
        thumb.src = window.Utils.getImageUrl(img);
        thumb.className = `thumb ${index === 0 ? 'active' : ''}`;
        thumb.onclick = () => {
          stopSlideshow();
          showImage(index);
          startSlideshow();
        };
        thumbContainer.appendChild(thumb);
      }
      
      // Indicators
      const dot = document.createElement('div');
      dot.className = 'indicator-dot';
      dot.style.cssText = `width:10px; height:10px; border-radius:50%; background:#fff; cursor:pointer; opacity:${index === 0 ? '1' : '0.5'}; box-shadow: 0 1px 3px rgba(0,0,0,0.5);`;
      dot.onclick = () => {
        stopSlideshow();
        showImage(index);
        startSlideshow();
      };
      indicatorsContainer.appendChild(dot);
    });

    startSlideshow();
  } else {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }
  
  showImage(0);


  // Specs
  const specsTbody = document.querySelector('#specs-table tbody');
  if (specsTbody) {
    specsTbody.innerHTML = '';
    
    // Brand (could be string or object)
    const brandName = typeof product.brand === 'string' ? product.brand : product.brand?.name;
    if (brandName) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th>Brand</th><td>${Utils.sanitizeText(brandName)}</td>`;
      specsTbody.appendChild(tr);
    }

    // Category
    const catName = typeof product.category === 'string' ? product.category : product.category?.name;
    if (catName) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th>Category</th><td>${Utils.sanitizeText(catName)}</td>`;
      specsTbody.appendChild(tr);
    }

    // SKU
    if (product.sku) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<th>SKU</th><td>${Utils.sanitizeText(product.sku)}</td>`;
      specsTbody.appendChild(tr);
    }
    
    // Specifications map
    if (product.specifications) {
      if (product.specifications instanceof Map || typeof product.specifications === 'object') {
        const specs = product.specifications instanceof Map 
          ? Object.fromEntries(product.specifications) 
          : product.specifications;
        Object.entries(specs).forEach(([key, value]) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<th>${Utils.sanitizeText(key)}</th><td>${Utils.sanitizeText(String(value))}</td>`;
          specsTbody.appendChild(tr);
        });
      }
    }
  }

  // Setup Actions
  setupActions(product);
}

function setupActions(product) {
  const qtyInput = document.getElementById('qty-input');
  
  const qtyPlus = document.getElementById('qty-plus');
  const qtyMinus = document.getElementById('qty-minus');
  
  if (qtyPlus) {
    qtyPlus.onclick = () => {
      let val = parseInt(qtyInput.value);
      if (val < product.stock) qtyInput.value = val + 1;
    };
  }
  
  if (qtyMinus) {
    qtyMinus.onclick = () => {
      let val = parseInt(qtyInput.value);
      if (val > 1) qtyInput.value = val - 1;
    };
  }

  document.getElementById('add-to-cart-btn').onclick = () => {
    if (!window.CartManager) return;
    const qty = parseInt(qtyInput.value);
    window.CartManager.addItem(product, qty);
  };

  const waBtn = document.getElementById('wa-enquiry-btn');
  if (waBtn) {
    waBtn.onclick = () => {
      const link = window.generateWhatsAppLink(product);
      window.open(link, '_blank');
    };
  }
}

async function fetchRelatedProducts(slug) {
  try {
    const res = await window.api.get(`/products/${slug}/related`);
    const related = res.data?.products || [];
    if (related.length > 0) {
      const section = document.getElementById('related-section');
      if (section) section.style.display = 'block';
      const container = document.getElementById('related-products');
      if (container) {
        container.innerHTML = '';
        related.slice(0,4).forEach(prod => {
          container.appendChild(window.createProductCard(prod));
        });
      }
    }
  } catch (error) {
    console.error('Failed to load related products', error);
  }
}

// Enhanced Gallery Controls
function setupGalleryControls(images) {
  if (!images || images.length <= 1) return;
  let currentIndex = 0;
  const mainImg = document.getElementById("main-image");
  const thumbContainer = document.getElementById("thumbnail-container");
  
  // Add arrows overlay to main image container
  const imgContainer = mainImg.parentElement;
  imgContainer.style.position = "relative";
  
  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = "?";
  prevBtn.className = "gallery-arrow prev";
  
  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = "?";
  nextBtn.className = "gallery-arrow next";
  
  imgContainer.appendChild(prevBtn);
  imgContainer.appendChild(nextBtn);
  
  function updateImage(index) {
    currentIndex = index;
    mainImg.src = window.Utils.getImageUrl(images[currentIndex]);
    document.querySelectorAll(".thumb").forEach((t, i) => {
      t.classList.toggle("active", i === currentIndex);
    });
  }
  
  prevBtn.onclick = () => {
    let newIndex = currentIndex - 1;
    if (newIndex < 0) newIndex = images.length - 1;
    updateImage(newIndex);
  };
  
  nextBtn.onclick = () => {
    let newIndex = currentIndex + 1;
    if (newIndex >= images.length) newIndex = 0;
    updateImage(newIndex);
  };
}
