import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

export default function PinModal({ onSuccess, onCancel, itemName, itemPrice, terminalId, operatorId }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.verifyPin(pin, terminalId, itemName, itemPrice, operatorId);
      onSuccess();
    } catch {
      setError('PIN incorrecto');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1500 }} onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '360px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
        <h2 className="modal-title" style={{ marginBottom: '0.5rem' }}>PIN Requerido</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Ingresá el PIN para quitar <strong style={{ color: 'var(--brand-primary-light)' }}>{itemName}</strong>
        </p>
        {error && <div className="login-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            maxLength={6}
            className="login-input"
            placeholder="••••"
            value={pin}
            onChange={e => setPin(e.target.value)}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onCancel} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
            <button type="submit" className="btn btn-success" disabled={loading || !pin} style={{ flex: 1, justifyContent: 'center' }}>
              {loading ? '⏳' : '✅ Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
