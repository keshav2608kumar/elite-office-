const AdminAuth = {
    accessToken: null,
    refreshToken: localStorage.getItem('admin_refresh_token'),
    adminInfo: null,
    refreshTimer: null,
  
    async login(email, password) {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message || 'Login failed');
      
      this.accessToken = responseData.data.accessToken;
      this.refreshToken = responseData.data.refreshToken;
      localStorage.setItem('admin_refresh_token', this.refreshToken);
      this.setupAutoRefresh(this.accessToken);
      return responseData.data;
    },
  
    async refresh() {
      if (!this.refreshToken) throw new Error('No refresh token');
      const res = await fetch('/api/admin/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.refreshToken })
      });
      const responseData = await res.json();
      if (!res.ok) {
        this.clear();
        throw new Error('Session expired');
      }
      
      this.accessToken = responseData.data.accessToken;
      this.refreshToken = responseData.data.refreshToken;
      localStorage.setItem('admin_refresh_token', this.refreshToken);
      this.setupAutoRefresh(this.accessToken);
    },
  
    async logout() {
      if (this.refreshToken) {
        try {
          await fetch('/api/admin/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: this.refreshToken })
          });
        } catch(e) {}
      }
      this.clear();
      window.location.href = '/admin/index.html';
    },
  
    clear() {
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('admin_refresh_token');
      if (this.refreshTimer) clearTimeout(this.refreshTimer);
    },
  
    getToken() {
      return this.accessToken;
    },
  
    isAuthenticated() {
      return !!this.accessToken;
    },
  
    async init() {
      if (this.refreshToken && !this.accessToken) {
        try {
          await this.refresh();
        } catch (e) {
          window.location.href = '/admin/index.html';
        }
      } else if (!this.accessToken) {
        window.location.href = '/admin/index.html';
      }
    },
  
    setupAutoRefresh(token) {
      if (this.refreshTimer) clearTimeout(this.refreshTimer);
      try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp * 1000;
          const now = Date.now();
          const timeUntilRefresh = Math.max(0, exp - now - 60000);
          this.refreshTimer = setTimeout(() => this.refresh(), timeUntilRefresh);
      } catch(e) {}
    }
  };
  
  const adminApi = {
    async fetchWithAuth(url, options = {}) {
      if (!options.headers) options.headers = {};
      if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
      } else {
          delete options.headers['Content-Type'];
      }
      
      if (AdminAuth.getToken()) {
        options.headers['Authorization'] = `Bearer ${AdminAuth.getToken()}`;
      }
  
      let res = await fetch(url, options);
      
      if (res.status === 401 && AdminAuth.refreshToken) {
        try {
          await AdminAuth.refresh();
          options.headers['Authorization'] = `Bearer ${AdminAuth.getToken()}`;
          res = await fetch(url, options);
        } catch (e) {
          AdminAuth.logout();
          throw new Error('Session expired. Please login again.');
        }
      }
  
      if (!res.ok) {
          let errStr = 'API Error';
          try {
              const errData = await res.json();
              errStr = errData.message || errStr;
          } catch(e) {}
          throw new Error(errStr);
      }
  
      const json = await res.json();
      if (json.status === 'success' && json.data !== undefined) {
          return json.data;
      }
      return json;
    },
  
    get(url) { return this.fetchWithAuth(url, { method: 'GET' }); },
    post(url, body) { 
        return this.fetchWithAuth(url, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }); 
    },
    put(url, body) { 
        return this.fetchWithAuth(url, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }); 
    },
    delete(url) { return this.fetchWithAuth(url, { method: 'DELETE' }); }
  };
  
  window.AdminAuth = AdminAuth;
  window.adminApi = adminApi;
  
  // Safe generic toast wrapper
  window.notify = function(msg, type='info') {
      if(window.showToast) {
          window.showToast(msg, type);
      } else {
          console.log(`[${type.toUpperCase()}] ${msg}`);
      }
  };
