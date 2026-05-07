import { useState, useEffect } from 'react';
import api from '../services/api';

export default function EventManager({ onClose, toast }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'details'
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states for creating Event
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    flyer_url: '',
    is_public: true,
    hide_from_sellers: false,
    start_time: '',
    end_time: '',
    cutoff_time: ''
  });

  // Form states for creating Ticket Type
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    category: 'standard', // standard, multi, invite
    name: '',
    description: '',
    price: '',
    stock: '',
    state: 'on_sale',
    is_visible: true,
    is_transferable: true,
    access_count: 1,
    entry_limit_time: '',
    discount_code: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (e) {
      toast('Error cargando eventos', 'error');
    }
  };

  const loadEventStats = async (eventId) => {
    try {
      const data = await api.getEventStats(eventId);
      setStats(data);
    } catch (e) {
      toast('Error cargando estadísticas', 'error');
    }
  };

  const handleSelectEvent = (ev) => {
    setSelectedEvent(ev);
    setActiveTab('details');
    loadEventStats(ev.id);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!eventForm.name || !eventForm.start_time || !eventForm.end_time) {
        throw new Error('Completa los campos obligatorios (*)');
      }
      
      const payload = {
        ...eventForm,
        start_time: new Date(eventForm.start_time).toISOString(),
        end_time: new Date(eventForm.end_time).toISOString(),
        cutoff_time: eventForm.cutoff_time ? new Date(eventForm.cutoff_time).toISOString() : null,
      };

      await api.createEvent(payload);
      toast('Evento creado exitosamente');
      setEventForm({ name: '', description: '', flyer_url: '', is_public: true, hide_from_sellers: false, start_time: '', end_time: '', cutoff_time: '' });
      setActiveTab('list');
      loadEvents();
    } catch (e) {
      toast(e.message || 'Error creando evento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFlyerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const res = await api.uploadFlyer(file);
      if (res.url) {
        setEventForm({ ...eventForm, flyer_url: res.url });
        toast('Flyer subido correctamente');
      }
    } catch (e) {
      toast('Error subiendo imagen', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer y el evento dejará de ser público.')) return;
    
    setLoading(true);
    try {
      await api.deleteEvent(eventId);
      toast('Evento eliminado');
      setActiveTab('list');
      setSelectedEvent(null);
      loadEvents();
    } catch (e) {
      toast('Error eliminando evento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicketType = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!ticketForm.name || ticketForm.price === '' || ticketForm.stock === '') {
        throw new Error('Completa los campos obligatorios (*)');
      }

      const payload = {
        ...ticketForm,
        price: parseFloat(ticketForm.price),
        stock: parseInt(ticketForm.stock),
        access_count: parseInt(ticketForm.access_count),
        entry_limit_time: ticketForm.entry_limit_time ? new Date(ticketForm.entry_limit_time).toISOString() : null,
      };

      await api.createTicketType(selectedEvent.id, payload);
      toast('Ticket creado exitosamente');
      setShowTicketForm(false);
      setTicketForm({ category: 'standard', name: '', description: '', price: '', stock: '', state: 'on_sale', is_visible: true, is_transferable: true, access_count: 1, entry_limit_time: '', discount_code: '' });
      loadEventStats(selectedEvent.id);
    } catch (e) {
      toast(e.message || 'Error creando ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1500, padding: '2rem' }}>
      <div className="modal desktop-modal" onClick={e => e.stopPropagation()} style={{ 
        maxWidth: '1200px', 
        width: '100%', 
        height: 'calc(100vh - 4rem)', 
        display: 'flex', 
        flexDirection: 'row',
        padding: 0,
        overflow: 'hidden',
        background: 'var(--bg-base)',
        border: '1px solid var(--border-subtle)'
      }}>
        
        {/* Sidebar Navigation */}
        <div style={{
          width: '280px',
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem 1rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            🎫 <span style={{ background: 'linear-gradient(45deg, var(--brand-primary-light), var(--brand-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Productora</span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => {setActiveTab('list'); setSelectedEvent(null);}}
              style={{
                textAlign: 'left', padding: '1rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: (activeTab === 'list' || activeTab === 'details') ? 'var(--brand-primary)' : 'transparent',
                color: (activeTab === 'list' || activeTab === 'details') ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              📅 Mis Eventos
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              style={{
                textAlign: 'left', padding: '1rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: activeTab === 'create' ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === 'create' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600, transition: 'all 0.2s'
              }}
            >
              ✨ Crear Nuevo Evento
            </button>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>
              ← Volver al POS
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '3rem', background: 'var(--bg-base)' }}>
          
          {/* TAB: LIST */}
          {activeTab === 'list' && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', margin: 0 }}>Panel de Eventos</h1>
                <button className="btn btn-success" onClick={() => setActiveTab('create')}>+ Crear Evento</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {events.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '4rem', background: 'var(--bg-elevated)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎟️</div>
                    Aún no has creado ningún evento. ¡Es hora de organizar tu primera fiesta!
                  </div>
                ) : (
                  events.map(ev => (
                    <div key={ev.id} onClick={() => handleSelectEvent(ev)} style={{
                      background: 'var(--bg-elevated)', borderRadius: '16px', overflow: 'hidden',
                      border: '1px solid var(--border-subtle)', cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }} className="event-card-hover">
                      <div style={{ height: '160px', width: '100%', background: 'var(--bg-surface)', position: 'relative' }}>
                        {ev.flyer_url ? (
                          <img src={ev.flyer_url} alt="flyer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'linear-gradient(45deg, #2a2a35, #1a1a25)' }}>🪩</div>
                        )}
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.7)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, backdropFilter: 'blur(10px)' }}>
                          {ev.is_public ? '🟢 Público' : '🔴 Privado'}
                        </div>
                      </div>
                      <div style={{ padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.25rem' }}>{ev.name}</h3>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>📅 {new Date(ev.start_time).toLocaleDateString('es-AR')}</span>
                          <span>·</span>
                          <span>⏰ {new Date(ev.start_time).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}hs</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: CREATE EVENT */}
          {activeTab === 'create' && (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Crear Nuevo Evento</h1>
              <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', background: 'var(--bg-elevated)', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--brand-primary-light)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Información General</h3>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre del Evento *</label>
                    <input className="input" type="text" placeholder="Ej: TCQ Fest Vol. 3" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} required style={{ width: '100%', padding: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Descripción de la fiesta</label>
                    <textarea className="input" rows="4" placeholder="Line up, dress code, etc..." value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} style={{ width: '100%', padding: '0.8rem', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Flyer (Imagen del evento)</label>
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                      <input 
                        className="input" 
                        type="file" 
                        accept="image/*"
                        onChange={handleFlyerUpload} 
                        style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-surface)' }} 
                      />
                      {loading && <div style={{ fontSize: '0.8rem', color: 'var(--brand-primary-light)' }}>Subiendo imagen...</div>}
                    </div>
                    {eventForm.flyer_url && <img src={eventForm.flyer_url} alt="Preview" style={{ marginTop: '1rem', height: '160px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--brand-primary-light)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Fechas y Horarios</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Inicio *</label>
                      <input className="input" type="datetime-local" value={eventForm.start_time} onChange={e => setEventForm({...eventForm, start_time: e.target.value})} required style={{ width: '100%', padding: '0.8rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Finalización *</label>
                      <input className="input" type="datetime-local" value={eventForm.end_time} onChange={e => setEventForm({...eventForm, end_time: e.target.value})} required style={{ width: '100%', padding: '0.8rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Corte de venta (Opcional)</label>
                      <input className="input" type="datetime-local" value={eventForm.cutoff_time} onChange={e => setEventForm({...eventForm, cutoff_time: e.target.value})} style={{ width: '100%', padding: '0.8rem' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: 'var(--brand-primary-light)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Privacidad y Visibilidad</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px' }}>
                      <input type="checkbox" checked={eventForm.is_public} onChange={e => setEventForm({...eventForm, is_public: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Evento Público</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aparecerá en el inicio web de tcqlub.com</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: 'var(--bg-surface)', padding: '1rem', borderRadius: '12px' }}>
                      <input type="checkbox" checked={eventForm.hide_from_sellers} onChange={e => setEventForm({...eventForm, hide_from_sellers: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Ocultar a vendedores PRs</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Solo administradores podrán vender u organizar.</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="submit" className="btn btn-success" disabled={loading} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                    {loading ? 'Generando...' : 'Crear Evento 🚀'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: EVENT DETAILS & TICKETS DASHBOARD */}
          {activeTab === 'details' && selectedEvent && (
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Event Header Banner */}
              <div style={{ 
                position: 'relative', 
                background: `linear-gradient(to right, rgba(20,20,25,0.95), rgba(20,20,25,0.7)), url(${selectedEvent.flyer_url || ''})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: '3rem', 
                borderRadius: '16px', 
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{selectedEvent.name}</h1>
                <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>📅 {new Date(selectedEvent.start_time).toLocaleDateString('es-AR')}</span>
                  <span>|</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{selectedEvent.is_public ? '🟢 Público' : '🔴 Privado'}</span>
                </div>
                
                <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', gap: '1rem' }}>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    disabled={loading}
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                  >
                    🗑️ Eliminar Evento
                  </button>
                </div>
              </div>

              {/* Stats Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Tickets Totales Vendidos</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand-primary-light)' }}>
                    {stats.reduce((acc, st) => acc + st.sold, 0)}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Recaudación Bruta (Est.)</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>
                    ${stats.reduce((acc, st) => acc + (st.sold * st.price), 0).toLocaleString('es-AR')}
                  </div>
                </div>
              </div>

              {/* Tickets Configuration Area */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Tipos de Tickets</h2>
                <button className={`btn ${showTicketForm ? 'btn-danger' : 'btn-success'}`} onClick={() => setShowTicketForm(!showTicketForm)}>
                  {showTicketForm ? '✕ Cancelar' : '+ Nuevo Ticket'}
                </button>
              </div>

              {/* Create Ticket Form */}
              {showTicketForm && (
                <form onSubmit={handleCreateTicketType} style={{ 
                  background: 'var(--bg-elevated)', padding: '2rem', borderRadius: '16px', 
                  border: '1px solid var(--brand-accent)', display: 'flex', flexDirection: 'column', gap: '1.5rem',
                  boxShadow: '0 0 20px rgba(6, 214, 160, 0.1)'
                }}>
                  <h3 style={{ margin: 0, color: 'var(--brand-primary-light)' }}>Configuración de Entrada</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tipo de acceso</label>
                      <select className="input" value={ticketForm.category} onChange={e => setTicketForm({...ticketForm, category: e.target.value})} style={{ width: '100%', padding: '0.8rem' }}>
                        <option value="standard">Estándar (1 QR por persona)</option>
                        <option value="multi">Mesa / Combo (Varios QRs)</option>
                        <option value="invite">Cortesía (Invitación gratis)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre del ticket *</label>
                      <input className="input" type="text" placeholder="Ej: General Fase 1" value={ticketForm.name} onChange={e => setTicketForm({...ticketForm, name: e.target.value})} required style={{ width: '100%', padding: '0.8rem' }} />
                    </div>

                    {ticketForm.category === 'multi' && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>QRs a generar *</label>
                        <input className="input" type="number" min="2" value={ticketForm.access_count} onChange={e => setTicketForm({...ticketForm, access_count: e.target.value})} required style={{ width: '100%', padding: '0.8rem' }} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Precio (ARS) *</label>
                      <input className="input" type="number" step="100" value={ticketForm.price} onChange={e => setTicketForm({...ticketForm, price: e.target.value})} required disabled={ticketForm.category === 'invite'} style={{ width: '100%', padding: '0.8rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Stock total *</label>
                      <input className="input" type="number" placeholder="Capacidad" value={ticketForm.stock} onChange={e => setTicketForm({...ticketForm, stock: e.target.value})} required style={{ width: '100%', padding: '0.8rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Estado</label>
                      <select className="input" value={ticketForm.state} onChange={e => setTicketForm({...ticketForm, state: e.target.value})} style={{ width: '100%', padding: '0.8rem' }}>
                        <option value="on_sale">En venta</option>
                        <option value="secret">Oculto (Link directo)</option>
                        <option value="not_available">Agotado / Pausado</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-success" disabled={loading} style={{ alignSelf: 'flex-end', padding: '1rem 2rem', marginTop: '1rem' }}>
                    {loading ? 'Guardando...' : 'Guardar y Publicar Ticket'}
                  </button>
                </form>
              )}

              {/* Tickets List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {stats.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
                    No hay tipos de tickets configurados. Agrega uno para empezar a vender.
                  </div>
                ) : (
                  stats.map(st => {
                    const progress = st.stock > 0 ? (st.sold / st.stock) * 100 : 0;
                    return (
                      <div key={st.ticket_type_id} style={{ 
                        background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '16px', 
                        border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)' }}>{st.name}</div>
                            <div style={{ padding: '0.2rem 0.6rem', background: st.state === 'on_sale' ? 'rgba(6,214,160,0.1)' : 'rgba(255,255,255,0.05)', color: st.state === 'on_sale' ? 'var(--success)' : 'var(--text-muted)', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                              {st.state === 'on_sale' ? '🟢 Activo' : st.state === 'secret' ? '🤫 Secreto' : '🔴 Pausado'}
                            </div>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>
                            ${st.price.toLocaleString('es-AR')}
                          </div>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Progreso de venta</span>
                            <span style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>{st.sold} / {st.stock}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: progress >= 100 ? 'var(--danger)' : 'var(--brand-primary)', transition: 'width 0.5s ease' }} />
                          </div>
                          {progress >= 100 && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 600, textAlign: 'right' }}>¡AGOTADO!</div>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`
        .event-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.4) !important;
          border-color: var(--brand-primary-light) !important;
        }
        @media (max-width: 768px) {
          .desktop-modal {
            flex-direction: column !important;
            height: 100vh !important;
            border-radius: 0 !important;
          }
          .desktop-modal > div:first-child {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border-subtle);
            padding: 1rem !important;
          }
          .desktop-modal > div:last-child {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
