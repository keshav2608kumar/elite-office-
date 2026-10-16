function initToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info') {
  const container = initToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const textNode = document.createTextNode(message);
  const textSpan = document.createElement('span');
  textSpan.appendChild(textNode);
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.innerHTML = '&times;'; // safe here, it's just a static HTML entity
  closeBtn.onclick = () => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 300);
  };
  
  toast.appendChild(textSpan);
  toast.appendChild(closeBtn);
  
  container.appendChild(toast);
  
  // Trigger reflow
  void toast.offsetWidth;
  
  toast.classList.add('show');
  
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => {
        if(document.body.contains(toast)) toast.remove();
      }, 300);
    }
  }, 4000);
}

window.showToast = showToast;
