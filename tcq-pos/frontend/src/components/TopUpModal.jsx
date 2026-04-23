import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

import { Scanner } from '@yudiel/react-qr-scanner';

export default function TopUpModal({ onClose, toast }) {
  const [step, setStep] = useState('scan'); // 'scan', 'camera', or 'topup'
  const [user, setUser] = useState(null);
  const [qrCode, setQrCode] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  
  const qrInputRef = useRef(null);

  // Autofocus input on load
  useEffect(() => {
    if (step === 'scan' && qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [step]);

  const fetchUser = async (code) => {
    setLoading(true);
    try {
      const res = await api.scanUserQR(code);
      setUser(res.user);
      setStep('topup');
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'Usuario no encontrado', 'error');
      setQrCode('');
      setStep('scan');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;
    await fetchUser(qrCode.trim());
  };

  const handleCameraResult = async (result) => {
    if (result && result[0] && result[0].rawValue) {
      setStep('scan'); // Close camera view immediately
      await fetchUser(result[0].rawValue);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    
    setLoading(true);
    try {
      const res = await api.topUpUser(user.id, val, method);
      toast(`✅ Saldo cargado. Nuevo saldo: $${res.tcq_balance.toLocaleString('es-AR')}`);
      onClose();
    } catch (err) {
      toast('Error al cargar saldo', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Cargar Saldo a Cliente</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        {step === 'scan' ? (
          <form onSubmit={handleScanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => setStep('camera')}
              style={{ fontSize: '1.1rem', padding: '1rem' }}
            >
              📷 Escanear Código QR
            </button>
            <div style={{ textAlign: 'center', margin: '0.5rem 0', color: 'var(--text-muted)' }}>O ingreso manual:</div>
            <input
              ref={qrInputRef}
              type="text"
              className="form-input"
              placeholder="Código QR..."
              value={qrCode}
              onChange={e => setQrCode(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-ghost" disabled={loading || !qrCode.trim()}>
              {loading ? 'Buscando...' : 'Buscar Manualmente'}
            </button>
          </form>
        ) : step === 'camera' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '350px', borderRadius: '12px', overflow: 'hidden' }}>
              <Scanner 
                onScan={handleCameraResult} 
                components={{ audio: false, finder: true }}
              />
            </div>
            <button className="btn btn-danger" onClick={() => setStep('scan')}>
              Cancelar Cámara
            </button>
          </div>
        ) : (
          <form onSubmit={handleTopUp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cliente Encontrado</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{user.full_name}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--brand-primary-light)' }}>
                Saldo actual: ${user.tcq_balance.toLocaleString('es-AR')}
              </div>
            </div>

            <div className="form-group">
              <label>Monto a cargar ($)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej. 5000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                step="100"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Método de Pago</label>
              <select className="form-input" value={method} onChange={e => setMethod(e.target.value)} disabled={loading}>
                <option value="CASH">Efectivo</option>
                <option value="TRANSFER">Transferencia / Mercado Pago</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setStep('scan'); setQrCode(''); setUser(null); }} style={{ flex: 1 }}>
                ← Atrás
              </button>
              <button type="submit" className="btn btn-success" disabled={loading || !amount} style={{ flex: 2 }}>
                {loading ? 'Cargando...' : 'Confirmar Carga'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
