/**
 * TCQ POS — API Service
 * Centralized HTTP client for backend communication.
 * Auto-detects backend URL based on current hostname.
 */

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://tcq-project.onrender.com/api/v1';
    this.token = localStorage.getItem('tcq_token') || null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('tcq_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('tcq_token');
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${this.baseURL}${path}`, config);
    const data = await res.json();
    if (!res.ok) throw { status: res.status, detail: data.detail || 'Error' };
    return data;
  }

  // Auth
  login(email, password) { return this.request('POST', '/auth/login', { email, password }); }
  register(data) { return this.request('POST', '/auth/register', data); }
  scanQR(qrCode) { return this.request('POST', `/auth/scan-qr/${qrCode}`); }
  getMe() { return this.request('GET', '/auth/me'); }
  topUpUser(userId, amount, method = 'CASH') { return this.request('POST', `/auth/users/${userId}/topup`, { amount, method }); }

  // Products
  getProducts(category = null) {
    const q = category ? `?category=${category}` : '';
    return this.request('GET', `/products/${q}`);
  }
  createProduct(data) { return this.request('POST', '/products/', data); }
  updateProduct(id, data) { return this.request('PUT', `/products/${id}`, data); }
  deleteProduct(id) { return this.request('DELETE', `/products/${id}`); }

  // Terminals
  getTerminals() { return this.request('GET', '/terminals/'); }
  openTerminal(id, initialBalance) { return this.request('POST', `/terminals/${id}/open`, { initial_balance: initialBalance }); }
  closeTerminal(id) { return this.request('POST', `/terminals/${id}/close`); }

  // Orders
  createOrder(data) { return this.request('POST', '/orders/create-order', data); }
  getTerminalOrders(terminalId) { return this.request('GET', `/orders/terminal/${terminalId}`); }

  // Dashboard
  getDailySummary() { return this.request('GET', '/dashboard/summary'); }

  // Barman Management
  createBarman(data) { return this.request('POST', '/auth/create-barman', data); }
  listBarmen() { return this.request('GET', '/auth/barmen'); }
  updateBarman(userId, data) { return this.request('PUT', `/auth/barmen/${userId}`, data); }
  deleteBarman(userId) { return this.request('DELETE', `/auth/barmen/${userId}`); }
}

export const api = new ApiService();
export default api;
