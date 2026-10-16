const api = {
  async request(endpoint, options = {}) {
    const url = `${window.CONFIG.API_BASE}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = typeof window !== 'undefined' && window.adminToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/index.html';
        }
        throw new Error('Unauthorized');
      }

      if (response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error((data && data.message) || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

window.api = api;
