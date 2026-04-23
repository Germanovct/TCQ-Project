import { useState, useEffect } from 'react';
import api from '../services/api';

export default function TeamManager({ onClose, toast }) {
  const [barmen, setBarmen] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { setBarmen(await api.listBarmen()); } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ full_name: '', email: '', password: '' });
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setForm({ full_name: user.full_name, email: user.email, password: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const data = { full_name: form.full_name, email: form.email };
        if (form.password) data.password = form.password;
        await api.updateBarman(editingId, data);
        toast(`✅ Barman "${form.full_name}" actualizado`);
      } else {
        await api.createBarman(form);
        toast(`✅ Barman "${form.full_name}" creado`);
      }
      setForm({ full_name: '', email: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'Error guardando barman', 'error');
    } finally { setLoading(false); }
  };

  const handleDelete = async (user) => {
    if (!confirm(`¿Desactivar a ${user.full_name}?`)) return;
    try {
      await api.deleteBarman(user.id);
      toast(`Barman "${user.full_name}" desactivado`);
      load();
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'Error', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">👥 Equipo</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', maxHeight: '40vh', overflowY: 'auto' }}>
          {barmen.map(b => (
            <div key={b.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 'var(--space-md)', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{b.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {b.email} · {b.role === 'admin' ? '👑 Admin' : '🍺 Barman'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => openEdit(b)}>
                  Editar
                </button>
                {b.role !== 'admin' && (
                  <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: '#fca5a5' }} onClick={() => handleDelete(b)}>
                    Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
          {barmen.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay barmen</p>}
        </div>

        {!showForm ? (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={openCreate}>
            + Agregar Barman
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', background: 'var(--bg-elevated)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-xs)' }}>{editingId ? 'Editar Barman' : 'Nuevo Barman'}</h3>
            <input className="login-input" placeholder="Nombre completo" required value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <input className="login-input" type="email" placeholder="Email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input className="login-input" type="password" placeholder={editingId ? "Nueva Contraseña (opcional)" : "Contraseña"} required={!editingId} value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
              <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                {loading ? '⏳' : (editingId ? '💾 Guardar' : '✅ Crear')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
