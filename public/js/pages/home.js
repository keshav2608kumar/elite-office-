document.addEventListener('DOMContentLoaded', () => {
  loadBanners();
  loadFeaturedProducts();
  loadTestimonials();
  loadBrands();
});

async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products');
  try {
    const res = await window.api.get('/products?limit=8&sort=-createdAt');
    const products = res.data?.products || [];
    container.innerHTML = '';
    
    if (products.length === 0) {
      container.innerHTML = '<div style="text-align:center; grid-column: 1/-1;">No products available at the moment.</div>';
      return;
    }

    products.forEach(product => {
      const card = window.createProductCard(product);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load featured products', error);
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
        <p style="color: var(--error); margin-bottom: 1rem;">Unable to load products. Please try again.</p>
        <button class="btn btn-primary" onclick="loadFeaturedProducts()">Retry</button>
      </div>`;
  }
}

async function loadTestimonials() {
  const container = document.getElementById('testimonials-grid');
  if (!container) return;
  try {
    const res = await window.api.get('/testimonials');
    const testimonials = res.data?.testimonials || [];
    container.innerHTML = '';
    
    testimonials.forEach(t => {
      const stars = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
      const card = document.createElement('div');
      card.className = 'testimonial-card';
      card.innerHTML = `
        <div class="testimonial-stars">${stars}</div>
        <p class="testimonial-quote">"${Utils.sanitizeText(t.content)}"</p>
        <div class="testimonial-author">${Utils.sanitizeText(t.name)}</div>
        ${t.company ? `<div class="testimonial-company">${Utils.sanitizeText(t.company)}</div>` : ''}
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load testimonials', error);
  }
}

async function loadBrands() {
  const marquee = document.getElementById('brand-marquee');
  if (!marquee) return;
  
  const defaultBrands = ['HP', 'Canon', 'Epson', 'Dell', 'Logitech', 'Asus', 'Parker'];
  
  try {
    const res = await window.api.get('/brands');
    const brands = res.data?.brands || [];
    if (brands.length > 0) {
      marquee.innerHTML = '';
      const items = [...brands, ...brands]; // double for seamless loop
      items.forEach(brand => {
        const span = document.createElement('span');
        span.className = 'marquee-item';
        span.textContent = brand.name;
        marquee.appendChild(span);
      });
    }
  } catch (error) {
    console.error('Failed to load brands', error);
  }
}

async function loadBanners() {
  try {
    const res = await window.api.get("/banners");
    const banners = res.data?.banners || [];
    if (banners.length > 0) {
      renderSlider(banners);
    }
  } catch (err) {
    console.error("Failed to load banners", err);
  }
}

function renderSlider(banners) {
  const wrapper = document.getElementById("hero-slider-container");
  if (!wrapper) return;
  
  wrapper.innerHTML = "";
  const container = document.createElement("div");
  container.className = "hero-slider-container";
  
  banners.forEach((banner, index) => {
    const slide = document.createElement("div");
    slide.className = "hero hero-slide";
    
    // Preload image with fallback
    const imgUrl = window.Utils?.getImageUrl(banner.image) || banner.image;
    const fallbackUrl = '/images/placeholder.jpg'; // Reliable local fallback
    const img = new Image();
    img.onload = () => {
        slide.style.backgroundImage = `url('${imgUrl}')`;
    };
    img.onerror = () => {
        console.error('Banner image failed to load, using fallback:', imgUrl);
        slide.style.backgroundImage = `url('${fallbackUrl}')`;
    };
    img.src = imgUrl;
    
    // Initial fallback while loading
    slide.style.backgroundColor = '#0f3f6d';
    
    slide.innerHTML = `
      <div class="hero__pattern"></div>
      <div class="container hero__content">
        <h1 class="hero__title">${window.Utils?.sanitizeText(banner.title)}</h1>
        ${banner.subtitle ? `<p class="hero__subtitle">${window.Utils?.sanitizeText(banner.subtitle)}</p>` : ""}
        <div class="hero__actions">
          <a href="${banner.ctaLink || "/products.html"}" class="btn btn-secondary">${banner.ctaText || "Shop Now"}</a>
        </div>
      </div>
    `;
    container.appendChild(slide);
  });
  
  wrapper.appendChild(container);
  
  // Controls
  // Make slideInterval global to this file to prevent any overlap
  if (window._heroSlideInterval) {
      clearInterval(window._heroSlideInterval);
  }
  
  if (banners.length > 1) {
    const controls = document.createElement("div");
    controls.className = "slider-controls";
    banners.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = `slider-dot ${i === 0 ? "active" : ""}`;
      dot.onclick = () => goToSlide(i, true);
      controls.appendChild(dot);
    });
    wrapper.appendChild(controls);
    
    const prevBtn = document.createElement("button");
    prevBtn.className = "slider-arrow prev";
    prevBtn.innerHTML = "❮";
    prevBtn.onclick = () => goToSlide(currentSlide - 1, true);
    
    const nextBtn = document.createElement("button");
    nextBtn.className = "slider-arrow next";
    nextBtn.innerHTML = "❯";
    nextBtn.onclick = () => goToSlide(currentSlide + 1, true);
    
    wrapper.appendChild(prevBtn);
    wrapper.appendChild(nextBtn);
    
    startSlide();
  }
  
  function startSlide() {
    if (window._heroSlideInterval) clearInterval(window._heroSlideInterval);
    window._heroSlideInterval = setInterval(() => {
      // Use document.hidden to prevent background tab interval buildup
      if (!document.hidden) {
          goToSlide(currentSlide + 1, false);
      }
    }, 5000);
  }
  
  let currentSlide = 0;
  function goToSlide(index, manual = false) {
    if (index < 0) index = banners.length - 1;
    if (index >= banners.length) index = 0;
    currentSlide = index;
    // Use translate3d for GPU acceleration to prevent rendering glitches
    container.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    
    document.querySelectorAll(".slider-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
    
    if (manual && banners.length > 1) {
      startSlide();
    }
  }
}
