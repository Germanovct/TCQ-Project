/**
 * TCQ POS — API Service
 * Centralized HTTP client for backend communication.
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
  openTerminal(id, initialBalance, shiftLabel = 'General') {
    return this.request('POST', `/terminals/${id}/open`, { initial_balance: initialBalance, shift_label: shiftLabel });
  }
  closeTerminal(id) { return this.request('POST', `/terminals/${id}/close`); }
  forceCloseTerminal(id) { return this.request('POST', `/terminals/${id}/force-close`); }
  getTerminalShifts(id) { return this.request('GET', `/terminals/${id}/shifts`); }
  getAllLiveRegisters() { return this.request('GET', '/terminals/all-live'); }
  verifyPin(pin, terminalId = null, itemName = null, itemPrice = null, operatorId = null) { 
    return this.request('POST', '/terminals/verify-pin', { 
      pin, terminal_id: terminalId, item_name: itemName, item_price: itemPrice, operator_id: operatorId 
    }); 
  }

  // Orders
  createOrder(data) { return this.request('POST', '/orders/create-order', data); }
  async generateFiscalTicket(transactionId) {
    return this.request('POST', `/orders/${transactionId}/fiscal-ticket`);
  }

  async getReceipt(transactionId) {
    const res = await fetch(`${this.baseURL}/orders/${transactionId}/receipt`);
    if (!res.ok) throw new Error('Receipt not found');
    return res.json();
  }
  getTerminalOrders(terminalId) { return this.request('GET', `/orders/terminal/${terminalId}`); }

  // Dashboard
  getDailySummary() { return this.request('GET', '/dashboard/summary'); }
  getShiftReport(shiftId) { return this.request('GET', `/dashboard/shift-report/${shiftId}`); }

  // Barman Management
  createBarman(data) { return this.request('POST', '/auth/create-barman', data); }
  listBarmen() { return this.request('GET', '/auth/barmen'); }
  updateBarman(userId, data) { return this.request('PUT', `/auth/barmen/${userId}`, data); }
  deleteBarman(userId) { return this.request('DELETE', `/auth/barmen/${userId}`); }
  // DJ Events
  djRegister(data) { return this.request('POST', '/dj/register', data); }
  djScanQR(qrCode) { return this.request('GET', `/dj/scan/${qrCode}`); }
  djRedeemDrink(qrCode, drinkType, servedBy = null) { return this.request('POST', `/dj/redeem/${qrCode}`, { drink_type: drinkType, served_by: servedBy }); }
  djListRegistrations(eventDate = null) { 
    const q = eventDate ? `?event_date=${eventDate}` : '';
    return this.request('GET', `/dj/registrations${q}`); 
  }
  djDeactivate(id) { return this.request('DELETE', `/dj/${id}`); }
  
  // Events
  getEvents() { return this.request('GET', '/events'); }
  getEventStats(eventId) { return this.request('GET', `/events/${eventId}/stats`); }
  getEventAttendees(eventId) { return this.request('GET', `/events/${eventId}/attendees`); }
  createEvent(data) { return this.request('POST', '/events', data); }
  deleteEvent(eventId) { return this.request('DELETE', `/events/${eventId}`); }
  async uploadFlyer(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseURL}/events/upload-flyer`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });
    return res.json();
  }
  createTicketType(eventId, data) { return this.request('POST', `/events/${eventId}/ticket-types`, data); }
  updateTicketType(ttId, data) { return this.request('PUT', `/events/ticket-types/${ttId}`, data); }
  
  // Tickets Validation
  validateTicket(qrCode) { return this.request('POST', '/tickets/validate', { qr_code: qrCode }); }
}

export const api = new ApiService();
export default api;
