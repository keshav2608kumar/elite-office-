function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  // Image
  const imgLink = document.createElement('a');
  imgLink.href = `/product.html?slug=${product.slug}`;
  imgLink.style.display = 'block';
  imgLink.style.overflow = 'hidden';
  
  const img = document.createElement('img');
  img.className = 'product-card__image';
  img.src = window.Utils.getImageUrl(product.thumbnail || product.images?.[0]);
  img.alt = product.name;
  img.loading = 'lazy';
  img.onerror = function() { 
    this.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#f3f4f6" width="200" height="200"/><text fill="#9ca3af" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text></svg>');
  };
  
  imgLink.appendChild(img);
  card.appendChild(imgLink);

  // Info area
  const info = document.createElement('div');
  info.className = 'product-card__info';

  // Category badge
  if (product.category) {
    const catName = typeof product.category === 'string' ? product.category : product.category.name;
    if (catName) {
      const catBadge = document.createElement('div');
      catBadge.className = 'product-card__category';
      catBadge.textContent = catName;
      info.appendChild(catBadge);
    }
  }

  // Title
  const titleLink = document.createElement('a');
  titleLink.href = `/product.html?slug=${product.slug}`;
  const title = document.createElement('h3');
  title.className = 'product-card__name';
  title.textContent = product.name;
  titleLink.appendChild(title);
  info.appendChild(titleLink);

  // Price
  const priceWrap = document.createElement('div');
  priceWrap.style.display = 'flex';
  priceWrap.style.alignItems = 'baseline';
  priceWrap.style.gap = '8px';
  priceWrap.style.marginTop = 'auto';
  
  const price = document.createElement('span');
  price.className = 'product-card__price';
  price.textContent = window.Utils.formatPrice(product.price);
  priceWrap.appendChild(price);

  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    const comparePrice = document.createElement('span');
    comparePrice.className = 'product-card__original-price';
    comparePrice.textContent = window.Utils.formatPrice(product.compareAtPrice);
    priceWrap.appendChild(comparePrice);
  }

  info.appendChild(priceWrap);

  // Add to Cart button
  const actions = document.createElement('div');
  actions.className = 'product-card__actions';
  
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary btn-block';
  
  if (product.stock <= 0) {
    btn.textContent = 'Out of Stock';
    btn.disabled = true;
  } else {
    btn.textContent = '🛒 Add to Cart';
    btn.onclick = (e) => {
      e.preventDefault();
      if (window.CartManager) {
        window.CartManager.addItem(product, 1);
      }
    };
  }
  
  actions.appendChild(btn);
  info.appendChild(actions);

  card.appendChild(info);
  return card;
}

window.createProductCard = createProductCard;
