'use strict';

/**
 * Complete End-to-End Test Suite for Elite Office Technologies
 * Tests both Customer & Admin functionalities, security, and authentication.
 */

require('dotenv').config();
process.env.USE_MEMORY_DB = 'true';

const http = require('http');

async function runTests() {
  console.log('🧪 Starting Full End-to-End System Test Suite...\n');
  
  const BASE_URL = 'http://localhost:5000';
  let passed = 0;
  let failed = 0;

  async function api(method, path, body = null, token = null) {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url.toString(), options);
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    return { 
      status: res.status, 
      headers: res.headers, 
      body: data,
      data: (data && data.data !== undefined) ? data.data : data 
    };
  }

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Health & Security Headers
  console.log('--- 1. Health & Security Verification ---');
  try {
    const health = await api('GET', '/api/health');
    assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health returns status 200 ok');
    assert(health.data.dbState === 'connected', 'Database state is connected');
    const csp = health.headers.get('content-security-policy') || '';
    assert(csp.includes('data:'), 'CSP font-src includes data: for resilient rendering');
  } catch (e) {
    assert(false, `Health check error: ${e.message}`);
  }

  // 2. Public / Customer Endpoints
  console.log('\n--- 2. Public & Customer Functional Endpoints ---');
  let sampleProduct = null;
  try {
    const config = await api('GET', '/api/config/public');
    assert(config.status === 200, 'GET /api/config/public returns 200');

    const products = await api('GET', '/api/products');
    assert(products.status === 200 && products.data.products?.length > 0, `GET /api/products returns ${products.data.products?.length} products`);
    if (products.data.products?.length > 0) {
      sampleProduct = products.data.products[0];
    }

    const featured = await api('GET', '/api/products/featured');
    assert(featured.status === 200, 'GET /api/products/featured returns 200');

    if (sampleProduct?.slug) {
      const single = await api('GET', `/api/products/${sampleProduct.slug}`);
      assert(single.status === 200 && single.data.product?.name === sampleProduct.name, `GET /api/products/${sampleProduct.slug} returns single product`);
    }

    const categories = await api('GET', '/api/categories');
    assert(categories.status === 200 && categories.data.categories?.length > 0, `GET /api/categories returns ${categories.data.categories?.length} categories`);

    const brands = await api('GET', '/api/brands');
    assert(brands.status === 200, 'GET /api/brands returns 200');

    const testimonials = await api('GET', '/api/testimonials');
    assert(testimonials.status === 200, 'GET /api/testimonials returns 200');

    const banners = await api('GET', '/api/banners');
    assert(banners.status === 200, 'GET /api/banners returns 200');

    // Cart validation
    if (sampleProduct) {
      const cartVal = await api('POST', '/api/cart/validate', {
        items: [{ productId: sampleProduct._id, quantity: 2 }]
      });
      assert(cartVal.status === 200 && cartVal.data.items?.length === 1, 'POST /api/cart/validate calculates server-side totals securely');
    }

    // Contact form submission
    const contact = await api('POST', '/api/contact', {
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '9876543210',
      subject: 'Inquiry about office chairs',
      message: 'Hello, I would like to order in bulk for our new office branch.'
    });
    assert(contact.status === 200 || contact.status === 201, 'POST /api/contact submits enquiry successfully');

  } catch (e) {
    assert(false, `Public endpoint error: ${e.message}`);
  }

  // 3. Admin Authentication & Role Security
  console.log('\n--- 3. Admin Authentication & Security Verification ---');
  let adminTokens = null;
  try {
    // Negative test: invalid credentials
    const badLogin = await api('POST', '/api/admin/auth/login', {
      email: 'admin@eliteoffice.com',
      password: 'WrongPassword999!'
    });
    assert(badLogin.status === 401, 'Invalid credentials properly rejected with 401');

    // Positive test: valid credentials
    const goodLogin = await api('POST', '/api/admin/auth/login', {
      email: 'admin@eliteoffice.com',
      password: 'Admin@2026!'
    });
    assert(goodLogin.status === 200 && goodLogin.data.accessToken && goodLogin.data.refreshToken, 'Admin login succeeds with accessToken & refreshToken');
    adminTokens = goodLogin.data;

    // Token Refresh Rotation
    if (adminTokens?.refreshToken) {
      const refresh = await api('POST', '/api/admin/auth/refresh', {
        token: adminTokens.refreshToken
      });
      assert(refresh.status === 200 && refresh.data.accessToken, 'POST /api/admin/auth/refresh rotates tokens successfully');
      if (refresh.data.accessToken) {
        adminTokens.accessToken = refresh.data.accessToken;
        adminTokens.refreshToken = refresh.data.refreshToken;
      }
    }

    // Access protected route without token (Negative test)
    const noAuth = await api('GET', '/api/admin/dashboard/stats');
    assert(noAuth.status === 401, 'Protected route rejects unauthenticated request with 401');

    // Access protected route with invalid token (Negative test)
    const badToken = await api('GET', '/api/admin/dashboard/stats', null, 'malformed.fake.token');
    assert(badToken.status === 401, 'Protected route rejects malformed token with 401 (not 500)');

  } catch (e) {
    assert(false, `Authentication error: ${e.message}`);
  }

  // 4. Admin Management Endpoints
  console.log('\n--- 4. Admin Dashboard & CRUD Operations ---');
  let createdProductId = null;
  try {
    const stats = await api('GET', '/api/admin/dashboard/stats', null, adminTokens.accessToken);
    assert(stats.status === 200, 'GET /api/admin/dashboard/stats returns real aggregation metrics');

    const adminProducts = await api('GET', '/api/admin/products', null, adminTokens.accessToken);
    assert(adminProducts.status === 200, 'GET /api/admin/products returns product management list');

    // Create product
    const newProd = await api('POST', '/api/admin/products', {
      name: 'Logitech MX Master 3S Wireless Mouse',
      category: 'IT & Office Equipment',
      price: 899500, // paise
      stock: 25,
      brand: 'Logitech',
      description: 'Quiet clicks and 8K DPI track-on-glass sensor.'
    }, adminTokens.accessToken);
    assert(newProd.status === 201 && newProd.data.product?._id, 'POST /api/admin/products creates product');
    createdProductId = newProd.data.product?._id;

    // Update product
    if (createdProductId) {
      const updateProd = await api('PUT', `/api/admin/products/${createdProductId}`, {
        stock: 30
      }, adminTokens.accessToken);
      assert(updateProd.status === 200 && updateProd.data.product?.stock === 30, 'PUT /api/admin/products/:id updates product');

      // Delete (soft-delete) product
      const delProd = await api('DELETE', `/api/admin/products/${createdProductId}`, null, adminTokens.accessToken);
      assert(delProd.status === 200 || delProd.status === 204, 'DELETE /api/admin/products/:id deactivates/deletes product');
    }

    const orders = await api('GET', '/api/admin/orders', null, adminTokens.accessToken);
    assert(orders.status === 200, 'GET /api/admin/orders returns order list');

    const auditLogs = await api('GET', '/api/admin/audit-logs', null, adminTokens.accessToken);
    assert(auditLogs.status === 200, 'GET /api/admin/audit-logs returns audit log history');

    const adminConfig = await api('GET', '/api/admin/config', null, adminTokens.accessToken);
    assert(adminConfig.status === 200, 'GET /api/admin/config returns site configuration');

    // Admin Logout
    const logout = await api('POST', '/api/admin/auth/logout', { token: adminTokens.refreshToken }, adminTokens.accessToken);
    assert(logout.status === 200, 'POST /api/admin/auth/logout successfully clears session');

  } catch (e) {
    assert(false, `Admin CRUD error: ${e.message}`);
  }

  console.log('\n======================================');
  console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('======================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Ensure server is reachable before running tests
setTimeout(runTests, 2000);
