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
      // Validate dates
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1500 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: 0 }}>
          <h2 className="modal-title">🎫 Productora / Ticketera</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`btn ${activeTab === 'list' || activeTab === 'details' ? 'btn-success' : 'btn-ghost'}`} onClick={() => {setActiveTab('list'); setSelectedEvent(null);}}>Mis Eventos</button>
            <button className={`btn ${activeTab === 'create' ? 'btn-success' : 'btn-ghost'}`} onClick={() => setActiveTab('create')}>Crear Evento</button>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
          
          {/* TAB: LIST */}
          {activeTab === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No hay eventos creados.</div>
              ) : (
                events.map(ev => (
                  <div key={ev.id} style={{
                    background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-subtle)', cursor: 'pointer'
                  }} onClick={() => handleSelectEvent(ev)}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {ev.flyer_url ? (
                        <img src={ev.flyer_url} alt="flyer" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📅</div>
                      )}
                      <div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{ev.name}</h3>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                          {new Date(ev.start_time).toLocaleDateString('es-AR')} · {ev.is_public ? 'Público' : 'Privado'}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-ghost">Gestionar ➔</button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: CREATE EVENT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0 1rem' }}>
              <div>
                <label>Nombre del Evento *</label>
                <input className="input" type="text" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} required />
              </div>
              <div>
                <label>Descripción</label>
                <textarea className="input" rows="3" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} />
              </div>
              <div>
                <label>Flyer (URL de la imagen)</label>
                <input className="input" type="url" placeholder="https://ejemplo.com/flyer.jpg" value={eventForm.flyer_url} onChange={e => setEventForm({...eventForm, flyer_url: e.target.value})} />
                {eventForm.flyer_url && <img src={eventForm.flyer_url} alt="Preview" style={{ marginTop: '0.5rem', height: '100px', borderRadius: '8px', objectFit: 'cover' }} />}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Inicio del evento *</label>
                  <input className="input" type="datetime-local" value={eventForm.start_time} onChange={e => setEventForm({...eventForm, start_time: e.target.value})} required />
                </div>
                <div>
                  <label>Finalización del evento *</label>
                  <input className="input" type="datetime-local" value={eventForm.end_time} onChange={e => setEventForm({...eventForm, end_time: e.target.value})} required />
                </div>
              </div>
              <div>
                <label>Corte de venta de tickets (Opcional)</label>
                <input className="input" type="datetime-local" value={eventForm.cutoff_time} onChange={e => setEventForm({...eventForm, cutoff_time: e.target.value})} />
              </div>
              <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Visualización</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="checkbox" id="is_public" checked={eventForm.is_public} onChange={e => setEventForm({...eventForm, is_public: e.target.checked})} />
                  <label htmlFor="is_public" style={{ margin: 0 }}>Evento Público (Aparecerá en el inicio web)</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="hide_sellers" checked={eventForm.hide_from_sellers} onChange={e => setEventForm({...eventForm, hide_from_sellers: e.target.checked})} />
                  <label htmlFor="hide_sellers" style={{ margin: 0 }}>Ocultar a todos los vendedores (solo admins)</label>
                </div>
              </div>
              <button type="submit" className="btn btn-success" disabled={loading} style={{ alignSelf: 'flex-end', padding: '0.8rem 2rem' }}>
                {loading ? 'Creando...' : 'Crear Evento'}
              </button>
            </form>
          )}

          {/* TAB: EVENT DETAILS & TICKETS DASHBOARD */}
          {activeTab === 'details' && selectedEvent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0 1rem' }}>
              {/* Event Header */}
              <div style={{ background: 'linear-gradient(45deg, var(--bg-elevated), var(--bg-surface))', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--brand-primary-light)' }}>{selectedEvent.name}</h2>
                <div style={{ color: 'var(--text-muted)' }}>
                  🗓 {new Date(selectedEvent.start_time).toLocaleString('es-AR')}
                </div>
              </div>

              {/* Tickets Section */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Tickets</h3>
                <button className="btn btn-success" onClick={() => setShowTicketForm(!showTicketForm)}>
                  {showTicketForm ? 'Cancelar' : '+ Crear Ticket'}
                </button>
              </div>

              {/* Create Ticket Form */}
              {showTicketForm && (
                <form onSubmit={handleCreateTicketType} style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--brand-accent)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h4 style={{ margin: 0 }}>Configurar nuevo Ticket</h4>
                  
                  <div>
                    <label>Tipo de acceso</label>
                    <select className="input" value={ticketForm.category} onChange={e => setTicketForm({...ticketForm, category: e.target.value})}>
                      <option value="standard">Estándar (1 QR por ticket)</option>
                      <option value="multi">Acceso múltiple (Varios QRs)</option>
                      <option value="invite">Invitación (Cortesía)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>Nombre del ticket *</label>
                      <input className="input" type="text" placeholder="Ej: General, VIP" value={ticketForm.name} onChange={e => setTicketForm({...ticketForm, name: e.target.value})} required />
                    </div>
                    {ticketForm.category === 'multi' && (
                      <div>
                        <label>Cantidad de accesos *</label>
                        <input className="input" type="number" min="1" value={ticketForm.access_count} onChange={e => setTicketForm({...ticketForm, access_count: e.target.value})} required />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>Precio (ARS) *</label>
                      <input className="input" type="number" step="0.01" value={ticketForm.price} onChange={e => setTicketForm({...ticketForm, price: e.target.value})} required disabled={ticketForm.category === 'invite'} />
                    </div>
                    <div>
                      <label>Stock disponible *</label>
                      <input className="input" type="number" placeholder="Ej: 100" value={ticketForm.stock} onChange={e => setTicketForm({...ticketForm, stock: e.target.value})} required />
                    </div>
                  </div>

                  <div>
                    <label>Estado de la venta</label>
                    <select className="input" value={ticketForm.state} onChange={e => setTicketForm({...ticketForm, state: e.target.value})}>
                      <option value="on_sale">En venta (Disponible)</option>
                      <option value="secret">Link secreto (Solo directo)</option>
                      <option value="not_available">No disponible</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label>Límite de horario de ingreso (Opcional)</label>
                      <input className="input" type="datetime-local" value={ticketForm.entry_limit_time} onChange={e => setTicketForm({...ticketForm, entry_limit_time: e.target.value})} />
                    </div>
                    <div>
                      <label>Código de descuento (Opcional)</label>
                      <input className="input" type="text" placeholder="Ej: TCQFEST" value={ticketForm.discount_code} onChange={e => setTicketForm({...ticketForm, discount_code: e.target.value})} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-success" disabled={loading} style={{ marginTop: '0.5rem' }}>
                    {loading ? 'Guardando...' : 'Guardar Ticket'}
                  </button>
                </form>
              )}

              {/* Stats Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {stats.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', background: 'var(--bg-elevated)', borderRadius: '12px' }}>Aún no hay tickets creados para este evento.</div>
                ) : (
                  stats.map(st => (
                    <div key={st.ticket_type_id} style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{st.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          ${st.price.toLocaleString('es-AR')} · {st.state === 'on_sale' ? 'En venta' : st.state === 'secret' ? 'Secreto' : 'No disponible'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Entradas vendidas</div>
                        <div style={{ fontWeight: 800, color: 'var(--brand-accent)', fontSize: '1.2rem' }}>{st.sold} / {st.stock}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
