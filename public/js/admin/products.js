document.addEventListener('admin:load:products', loadProducts);

async function loadProducts() {
    try {
        const data = await adminApi.get('/api/admin/products');
        renderProducts(data.products || data);
    } catch(e) {
        window.notify('Failed to load products', 'error');
    }
}

function formatCurrency(paise) {
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

function renderProducts(products) {
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        
        const tdImg = document.createElement('td');
        if(p.images && p.images.length > 0) {
            const img = document.createElement('img');
            img.src = p.images[0].url;
            img.style.height = '40px';
            tdImg.appendChild(img);
        }
        
        const tdName = document.createElement('td'); tdName.textContent = p.name;
        const tdCat = document.createElement('td'); tdCat.textContent = p.category ? p.category.name : '';
        const tdPrice = document.createElement('td'); tdPrice.textContent = formatCurrency(p.price || 0);
        const tdStock = document.createElement('td'); tdStock.textContent = p.stock || 0;
        
        const tdStatus = document.createElement('td');
        tdStatus.textContent = p.isActive ? 'Active' : 'Inactive';
        
        const tdAction = document.createElement('td');
        const btnEdit = document.createElement('button');
        btnEdit.textContent = 'Edit';
        btnEdit.className = 'btn btn-secondary btn-sm';
        btnEdit.style.marginRight = '8px';
        btnEdit.onclick = () => window.editProduct(p._id);
        
        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'Delete';
        btnDelete.className = 'btn btn-danger btn-sm';
        btnDelete.onclick = () => deleteProduct(p._id);
        tdAction.append(btnEdit, btnDelete);
        
        tr.append(tdImg, tdName, tdCat, tdPrice, tdStock, tdStatus, tdAction);
        tbody.appendChild(tr);
    });
}

async function deleteProduct(id) {
    if(!confirm('Are you sure?')) return;
    try {
        await adminApi.delete(`/api/admin/products/${id}`);
        window.notify('Deleted successfully', 'success');
        loadProducts();
    } catch(e) {
        window.notify(e.message, 'error');
    }
}

// Bulk Import Logic
document.addEventListener("DOMContentLoaded", () => {
  const btnBulkImport = document.getElementById("btn-bulk-import");
  const modalImport = document.getElementById("modal-import");
  const formImport = document.getElementById("form-import");
  const resultsDiv = document.getElementById("import-results");
  
  if (btnBulkImport && modalImport) {
    btnBulkImport.addEventListener("click", () => {
      modalImport.classList.add("active");
      resultsDiv.style.display = "none";
      formImport.reset();
    });
    
    modalImport.querySelector(".close-modal").addEventListener("click", () => {
      modalImport.classList.remove("active");
      loadProducts(); // Refresh list on close
    });
  }
  
  if (formImport) {
    formImport.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("btn-submit-import");
      btn.disabled = true;
      btn.textContent = "Importing...";
      
      const formData = new FormData();
      formData.append("file", document.getElementById("import-file").files[0]);
      
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch("/api/admin/products/import", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        
        const resData = await res.json();
        
        if (res.ok && resData.status === "success") {
          resultsDiv.style.display = "block";
          document.getElementById("import-success-count").textContent = resData.data.imported || 0;
          document.getElementById("import-update-count").textContent = resData.data.updated || 0;
          document.getElementById("import-fail-count").textContent = resData.data.failed || 0;
          
          const ul = document.getElementById("import-errors-list");
          ul.innerHTML = "";
          if (resData.data.errors && resData.data.errors.length > 0) {
            resData.data.errors.forEach(err => {
              const li = document.createElement("li");
              li.textContent = err;
              ul.appendChild(li);
            });
          }
          
          window.showToast?.("Import processed", "success");
        } else {
          window.showToast?.(resData.message || "Failed to import products", "error");
        }
      } catch (err) {
        window.showToast?.("An error occurred during import.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Import Products";
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const modalProduct = document.getElementById('modal-product');
    const formProduct = document.getElementById('form-product');
    const btnCreateProduct = document.getElementById('btn-create-product');
    const closeProductModal = document.getElementById('close-product-modal');
    
    if (btnCreateProduct && modalProduct) {
        btnCreateProduct.addEventListener('click', () => {
            formProduct.reset();
            document.getElementById('product-id').value = '';
            document.getElementById('modal-product-title').textContent = 'Add Product';
            modalProduct.classList.add('active');
        });
        
        closeProductModal.addEventListener('click', () => {
            modalProduct.classList.remove('active');
        });
        
        formProduct.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const id = document.getElementById('product-id').value;
            const imagesVal = document.getElementById('product-images').value;
            const images = imagesVal ? imagesVal.split(',').map(s => s.trim()).filter(Boolean) : [];
            
            const payload = {
                name: document.getElementById('product-name').value,
                sku: document.getElementById('product-sku').value,
                category: document.getElementById('product-category').value,
                price: parseFloat(document.getElementById('product-price').value) * 100, // convert to paise
                stock: parseInt(document.getElementById('product-stock').value, 10),
                shortDescription: document.getElementById('product-short-desc').value,
                description: document.getElementById('product-desc').value,
                images: images,
                isActive: document.getElementById('product-active').checked
            };
            
            try {
                if (id) {
                    await adminApi.put(/api/admin/products/ + id, payload);
                    window.showToast?.('Product updated', 'success');
                } else {
                    await adminApi.post('/api/admin/products', payload);
                    window.showToast?.('Product created', 'success');
                }
                modalProduct.classList.remove('active');
                loadProducts();
            } catch (err) {
                window.showToast?.(err.message || 'Error saving product', 'error');
            }
        });
    }
});

window.editProduct = async function(id) {
    try {
        const data = await adminApi.get(/api/admin/products/ + id);
        const p = data.product || data;
        
        document.getElementById('product-id').value = p._id;
        document.getElementById('product-name').value = p.name || '';
        document.getElementById('product-sku').value = p.sku || '';
        
        // Handle category string vs object
        let catName = p.category;
        if (p.category && typeof p.category === 'object') {
            catName = p.category.name;
        }
        const catSelect = document.getElementById('product-category');
        if (catName) {
            Array.from(catSelect.options).forEach(opt => {
                if (opt.value === catName) opt.selected = true;
            });
        }
        
        document.getElementById('product-price').value = p.price ? (p.price / 100).toFixed(2) : 0;
        document.getElementById('product-stock').value = p.stock || 0;
        document.getElementById('product-short-desc').value = p.shortDescription || '';
        document.getElementById('product-desc').value = p.description || '';
        
        let imgArr = [];
        if (p.images && p.images.length > 0) {
            imgArr = p.images.map(img => img.url || img);
        }
        document.getElementById('product-images').value = imgArr.join(', ');
        document.getElementById('product-active').checked = p.isActive !== false;
        
        document.getElementById('modal-product-title').textContent = 'Edit Product';
        document.getElementById('modal-product').classList.add('active');
    } catch(e) {
        window.showToast?.('Failed to load product details', 'error');
    }
}
