import { useState } from 'react';
import api from '../services/api';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.login(email, password);
      api.setToken(result.access_token);
      onLogin(result.user);
    } catch (err) {
      setError(typeof err.detail === 'string' ? err.detail : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">⚡</div>
        <h1 className="login-title">TCQ POS</h1>
        <p className="login-subtitle">Iniciá sesión para operar</p>

        {error && <div className="login-error">{error}</div>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="login-input"
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="login-input"
          required
          autoComplete="current-password"
        />
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? '⏳ Ingresando...' : '🔐 Ingresar'}
        </button>
      </form>
    </div>
  );
}
