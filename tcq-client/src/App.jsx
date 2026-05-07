import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from './services/api';
import './index.css';

function Toasts({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  
  // App View
  const [activeTab, setActiveTab] = useState('wallet'); // 'wallet', 'tickets'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Modals & PWA
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Show install modal on first visit (if not already installed as PWA)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const alreadySeen = localStorage.getItem('tcq_install_seen');
    if (!isStandalone && !alreadySeen) {
      setTimeout(() => setShowInstallModal(true), 800);
    }
  }, []);

  const dismissInstallModal = () => {
    setShowInstallModal(false);
    localStorage.setItem('tcq_install_seen', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Check Session
  useEffect(() => {
    const checkSession = async () => {
      const savedUser = localStorage.getItem('tcq_client_user');
      const savedToken = localStorage.getItem('tcq_client_token');
      if (savedUser && savedToken) {
        api.setToken(savedToken);
        try {
          const freshUser = await api.getMe();
          setUser(freshUser);
          localStorage.setItem('tcq_client_user', JSON.stringify(freshUser));
        } catch (e) {
          api.clearToken();
        }
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // Sync Balance Periodically
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const bal = await api.getBalance();
        setUser(prev => ({ ...prev, tcq_balance: bal.tcq_balance }));
      } catch (e) { /* ignore */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Load Tickets
  useEffect(() => {
    if (user && activeTab === 'tickets') {
      const loadTickets = async () => {
        try {
          const data = await api.getMyTickets();
          setTickets(data);
        } catch (e) { toast('Error cargando tickets', 'error'); }
      };
      loadTickets();
    }
  }, [user, activeTab, toast]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.login(form.email, form.password);
        api.setToken(res.access_token);
        setUser(res.user);
        localStorage.setItem('tcq_client_user', JSON.stringify(res.user));
        toast('¡Bienvenido de vuelta!');
      } else {
        await api.register(form);
        const res = await api.login(form.email, form.password);
        api.setToken(res.access_token);
        setUser(res.user);
        localStorage.setItem('tcq_client_user', JSON.stringify(res.user));
        toast('¡Cuenta creada con éxito!');
      }
    } catch (err) {
      if (err.detail && Array.isArray(err.detail.errors)) {
        toast(err.detail.errors.join(' | '), 'error');
      } else {
        toast(typeof err.detail === 'string' ? err.detail : 'Error al registrar', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  if (loading) return null;

  return (
    <div className="app-container">
      <Toasts toasts={toasts} />

      {showInstallModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal" style={{ textAlign: 'center' }}>
            <img src="/tcqlogo.jpg" alt="TCQ" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', objectFit: 'cover' }} />
            <h3 className="modal-title" style={{ marginBottom: 'var(--space-sm)' }}>📱 Instalá TCQ Club</h3>
            <p className="modal-text">
              Agregá la app a tu pantalla de inicio para acceder rápido a tu QR y saldo.
            </p>
            
            {isIOS ? (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', textAlign: 'left' }}>
                <p style={{ fontWeight: 700, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>Pasos en iPhone:</p>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  1️⃣ Tocá el botón <strong style={{ color: 'var(--brand-primary-light)' }}>Compartir</strong> (el cuadradito con la flecha ↑ en la barra de abajo)<br/>
                  2️⃣ Deslizá y elegí <strong style={{ color: 'var(--brand-primary-light)' }}>Agregar a Inicio</strong><br/>
                  3️⃣ Tocá <strong style={{ color: 'var(--brand-primary-light)' }}>Agregar</strong>
                </p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)', marginBottom: 'var(--space-md)', textAlign: 'left' }}>
                <p style={{ fontWeight: 700, marginBottom: 'var(--space-sm)', color: 'var(--text-primary)' }}>Pasos en Android:</p>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  1️⃣ Tocá los <strong style={{ color: 'var(--brand-primary-light)' }}>3 puntitos ⋮</strong> del navegador (arriba a la derecha)<br/>
                  2️⃣ Elegí <strong style={{ color: 'var(--brand-primary-light)' }}>Instalar aplicación</strong> o "Agregar a pantalla principal"
                </p>
              </div>
            )}
            
            <button className="btn btn-primary" onClick={dismissInstallModal}>
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
      
      {!user ? (
        <div className="auth-view">
          <div className="brand-header">
            <img src="/tcqlogo.jpg" alt="TCQ Logo" style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-sm)', objectFit: 'cover' }} />
            <p>Tu Billetera Cashless</p>
          </div>
          
          <form className="auth-form" onSubmit={handleAuth}>
            {!isLogin && (
              <input 
                className="input-field" 
                placeholder="Nombre Completo" 
                required 
                value={form.full_name} 
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} 
              />
            )}
            <input 
              className="input-field" 
              type="email" 
              placeholder="Email" 
              required 
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
            />
            <input 
              className="input-field" 
              type="password" 
              placeholder="Contraseña" 
              required 
              value={form.password} 
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
            />
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)' }}>
              {isLogin ? 'Ingresar' : 'Crear Cuenta'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? '¿No tenés cuenta? Registrate' : 'Ya tengo cuenta'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="dash-header">
            <h2>Hola, {user.full_name.split(' ')[0]} 👋</h2>
            <button className="btn btn-ghost" style={{ width: 'auto', padding: '0.5rem' }} onClick={logout}>Salir</button>
          </div>
          
          <div className="balance-card">
            <div className="balance-label">Saldo Disponible</div>
            <div className="balance-amount">${user.tcq_balance.toLocaleString('es-AR')}</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 'var(--space-md)' }}>
            <button 
              className={`btn ${activeTab === 'wallet' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('wallet')}
              style={{ flex: 1 }}
            >
              💳 Mi Saldo
            </button>
            <button 
              className={`btn ${activeTab === 'tickets' ? 'btn-primary' : 'btn-ghost'}`} 
              onClick={() => setActiveTab('tickets')}
              style={{ flex: 1 }}
            >
              🎟️ Mis Entradas
            </button>
          </div>
          
          {activeTab === 'wallet' ? (
            <>
              <div className="qr-section">
                <p style={{ marginBottom: 'var(--space-lg)', color: 'var(--brand-primary-light)', fontWeight: 600 }}>
                  Mostrá este QR en la barra
                </p>
                <div className="qr-wrapper">
                  <QRCodeSVG value={user.qr_code} size={250} />
                </div>
                <p className="qr-instruction">
                  El barman escaneará tu código para descontar el saldo.
                </p>
              </div>

              <div className="actions-grid" style={{ marginTop: 'var(--space-md)' }}>
                <button className="action-btn" onClick={() => setShowLoadModal(true)}>
                  💳 Cargar Saldo
                </button>
              </div>
            </>
          ) : (
            <div className="tickets-section">
              <h3 style={{ marginBottom: 'var(--space-md)' }}>Tus Entradas</h3>
              {tickets.length === 0 ? (
                <div className="banner-card" style={{ textAlign: 'center', display: 'block', padding: '2rem' }}>
                  <p style={{ marginBottom: '1rem' }}>No tenés entradas vigentes.</p>
                  <a href="https://tcqlub.com/events" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Ver Eventos</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      className="banner-card" 
                      style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start' }}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>Ticket #{ticket.qr_code.substring(0, 8)}</h4>
                        <span className="badge" style={{ background: 'var(--success)', color: '#fff' }}>VÁLIDO</span>
                      </div>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>Toca para ver el QR</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="banners-section">
            <a href="https://tcqlub.com/events" target="_blank" rel="noopener noreferrer" className="banner-card">
              <div className="banner-content">
                <h4>🎟️ Próximos Eventos</h4>
                <p>Comprá tus tickets en nuestra web oficial</p>
              </div>
              <span style={{ fontSize: '1.2rem' }}>→</span>
            </a>
            
            <a href="https://instagram.com/tcq.club" target="_blank" rel="noopener noreferrer" className="banner-card">
              <div className="banner-content">
                <h4>📸 Seguinos en Instagram</h4>
                <p>Enterate de todas las novedades</p>
              </div>
              <span style={{ fontSize: '1.2rem' }}>→</span>
            </a>
          </div>

          {/* Ticket QR Modal */}
          {selectedTicket && (
            <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                <h3 className="modal-title">Tu Entrada QR</h3>
                <p className="modal-text" style={{ marginBottom: '1.5rem' }}>
                  Mostrá este código en la puerta del evento.
                </p>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem' }}>
                  <QRCodeSVG value={selectedTicket.qr_code} size={220} />
                </div>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedTicket.qr_code}</p>
                <button className="btn btn-ghost" style={{ marginTop: '1rem' }} onClick={() => setSelectedTicket(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {/* Load Balance Modal */}
          {showLoadModal && (
            <div className="modal-overlay" onClick={() => setShowLoadModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Cargar Saldo TCQ</h3>
                <p className="modal-text">
                  Para cargar saldo sin recargos podés transferir al siguiente alias y mostrar el comprobante en la barra:
                </p>
                <div className="copy-box">
                  TCQ.CLUB.MP
                </div>
                <p className="modal-text" style={{ fontSize: '0.9rem' }}>
                  También podés recargar en efectivo directamente en la caja.
                </p>
                <button className="btn btn-primary" onClick={() => setShowLoadModal(false)}>
                  Entendido
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
