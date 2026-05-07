import { useState, useEffect, useCallback } from 'react';
import api from './services/api';
import LoginScreen from './components/LoginScreen';
import TeamManager from './components/TeamManager';
import ProductManager from './components/ProductManager';
import TopUpModal from './components/TopUpModal';
import PinModal from './components/PinModal';
import TicketModal from './components/TicketModal';
import LiveClock from './components/LiveClock';
import DJPortal from './components/DJPortal';
import EventManager from './components/EventManager';
import { useWebSocket } from './hooks/useWebSocket';
import { QRCodeSVG } from 'qrcode.react';
import PublicTicket from './components/PublicTicket';
import './index.css';

/* ─── Toast System ─── */
function Toasts({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

/* ─── Top Bar ─── */
function TopBar({ terminal, dailyTotal, onOpenRegister, onCloseRegister, onShowReport, user, onShowTeam, onShowProducts, onShowTopUp, onLogout, wsConnected, onShowLiveRegisters, onShowDJ, onShowEvents }) {
  const isOpen = terminal?.is_open;
  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1><span className="logo-icon">⚡</span> TCQ POS</h1>
        <div className="topbar-status">
          <span className={`status-dot ${isOpen ? 'open' : 'closed'}`} />
          <span style={{ color: isOpen ? 'var(--success)' : 'var(--danger)' }}>
            {isOpen ? `${terminal.name} · Abierta` : 'Caja Cerrada'}
          </span>
          <span className={`ws-indicator ${wsConnected ? 'online' : 'offline'}`} title={wsConnected ? 'Conectado' : 'Desconectado'} />
        </div>
      </div>

      <LiveClock />
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>Facturación</div>
        <div className="topbar-balance">${(dailyTotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}</div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary-light)' }}>🍺 {user?.full_name}</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.role}</div>
      </div>
      <div className="topbar-actions">
        {isOpen && (
          <button className="btn btn-success" onClick={onShowTopUp} style={{ padding: '0.4rem 1rem' }}>
            💳 Cargar Saldo
          </button>
        )}
        {user?.role === 'admin' && (
          <>
            <button className="btn btn-ghost" onClick={onShowProducts}>🍔 Carta</button>
            <button className="btn btn-ghost" onClick={onShowEvents}>🎟️ Eventos</button>
            <button className="btn btn-ghost" onClick={onShowTeam}>👥 Equipo</button>
            <button className="btn btn-ghost" onClick={onShowLiveRegisters}>📦 Cajas</button>
          </>
        )}
        <button className="btn btn-ghost" onClick={onShowReport}>📊 Reporte</button>
        <button className="btn btn-ghost" onClick={onShowDJ}>🎧 DJ</button>
        {!isOpen ? (
          <button className="btn btn-success" onClick={onOpenRegister}>Abrir Caja</button>
        ) : (
          <button className="btn btn-danger" onClick={onCloseRegister}>Cerrar Caja</button>
        )}
        <button className="btn btn-ghost" onClick={onLogout} style={{ fontSize: '0.8rem' }}>Salir</button>
      </div>
    </div>
  );
}

/* ─── Tables View ─── */
function TablesView({ tables, onSelect }) {
  return (
    <div className="tables-grid">
      {Array.from({ length: 4 }, (_, i) => i + 1).map(num => {
        const tableData = tables[num];
        const isOccupied = tableData && tableData.length > 0;
        const total = isOccupied ? tableData.reduce((s, it) => s + it.price * it.qty, 0) : 0;
        return (
          <div key={num} className={`table-card ${isOccupied ? 'occupied' : ''}`} onClick={() => onSelect(num)}>
            <span className="table-num">{num}</span>
            <span className="table-label">{isOccupied ? '' : 'Libre'}</span>
            {isOccupied && <span className="table-amount">${total.toLocaleString('es-AR')}</span>}
          </div>
        );
      })}
      {/* Barra */}
      {(() => {
        const barData = tables['barra'];
        const isOccupied = barData && barData.length > 0;
        const total = isOccupied ? barData.reduce((s, it) => s + it.price * it.qty, 0) : 0;
        return (
          <div className={`table-card barra ${isOccupied ? 'occupied' : ''}`} onClick={() => onSelect('barra')}>
            <span className="table-num" style={{ fontSize: '1.5rem' }}>🍺</span>
            <span className="table-num" style={{ fontSize: '1rem', color: 'var(--brand-primary-light)' }}>BARRA</span>
            {isOccupied ? <span className="table-amount">${total.toLocaleString('es-AR')}</span> : <span className="table-label">Libre</span>}
          </div>
        );
      })()}
    </div>
  );
}

/* ─── Order View (Categories + Products) ─── */
function OrderView({ products, activeCategory, onCategorySelect, onAddToCart }) {
  const categories = [
    { id: 'bebidas', name: 'Bebidas', cls: 'bebidas' },
    { id: 'tragos', name: 'Tragos', cls: 'tragos' },
    { id: 'promos', name: 'Promos', cls: 'promos' },
  ];
  const filtered = activeCategory ? products.filter(p => p.category === activeCategory) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 'var(--space-md)', overflow: 'hidden' }}>
      <div className="categories-row">
        {categories.map(c => (
          <button key={c.id} className={`category-chip ${c.cls} ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => onCategorySelect(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      {!activeCategory ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Seleccioná una categoría para ver productos
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(p => {
            const outOfStock = p.stock <= 0;
            const stockCls = p.stock <= 0 ? 'stock-out' : p.stock <= 5 ? 'stock-low' : 'stock-ok';
            return (
              <div key={p.id} className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}
                onClick={() => !outOfStock && onAddToCart(p)}>
                <span className="product-name">{p.name}</span>
                <span className="product-price">${p.price.toLocaleString('es-AR')}</span>
                <span className={`product-stock ${stockCls}`}>
                  {outOfStock ? 'AGOTADO' : `Stock: ${p.stock}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Cart Panel ─── */
function CartPanel({ activeTable, cart, paymentMethod, onMethodChange, onAdd, onRemove, onClear, onCheckout, loading, mobileOpen, onClose }) {
  const total = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const count = cart.reduce((s, it) => s + it.qty, 0);

  return (
    <div className={`cart-panel ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="cart-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="cart-title">
            {activeTable ? `Mesa ${activeTable === 'barra' ? 'BARRA' : `#${activeTable}`}` : 'Seleccione Mesa'}
          </div>
          {onClose && <button className="btn btn-ghost btn-icon cart-close-mobile" onClick={onClose} style={{ display: 'none' }}>✕</button>}
        </div>
        <div className="cart-subtitle">{count} {count === 1 ? 'ítem' : 'ítems'}</div>
      </div>

      {cart.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <div className="cart-empty-text">Carrito vacío</div>
        </div>
      ) : (
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-meta">${item.price.toLocaleString('es-AR')} c/u · ${(item.price * item.qty).toLocaleString('es-AR')}</div>
              </div>
              <div className="cart-item-qty">
                <button className="qty-btn remove" onClick={() => onRemove(item.id)}>−</button>
                <span className="qty-value">{item.qty}</span>
                <button className="qty-btn" onClick={() => onAdd(item)}>+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cart-footer">
        <div className="cart-total">
          <span className="cart-total-label">Total</span>
          <span className="cart-total-amount">${total.toLocaleString('es-AR')}</span>
        </div>
        <div className="payment-methods">
          {[
            { id: 'CASH', icon: '💵', label: 'Efectivo', cls: 'cash' },
            { id: 'TCQ_BALANCE', icon: '⚡', label: 'Saldo TCQ', cls: 'tcq' },
            { id: 'MERCADO_PAGO', icon: '📱', label: 'MP', cls: 'mp' },
          ].map(m => (
            <button key={m.id} className={`payment-method-btn ${m.cls} ${paymentMethod === m.id ? 'active' : ''}`}
              onClick={() => onMethodChange(m.id)}>
              <span className="pm-icon">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
        <div className="cart-actions">
          <button className="btn btn-success btn-checkout" disabled={cart.length === 0 || loading}
            onClick={onCheckout}>
            {loading ? '⏳ Procesando...' : '✅ Cobrar'}
          </button>
          <button className="btn btn-ghost btn-clear-cart" disabled={cart.length === 0}
            onClick={onClear}>
            Vaciar Carrito
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Report Modal ─── */
function ReportModal({ data, onClose }) {
  if (!data) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">📊 Reporte del Día</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Vendido Hoy</div>
            <div className="stat-value green">${data.total_revenue?.toLocaleString('es-AR')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Transacciones</div>
            <div className="stat-value">{data.transaction_count}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ticket Promedio</div>
            <div className="stat-value">
              ${data.transaction_count > 0 ? Math.round(data.total_revenue / data.transaction_count).toLocaleString('es-AR') : '0'}
            </div>
          </div>
        </div>
        {data.top_products?.length > 0 && (
          <>
            <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>🔥 Top Productos</h3>
            {data.top_products.map((p, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-xs)',
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ color: 'var(--brand-accent)', fontWeight: 700 }}>{p.quantity} uds · ${p.revenue?.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </>
        )}
        {data.revenue_by_method && Object.keys(data.revenue_by_method).length > 0 && (
          <>
            <h3 style={{ margin: 'var(--space-lg) 0 var(--space-md)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>💳 Por Método</h3>
            {Object.entries(data.revenue_by_method).map(([method, amount]) => (
              <div key={method} style={{
                display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-xs)',
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontWeight: 600 }}>{method === 'CASH' ? '💵 Efectivo' : method === 'TCQ_BALANCE' ? '⚡ Saldo TCQ' : '📱 Mercado Pago'}</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>${amount?.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </>
        )}
        {data.register_breakdown && data.register_breakdown.length > 0 && (
          <>
            <h3 style={{ margin: 'var(--space-lg) 0 var(--space-md)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>📦 Por Caja</h3>
            {data.register_breakdown.map(r => (
              <div key={r.terminal_id} style={{
                display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-xs)',
                border: '1px solid var(--border-subtle)',
              }}>
                <span style={{ fontWeight: 600 }}>{r.terminal_name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({r.transaction_count} ventas)</span></span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>${r.total?.toLocaleString('es-AR')}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
  const [publicTicketId, setPublicTicketId] = useState(() => {
    const match = window.location.pathname.match(/^\/ticket\/([^\/]+)/);
    return match ? match[1] : null;
  });

  if (publicTicketId) {
    return <PublicTicket transactionId={publicTicketId} />;
  }

  // Auth state
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // POS state
  const [products, setProducts] = useState([]);
  const [terminal, setTerminal] = useState(null);
  const [tables, setTables] = useState({});
  const [activeTable, setActiveTable] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [dailyTotal, setDailyTotal] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('tables');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [pinModal, setPinModal] = useState(null); // { itemId, itemName, callback }
  const [ticketModal, setTicketModal] = useState(null); // ticket data after sale
  const [showLiveRegisters, setShowLiveRegisters] = useState(false);
  const [liveRegisters, setLiveRegisters] = useState(null);
  const [committedItems, setCommittedItems] = useState({}); // { tableId: Set of productIds committed }
  const [staleShiftWarning, setStaleShiftWarning] = useState(null);
  const [showDJ, setShowDJ] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [shiftClosedData, setShiftClosedData] = useState(null);

  // PWA Install Modal (show once per device)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const alreadySeen = localStorage.getItem('tcq_pos_install_seen');
    if (!isStandalone && !alreadySeen) {
      setTimeout(() => setShowInstallModal(true), 1000);
    }
  }, []);

  const dismissInstallModal = () => {
    setShowInstallModal(false);
    localStorage.setItem('tcq_pos_install_seen', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // ── WebSocket for Real-time Payment Updates ──
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const defaultWsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : 'tcq-project.onrender.com';
  const wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}//${defaultWsHost}/api/v1/dashboard/ws`;
  const { connected: wsConnected } = useWebSocket(wsUrl, (data) => {
    if (data.event === 'sale_completed') {
      if (qrModal && qrModal.transaction_id === data.transaction_id) {
        toast(data.message || '✅ ¡Pago de Mercado Pago confirmado!', 'success');
        setQrModal(null);
        setDailyTotal(prev => prev + data.total_amount);
        setTables(prev => { const next = { ...prev }; delete next[activeTable]; return next; });
        setActiveTable(null);
        setView('tables');
      } else {
        toast(data.message || `Nuevo pago ingresado: $${data.total_amount}`, 'success');
        setDailyTotal(prev => prev + data.total_amount);
      }
      // Auto-refresh live registers if the modal is open
      if (showLiveRegisters) {
        api.getAllLiveRegisters().then(setLiveRegisters).catch(() => {});
      }
    }
  });

  // Check saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('tcq_user');
    const savedToken = localStorage.getItem('tcq_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      api.setToken(savedToken);
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('tcq_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    api.clearToken();
    localStorage.removeItem('tcq_user');
    setTables({});
    setActiveTable(null);
    setView('tables');
  };

  // Toast helper
  const toast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Load products & terminal
  const fetchProducts = async () => {
    try { setProducts(await api.getProducts()); } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    (async () => {
      await fetchProducts();
      try {
        const terms = await api.getTerminals();
        if (terms.length > 0) {
          setTerminal(terms[0]);
          setDailyTotal(terms[0].daily_total || 0);
        }
        // Restore tables from localStorage
        const saved = localStorage.getItem('tcq_tables');
        if (saved) setTables(JSON.parse(saved));
      } catch (e) {
        toast('Error conectando con el servidor', 'error');
      }
    })();
  }, []);

  // Persist tables
  useEffect(() => {
    localStorage.setItem('tcq_tables', JSON.stringify(tables));
  }, [tables]);

  // ── Register ──
  const handleOpenRegister = async () => {
    if (terminal?.is_open) { toast('La caja ya está abierta', 'info'); return; }
    const balance = prompt('💰 Saldo inicial (efectivo en caja):', '0');
    if (balance === null) return;
    const hour = new Date().getHours();
    const autoShift = hour < 12 ? 'Mañana' : hour < 20 ? 'Tarde' : 'Noche';
    const shiftLabel = prompt('🕐 Turno:', autoShift);
    if (shiftLabel === null) return;
    try {
      const result = await api.openTerminal(terminal.id, parseFloat(balance) || 0, shiftLabel || autoShift);
      if (result.error === 'STALE_SHIFT') {
        setStaleShiftWarning(result);
        return;
      }
      setTerminal(prev => ({ ...prev, is_open: true, initial_balance: parseFloat(balance) || 0 }));
      setDailyTotal(0);
      setTables({});
      setCommittedItems({});
      toast(`Caja abierta · ${shiftLabel || autoShift} · $${parseFloat(balance || 0).toLocaleString('es-AR')}`);
    } catch (e) { toast(e.detail || 'Error abriendo caja', 'error'); }
  };

  const handleForceCloseStale = async () => {
    try {
      await api.forceCloseTerminal(terminal.id);
      setStaleShiftWarning(null);
      setTerminal(prev => ({ ...prev, is_open: false }));
      toast('Caja del día anterior cerrada. Ahora podés abrir una nueva.');
    } catch (e) { toast('Error cerrando caja', 'error'); }
  };

  const handleCloseRegister = async () => {
    if (!terminal?.is_open) return;
    if (!confirm('¿Cerrar caja ahora?')) return;
    try {
      const result = await api.closeTerminal(terminal.id);
      setTerminal(prev => ({ ...prev, is_open: false }));
      setTables({});
      setCommittedItems({});
      setActiveTable(null);
      setView('tables');
      setShiftClosedData(result);
    } catch (e) { toast(e.detail || 'Error cerrando caja', 'error'); }
  };

  // ── Table Selection ──
  const selectTable = (id) => {
    if (!terminal?.is_open) { toast('Debe abrir la caja primero', 'error'); return; }
    if (!tables[id]) setTables(prev => ({ ...prev, [id]: [] }));
    setActiveTable(id);
    setActiveCategory(null);
    setView('order');
  };

  const backToTables = () => { setActiveTable(null); setView('tables'); };

  // ── Cart Operations ──
  const currentCart = activeTable ? (tables[activeTable] || []) : [];

  const addToCart = (product) => {
    if (!activeTable) return;
    setTables(prev => {
      const cart = [...(prev[activeTable] || [])];
      const existing = cart.find(i => i.id === product.id);
      if (existing) {
        // Check stock
        let totalQty = 0;
        Object.values(prev).forEach(tc => { const f = tc.find(i => i.id === product.id); if (f) totalQty += f.qty; });
        if (totalQty >= product.stock) { toast(`Sin stock para "${product.name}"`, 'error'); return prev; }
        existing.qty += 1;
      } else {
        cart.push({ ...product, qty: 1 });
      }
      return { ...prev, [activeTable]: cart };
    });
  };

  const removeFromCart = (productId) => {
    if (!activeTable) return;
    const cart = tables[activeTable] || [];
    const item = cart.find(i => i.id === productId);

    if (item) {
      setPinModal({
        itemId: productId,
        itemName: item.name,
        itemPrice: item.price,
        callback: () => {
          doRemoveFromCart(productId);
          setPinModal(null);
        }
      });
      return;
    }
    doRemoveFromCart(productId);
  };

  const doRemoveFromCart = (productId) => {
    if (!activeTable) return;
    setTables(prev => {
      const cart = [...(prev[activeTable] || [])];
      const idx = cart.findIndex(i => i.id === productId);
      if (idx > -1) {
        if (cart[idx].qty > 1) cart[idx] = { ...cart[idx], qty: cart[idx].qty - 1 };
        else cart.splice(idx, 1);
      }
      return { ...prev, [activeTable]: cart };
    });
  };

  const clearCart = () => {
    if (!activeTable || !confirm('¿Vaciar carrito?')) return;
    setTables(prev => ({ ...prev, [activeTable]: [] }));
  };

  // ── Checkout ──
  const handleCheckout = async () => {
    if (currentCart.length === 0 || !terminal?.is_open) return;
    setLoading(true);
    try {
      const orderData = {
        items: currentCart.map(i => ({ product_id: i.id, quantity: i.qty })),
        method: paymentMethod,
        terminal_id: terminal.id,
        table_ref: String(activeTable),
        operator_id: user?.id || null,
      };
      const result = await api.createOrder(orderData);

      // Build ticket data from items
      const ticketItems = currentCart.map(i => ({
        product_name: i.name, quantity: i.qty, unit_price: i.price, subtotal: i.price * i.qty
      }));

      if (result.method === 'MERCADO_PAGO' && result.qr_data) {
        setQrModal({ url: result.qr_data, amount: result.total_amount, transaction_id: result.transaction_id });
        // Mark items as committed since order was placed
        setCommittedItems(prev => {
          const set = new Set(prev[activeTable] || []);
          currentCart.forEach(i => set.add(i.id));
          return { ...prev, [activeTable]: set };
        });
        toast('📱 QR de Mercado Pago generado', 'success');
      } else {
        toast(result.message || '✅ Venta completada');
        setDailyTotal(prev => prev + result.total_amount);
        // Show ticket modal
        setTicketModal({
          items: ticketItems, total: result.total_amount, method: result.method,
          table_ref: activeTable, transaction_id: result.transaction_id,
          date: new Date().toLocaleString('es-AR'),
        });
        // Clear table
        setTables(prev => { const next = { ...prev }; delete next[activeTable]; return next; });
        setCommittedItems(prev => { const next = { ...prev }; delete next[activeTable]; return next; });
        setActiveTable(null);
        setView('tables');
      }

      // Update product stock locally
      setProducts(prev => prev.map(p => {
        const cartItem = currentCart.find(c => c.id === p.id);
        return cartItem ? { ...p, stock: p.stock - cartItem.qty } : p;
      }));
    } catch (e) {
      toast(typeof e.detail === 'string' ? e.detail : 'Error procesando pago', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Report ──
  const handleShowReport = async () => {
    try {
      const data = await api.getDailySummary();
      setReportData(data);
      setShowReport(true);
    } catch (e) { toast('Error cargando reporte', 'error'); }
  };

  // ── Live Registers (Admin) ──
  const handleShowLiveRegisters = async () => {
    try {
      const data = await api.getAllLiveRegisters();
      setLiveRegisters(data);
      setShowLiveRegisters(true);
    } catch (e) { toast('Error cargando cajas', 'error'); }
  };

  // Auto-refresh live registers every 10 seconds while the modal is open
  useEffect(() => {
    if (!showLiveRegisters) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.getAllLiveRegisters();
        setLiveRegisters(data);
      } catch (e) { /* silent */ }
    }, 10000);
    return () => clearInterval(interval);
  }, [showLiveRegisters]);

  // Close mobile cart after checkout
  const handleCheckoutMobile = async () => {
    await handleCheckout();
    setMobileCartOpen(false);
  };

  const cartItemCount = currentCart.reduce((s, it) => s + it.qty, 0);

  // Show login if not authenticated
  if (!authChecked) return null;
  if (!user) {
    return (
      <>
        <Toasts toasts={toasts} />
        {/* PWA Install Modal on Login Screen */}
        {showInstallModal && (
          <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal" style={{ textAlign: 'center' }}>
              <img src="/tcqlogo.jpg" alt="TCQ" style={{ width: '80px', height: '80px', borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover' }} />
              <h2 className="modal-title" style={{ marginBottom: '0.5rem' }}>📱 Instalá TCQ POS</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
                Agregá la app a tu pantalla de inicio para usarla como tablet de barra.
              </p>
              {isIOS ? (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Pasos en iPhone/iPad:</p>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    1️⃣ Tocá <strong style={{ color: 'var(--brand-primary-light)' }}>Compartir</strong> (↑ barra de abajo)<br/>
                    2️⃣ Elegí <strong style={{ color: 'var(--brand-primary-light)' }}>Agregar a Inicio</strong><br/>
                    3️⃣ Tocá <strong style={{ color: 'var(--brand-primary-light)' }}>Agregar</strong>
                  </p>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
                  <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Pasos en Android:</p>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    1️⃣ Tocá los <strong style={{ color: 'var(--brand-primary-light)' }}>3 puntitos ⋮</strong> (arriba a la derecha)<br/>
                    2️⃣ Elegí <strong style={{ color: 'var(--brand-primary-light)' }}>Instalar aplicación</strong>
                  </p>
                </div>
              )}
              <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={dismissInstallModal}>
                ¡Entendido!
              </button>
            </div>
          </div>
        )}
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <Toasts toasts={toasts} />
      {showReport && <ReportModal data={reportData} onClose={() => setShowReport(false)} />}
      {showTeam && <TeamManager onClose={() => setShowTeam(false)} toast={toast} />}
      {showProducts && <ProductManager onClose={() => setShowProducts(false)} toast={toast} onProductsChanged={fetchProducts} />}
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} toast={toast} />}
      {pinModal && <PinModal itemName={pinModal.itemName} itemPrice={pinModal.itemPrice} terminalId={terminal?.id} operatorId={user?.id} onSuccess={pinModal.callback} onCancel={() => setPinModal(null)} />}
      {ticketModal && <TicketModal data={ticketModal} onClose={() => setTicketModal(null)} />}
      {showDJ && <DJPortal onClose={() => setShowDJ(false)} toast={toast} />}
      {showEvents && <EventManager onClose={() => setShowEvents(false)} toast={toast} />}

      {/* Stale Shift Warning */}
      {staleShiftWarning && (
        <div className="modal-overlay" style={{ zIndex: 1800 }}>
          <div className="modal" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
            <h2 className="modal-title" style={{ color: 'var(--warning)' }}>Caja sin cerrar</h2>
            <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
              La caja quedó abierta del día <strong style={{ color: 'var(--text-primary)' }}>{staleShiftWarning.stale_date}</strong>. 
              Tenés que cerrarla antes de abrir una nueva.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setStaleShiftWarning(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleForceCloseStale} style={{ flex: 1, justifyContent: 'center' }}>Cerrar Caja Anterior</button>
            </div>
          </div>
        </div>
      )}

      {/* Live Registers Modal (Admin) */}
      {showLiveRegisters && liveRegisters && (
        <div className="modal-overlay" onClick={() => setShowLiveRegisters(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📦 Cajas en Vivo</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button className="btn btn-ghost btn-icon" onClick={handleShowLiveRegisters} title="Refrescar">🔄</button>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowLiveRegisters(false)}>✕</button>
              </div>
            </div>
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Facturado (todas las cajas)</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-accent)' }}>
                ${liveRegisters.grand_total?.toLocaleString('es-AR')}
              </div>
            </div>
            {liveRegisters.registers?.map(r => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-md)', background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)', border: `1px solid ${r.is_open ? 'rgba(6,214,160,0.3)' : 'var(--border-subtle)'}`,
                marginBottom: 'var(--space-sm)',
              }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {r.is_open ? `🟢 ${r.operator_name || 'Operador'} · ${r.shift_label || 'Turno'}` : '🔴 Cerrada'}
                  </div>
                  {r.is_open && r.transaction_count > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--brand-accent)', marginTop: '2px' }}>
                      {r.transaction_count} ventas
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: r.is_open ? 'var(--success)' : 'var(--text-muted)' }}>
                    ${r.daily_total?.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PWA Install Modal */}
      {showInstallModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal" style={{ textAlign: 'center' }}>
            <img src="/tcqlogo.jpg" alt="TCQ" style={{ width: '80px', height: '80px', borderRadius: '12px', marginBottom: '1rem', objectFit: 'cover' }} />
            <h2 className="modal-title" style={{ marginBottom: '0.5rem' }}>📱 Instalá TCQ POS</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center' }}>
              Agregá la app a tu pantalla de inicio para usarla como tablet de barra.
            </p>
            {isIOS ? (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Pasos en iPhone/iPad:</p>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  1️⃣ Tocá <strong style={{ color: 'var(--brand-primary-light)' }}>Compartir</strong> (↑ barra de abajo)<br/>
                  2️⃣ Elegí <strong style={{ color: 'var(--brand-primary-light)' }}>Agregar a Inicio</strong><br/>
                  3️⃣ Tocá <strong style={{ color: 'var(--brand-primary-light)' }}>Agregar</strong>
                </p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Pasos en Android:</p>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  1️⃣ Tocá los <strong style={{ color: 'var(--brand-primary-light)' }}>3 puntitos ⋮</strong> (arriba a la derecha)<br/>
                  2️⃣ Elegí <strong style={{ color: 'var(--brand-primary-light)' }}>Instalar aplicación</strong>
                </p>
              </div>
            )}
            <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={dismissInstallModal}>
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Shift Closed Modal */}
      {shiftClosedData && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <h2 className="modal-title" style={{ color: 'var(--brand-primary-light)' }}>Caja Cerrada</h2>
            
            <div style={{ margin: '1rem 0', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Final</p>
              <h3 style={{ fontSize: '2rem', color: 'var(--success)', margin: '0.5rem 0' }}>
                ${shiftClosedData.total_final?.toLocaleString('es-AR')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operador: {shiftClosedData.closed_by}</p>
            </div>

            {shiftClosedData.voided_items && shiftClosedData.voided_items.length > 0 && (
              <div style={{ textAlign: 'left', marginTop: '1rem' }}>
                <h4 style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>⚠️ Productos Eliminados</h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                  {shiftClosedData.voided_items.map((vi, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                      <span style={{ color: '#fca5a5' }}>{vi.name}</span>
                      <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>-${vi.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center' }} onClick={() => setShiftClosedData(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MP QR Modal */}
      {qrModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ alignItems: 'center', textAlign: 'center' }}>
            <h2 className="modal-title" style={{ marginBottom: 'var(--space-xs)' }}>Cobro Mercado Pago</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>
              Total a cobrar: <strong style={{ color: 'var(--brand-primary-light)', fontSize: '1.2rem' }}>${qrModal.amount.toLocaleString('es-AR')}</strong>
            </p>
            <div style={{ background: '#fff', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', display: 'inline-block', marginBottom: 'var(--space-md)' }}>
              <QRCodeSVG value={qrModal.url} size={250} />
            </div>
            <p style={{ color: 'var(--success)', fontWeight: 600, animation: 'pulse 2s infinite', marginBottom: 'var(--space-lg)' }}>
              Esperando confirmación de pago...
            </p>
            <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setQrModal(null)}>
              Cancelar Pago
            </button>
          </div>
        </div>
      )}

      {/* Mobile cart overlay */}
      <div className={`cart-overlay ${mobileCartOpen ? 'mobile-open' : ''}`}
        onClick={() => setMobileCartOpen(false)} />

      {/* Mobile FAB for cart */}
      <button className="cart-fab" onClick={() => setMobileCartOpen(true)}>
        🛒
        {cartItemCount > 0 && <span className="cart-fab-badge">{cartItemCount}</span>}
      </button>

      <div className="app-layout">
        <div className="main-panel">
          <TopBar
            terminal={terminal}
            dailyTotal={dailyTotal}
            onOpenRegister={handleOpenRegister}
            onCloseRegister={handleCloseRegister}
            onShowReport={handleShowReport}
            user={user}
            onShowTeam={() => setShowTeam(true)}
            onShowProducts={() => setShowProducts(true)}
            onShowTopUp={() => setShowTopUp(true)}
            onLogout={handleLogout}
            wsConnected={wsConnected}
            onShowLiveRegisters={handleShowLiveRegisters}
            onShowDJ={() => setShowDJ(true)}
            onShowEvents={() => setShowEvents(true)}
          />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {view === 'tables' ? (
            <>
              <div className="section-header">
                <span className="section-title">Gestión de Mesas</span>
                <span className="section-subtitle">{Object.keys(tables).filter(k => tables[k]?.length > 0).length} ocupadas</span>
              </div>
              <TablesView tables={tables} onSelect={selectTable} />
            </>
          ) : (
            <>
              <div className="section-header">
                <span className="section-title">
                  Mesa {activeTable === 'barra' ? 'BARRA' : `#${activeTable}`}
                </span>
                <button className="btn btn-ghost" onClick={backToTables}>← Mesas</button>
              </div>
              <OrderView
                products={products}
                activeCategory={activeCategory}
                onCategorySelect={setActiveCategory}
                onAddToCart={addToCart}
              />
            </>
          )}
        </div>

        <CartPanel
          activeTable={activeTable}
          cart={currentCart}
          paymentMethod={paymentMethod}
          onMethodChange={setPaymentMethod}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onClear={clearCart}
          onCheckout={handleCheckoutMobile}
          loading={loading}
          mobileOpen={mobileCartOpen}
          onClose={() => setMobileCartOpen(false)}
        />
        </div>
      </div>
    </>
  );
}
