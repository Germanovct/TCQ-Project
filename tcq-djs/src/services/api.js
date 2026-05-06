import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? 'http://localhost:8000/api/v1' : 'https://tcq-project.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  // DJ Events API
  djRegister: async (data) => {
    const res = await api.post('/dj/register', data);
    return res.data;
  },
  djScanQR: async (qrCode) => {
    const res = await api.get(`/dj/scan/${qrCode}`);
    return res.data;
  },
  djRedeemDrink: async (qrCode, drinkType) => {
    const res = await api.post(`/dj/redeem/${qrCode}`, { drink_type: drinkType });
    return res.data;
  },
  djListRegistrations: async () => {
    const res = await api.get('/dj/registrations');
    return res.data;
  },
};
