/**
 * TCQ-DJ — DJ Event Management Portal
 * Standalone page for managing DJ registrations, drink allocations, and QR redemption.
 * Accessible as a modal/panel from the POS or as a standalone page.
 */
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

export default function DJPortal({ onClose, toast }) {
  const [view, setView] = useState('list'); // list | register | scan | detail
  const [registrations, setRegistrations] = useState([]);
  const [form, setForm] = useState({ dj_name: '', event_name: '', event_date: new Date().toISOString().slice(0, 10) });
  const [loading, setLoading] = useState(false);
  const [selectedDJ, setSelectedDJ] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanCode, setScanCode] = useState('');

  const load = async () => {
    try {
      const data = await api.djListRegistrations();
      setRegistrations(data);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.djRegister(form);
      toast(result.message);
      setSelectedDJ(result);
      setView('detail');
      load();
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'Error registrando DJ', 'error');
    } finally { setLoading(false); }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!scanCode.trim()) return;
    setLoading(true);
    try {
      const result = await api.djScanQR(scanCode.trim());
      setScanResult(result);
      setView('scan-result');
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'DJ no encontrado', 'error');
    } finally { setLoading(false); }
  };

  const handleRedeem = async (drinkType) => {
    if (!scanResult) return;
    setLoading(true);
    try {
      const result = await api.djRedeemDrink(scanResult.qr_code, drinkType);
      toast(result.message);
      // Refresh the scan result
      const updated = await api.djScanQR(scanResult.qr_code);
      setScanResult(updated);
      load();
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'Error', 'error');
    } finally { setLoading(false); }
  };

  const drinkIcons = { trago: '🍸', sin_alcohol: '🥤', gaseosa: '🥫' };
  const drinkLabels = { trago: 'Trago', sin_alcohol: 'Sin Alcohol', gaseosa: 'Gaseosa' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">🎧 TCQ-DJ</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {view !== 'list' && (
              <button className="btn btn-ghost" onClick={() => { setView('list'); setScanResult(null); setScanCode(''); }} style={{ fontSize: '0.8rem' }}>
                ← Lista
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setView('register')} style={{ flex: 1, justifyContent: 'center' }}>
                ➕ Registrar DJ
              </button>
              <button className="btn btn-success" onClick={() => setView('scan')} style={{ flex: 1, justifyContent: 'center' }}>
                📷 Escanear QR
              </button>
            </div>

            <div style={{ maxHeight: '50vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {registrations.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                  No hay DJs registrados
                </p>
              )}
              {registrations.map(dj => (
                <div key={dj.id} onClick={() => { setSelectedDJ(dj); setView('detail'); }} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 'var(--space-md)', background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>🎧 {dj.dj_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {dj.event_name} · {dj.event_date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 800, fontSize: '1.1rem',
                      color: dj.drinks_remaining > 0 ? 'var(--success)' : 'var(--danger)',
                    }}>
                      {dj.drinks_remaining}/{dj.drinks_total}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>restantes</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REGISTER VIEW */}
        {view === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ color: 'var(--brand-primary-light)', fontWeight: 700 }}>Registrar Nuevo DJ</h3>
            <input className="login-input" placeholder="Nombre del DJ" required value={form.dj_name}
              onChange={e => setForm(f => ({ ...f, dj_name: e.target.value }))} />
            <input className="login-input" placeholder="Nombre del Evento" required value={form.event_name}
              onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} />
            <input className="login-input" type="date" required value={form.event_date}
              onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            <button type="submit" className="btn btn-success" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? '⏳' : '✅ Registrar DJ'}
            </button>
          </form>
        )}

        {/* SCAN VIEW */}
        {view === 'scan' && (
          <form onSubmit={handleScan} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ color: 'var(--brand-primary-light)', fontWeight: 700 }}>Escanear QR de DJ</h3>
            <input className="login-input" placeholder="Código QR (ej: DJ-A1B2C3D4)" required value={scanCode}
              onChange={e => setScanCode(e.target.value)} autoFocus />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
              {loading ? '⏳ Buscando...' : '🔍 Buscar DJ'}
            </button>
          </form>
        )}

        {/* SCAN RESULT — Drink Redemption */}
        {view === 'scan-result' && scanResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-primary-light)' }}>🎧 {scanResult.dj_name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {scanResult.event_name} · {scanResult.event_date}
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                {Array.from({ length: scanResult.drinks_total }).map((_, i) => (
                  <div key={i} style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: i < scanResult.drinks_used ? 'var(--danger)' : 'var(--success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', transition: 'all 0.3s ease',
                    boxShadow: i < scanResult.drinks_used ? '0 0 8px rgba(239,68,68,0.3)' : '0 0 8px rgba(6,214,160,0.3)',
                  }}>
                    {i < scanResult.drinks_used ? '✕' : '🍹'}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '0.5rem', fontWeight: 800, fontSize: '1.5rem', color: scanResult.drinks_remaining > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {scanResult.drinks_remaining} consumiciones restantes
              </div>
            </div>

            {scanResult.drinks_remaining > 0 ? (
              <>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  ¿Qué quiere tomar?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {Object.entries(drinkLabels).map(([key, label]) => (
                    <button key={key} className="btn btn-ghost" onClick={() => handleRedeem(key)}
                      disabled={loading}
                      style={{ flexDirection: 'column', padding: '1rem', justifyContent: 'center', fontSize: '0.85rem', gap: '0.25rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{drinkIcons[key]}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>❌</div>
                <div style={{ fontWeight: 700, color: '#fca5a5' }}>Sin consumiciones disponibles</div>
              </div>
            )}

            {/* Redemption History */}
            {scanResult.redemptions?.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Historial</h4>
                {scanResult.redemptions.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                    <span>{drinkIcons[r.drink_type]} {drinkLabels[r.drink_type] || r.drink_type}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{r.redeemed_at ? new Date(r.redeemed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW — Show QR */}
        {view === 'detail' && selectedDJ && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-primary-light)' }}>🎧 {selectedDJ.dj_name}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {selectedDJ.event_name} · {selectedDJ.event_date}
            </div>
            <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
              <QRCodeSVG value={selectedDJ.qr_code} size={200} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {selectedDJ.qr_code}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.2rem' }}>
              {selectedDJ.drinks_remaining}/{selectedDJ.drinks_total} consumiciones
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              El barman escanea este QR para entregar las consumiciones.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
