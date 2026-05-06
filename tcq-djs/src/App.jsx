import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, LogOut, Check, X, RefreshCw } from 'lucide-react';
import api from './services/api';
import './index.css';

function Toasts({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // DJ Session
  const [djQR, setDjQR] = useState(() => localStorage.getItem('tcq_dj_qr'));
  const [djData, setDjData] = useState(null);

  // Registration Form
  const [form, setForm] = useState({ 
    dj_name: '', 
    event_name: '', 
    event_date: new Date().toISOString().slice(0, 10), 
    drinks_total: 3 
  });

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Poll DJ status when logged in
  useEffect(() => {
    if (!djQR) return;
    
    const fetchStatus = async () => {
      try {
        const data = await api.djScanQR(djQR);
        setDjData(data);
      } catch (err) {
        if (err.response?.status === 404) {
          handleLogout(); // QR no longer valid
          toast('Tu registro expiró o fue desactivado', 'error');
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [djQR]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, drinks_total: 3 }; // Force 3 drinks
      const result = await api.djRegister(payload);
      localStorage.setItem('tcq_dj_qr', result.qr_code);
      setDjQR(result.qr_code);
      toast('¡Registrado con éxito!');
    } catch (err) {
      toast(err.response?.data?.detail || 'Error registrándote', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tcq_dj_qr');
    setDjQR(null);
    setDjData(null);
  };

  // View: REGISTRATION
  if (!djQR) {
    return (
      <div className="login-screen" style={{ flexDirection: 'column', background: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15), var(--bg-base))' }}>
        <Toasts toasts={toasts} />
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎧</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>TCQ DJs</h1>
          <p style={{ color: 'var(--text-muted)' }}>Portal de Consumiciones</p>
        </div>

        <div className="login-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'white', textAlign: 'center' }}>Registrate para el Evento</h2>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Tu Nombre / AKA</label>
              <input 
                required 
                placeholder="Ej. DJ Alan"
                value={form.dj_name} 
                onChange={e => setForm({...form, dj_name: e.target.value})} 
                style={{ width: '100%', padding: '1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '1rem' }} 
              />
            </div>
            
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Nombre de la Fiesta/Evento</label>
              <input 
                required 
                placeholder="Ej. Bresh"
                value={form.event_name} 
                onChange={e => setForm({...form, event_name: e.target.value})} 
                style={{ width: '100%', padding: '1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'white', fontSize: '1rem' }} 
              />
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--brand-primary-light)', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={16} /> Incluye 3 Consumiciones Libres
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Presentá el código QR en la barra para retirar tus tragos de forma gratuita.
              </p>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ justifyContent: 'center', marginTop: '1rem' }}>
              {loading ? 'Procesando...' : 'Obtener mi QR'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // View: DJ DASHBOARD
  return (
    <div className="app-layout" style={{ flexDirection: 'column' }}>
      <Toasts toasts={toasts} />
      
      {/* Top Header */}
      <div className="topbar" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none', margin: 0 }}>
        <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="logo-icon">🎧</span>
          <h1 style={{ fontSize: '1.2rem' }}>TCQ DJs</h1>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '2rem' }}>
        
        {!djData ? (
          <div style={{ marginTop: '4rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <RefreshCw size={32} className="spinning" />
            Cargando tu perfil...
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'cardEnter 0.4s ease backwards' }}>
            
            {/* Header info */}
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>{djData.dj_name}</h2>
              <p style={{ color: 'var(--brand-primary-light)', fontWeight: 600 }}>{djData.event_name}</p>
            </div>

            {/* Main QR Card */}
            <div style={{ 
              background: 'var(--bg-elevated)', 
              borderRadius: 'var(--radius-xl)', 
              padding: '2rem', 
              border: `2px solid ${djData.drinks_remaining > 0 ? 'var(--brand-primary-light)' : 'var(--danger)'}`,
              boxShadow: djData.drinks_remaining > 0 ? 'var(--shadow-glow)' : '0 0 24px rgba(239,68,68,0.2)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              
              {djData.drinks_remaining > 0 ? (
                <>
                  <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Mostrá este QR en la barra
                  </div>
                  <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block' }}>
                    <QRCodeSVG value={djData.qr_code} size={220} />
                  </div>
                  <div style={{ marginTop: '1rem', fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                    {djData.qr_code}
                  </div>
                </>
              ) : (
                <div style={{ padding: '2rem 1rem' }}>
                  <X size={64} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ color: '#fca5a5', fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.4 }}>
                    NO HAY MÁS CONSUMICIONES DISPONIBLES
                  </h3>
                </div>
              )}
            </div>

            {/* Drinks status */}
            <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                Estado de Consumiciones
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                {Array.from({ length: djData.drinks_total }).map((_, i) => {
                  const used = i < djData.drinks_used;
                  return (
                    <div key={i} style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: used ? 'var(--bg-input)' : 'var(--success-bg)',
                      border: `2px solid ${used ? 'var(--border-subtle)' : 'var(--success)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem',
                      boxShadow: !used ? 'var(--shadow-glow-accent)' : 'none',
                      opacity: used ? 0.5 : 1,
                      transition: 'all 0.3s ease'
                    }}>
                      {used ? <X size={20} color="var(--text-muted)" /> : '🍹'}
                    </div>
                  )
                })}
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: djData.drinks_remaining > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {djData.drinks_remaining} de {djData.drinks_total} Disponibles
              </div>
            </div>

            {/* History */}
            {djData.redemptions?.length > 0 && (
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>
                  Historial de Consumo
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {djData.redemptions.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {r.drink_type === 'trago' ? '🍸 Trago' : r.drink_type === 'sin_alcohol' ? '🥤 Sin Alcohol' : '🥫 Gaseosa'}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {r.redeemed_at ? new Date(r.redeemed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <style>{`
        @keyframes spinning {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning { animation: spinning 2s linear infinite; }
      `}</style>
    </div>
  );
}
    </div>
  );
}
