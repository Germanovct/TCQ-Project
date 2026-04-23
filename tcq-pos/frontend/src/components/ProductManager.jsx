import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ProductManager({ onClose, toast, onProductsChanged }) {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'bebidas', price: '', stock: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { setProducts(await api.getProducts()); } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', category: 'bebidas', price: '', stock: '' });
    setShowForm(true);
  };

  const openEdit = (prod) => {
    setEditingId(prod.id);
    setForm({ name: prod.name, category: prod.category, price: prod.price, stock: prod.stock });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
      };
      
      if (editingId) {
        await api.updateProduct(editingId, data);
        toast(`✅ Producto "${form.name}" actualizado`);
      } else {
        await api.createProduct(data);
        toast(`✅ Producto "${form.name}" creado`);
      }
      setShowForm(false);
      load();
      if (onProductsChanged) onProductsChanged();
    } catch (err) {
      toast(typeof err.detail === 'string' ? err.detail : 'Error guardando producto', 'error');
    } finally { setLoading(false); }
  };

  const handleDelete = async (prod) => {
    if (!confirm(`¿Eliminar de la carta: ${prod.name}?`)) return;
    try {
      await api.deleteProduct(prod.id);
      toast(`Producto desactivado`);
      load();
      if (onProductsChanged) onProductsChanged();
    } catch (err) {
      toast('Error', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🍔 Carta de Productos</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', maxHeight: '40vh', overflowY: 'auto' }}>
          {products.map(p => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 'var(--space-md)', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {p.category} · ${p.price.toLocaleString('es-AR')} · Stock: {p.stock}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => openEdit(p)}>
                  Editar
                </button>
                <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: '#fca5a5' }} onClick={() => handleDelete(p)}>
                  Quitar
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No hay productos</p>}
        </div>

        {!showForm ? (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={openCreate}>
            + Agregar Producto
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', background: 'var(--bg-elevated)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-xs)' }}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            <input className="login-input" placeholder="Nombre (ej. Fernet c/ Coca)" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            
            <select className="login-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="bebidas">Bebidas (sin alcohol / cervezas)</option>
              <option value="tragos">Tragos</option>
              <option value="promos">Promos / Combos</option>
            </select>

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <input className="login-input" type="number" placeholder="Precio ($)" required value={form.price} min="0" step="100"
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              <input className="login-input" type="number" placeholder="Stock" required value={form.stock} min="0"
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            </div>

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
