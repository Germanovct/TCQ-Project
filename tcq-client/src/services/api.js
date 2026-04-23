class ApiClient {
  constructor() {
    // Si existe la variable VITE_API_URL (en Vercel), la usa. Si no, asume que está en local.
    const host = window.location.hostname;
    this.baseURL = import.meta.env.VITE_API_URL || `http://${host}:8000/api/v1`;
    this.token = localStorage.getItem('tcq_client_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('tcq_client_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('tcq_client_token');
    localStorage.removeItem('tcq_client_user');
  }

  async request(method, endpoint, data = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const config = { method, headers };
    if (data) config.body = JSON.stringify(data);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const json = await response.json();
      if (!response.ok) throw json;
      return json;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  register(data) { return this.request('POST', '/auth/register', data); }
  login(email, password) { return this.request('POST', '/auth/login', { email, password }); }
  getMe() { return this.request('GET', '/auth/me'); }
  getBalance() { return this.request('GET', '/auth/balance'); }
}

export default new ApiClient();
