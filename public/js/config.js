const CONFIG = {
  API_BASE: '/api',
};

const Utils = {
  formatPrice(paise) {
    if (typeof paise !== 'number') return '₹0.00';
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  },

  formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  getImageUrl(path) {
    if (!path) return '/images/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return path.startsWith('/') ? path : `/${path}`;
  },

  debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },
  
  sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

window.CONFIG = CONFIG;
window.Utils = Utils;
