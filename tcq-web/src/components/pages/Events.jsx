import React, { useState, useEffect } from "react";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState("");
  
  // Formulario
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("https://tcq-project.onrender.com/api/v1/events?public_only=true");
      if (!res.ok) throw new Error("Error al cargar los eventos");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return alert("Por favor selecciona un tipo de entrada");
    
    setPurchasing(true);
    try {
      const res = await fetch("https://tcq-project.onrender.com/api/v1/tickets/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_type_id: selectedTicket,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error en la compra");
      
      if (data.success) {
        if (data.init_point) {
          // Redirigir a MercadoPago
          window.location.href = data.init_point;
        } else {
          alert("¡MUCHAS GRACIAS POR TU COMPRA!\n\nSi no podés descargar por aquí tu ticket, te lo enviamos por email o podés descargarte nuestra Wallet TCQ, donde vas a poder ver tus tickets y tener muchos beneficios más.");
          setSelectedEvent(null);
          setSelectedTicket("");
        }
      } else {
        alert(data.message || "Error al procesar el pago");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="container py-5 mt-5">
      <h1 className="display-4 text-white text-center mb-5 fw-bold">Próximos Eventos</h1>
      
      {loading && <div className="text-center text-white"><div className="spinner-border text-light"></div></div>}
      {error && <div className="alert alert-danger text-center">{error}</div>}
      
      {!loading && !error && events.length === 0 && (
        <div className="text-center text-white-50 my-5 py-5">
          <h3>Próximamente...</h3>
          <p>No hay eventos públicos programados en este momento. ¡Mantente alerta!</p>
        </div>
      )}

      {/* Listado de Eventos */}
      {!selectedEvent && (
        <div className="row g-4">
          {events.map((evt) => (
            <div className="col-md-6 col-lg-4" key={evt.id}>
              <div className="card h-100 bg-dark text-white border-secondary shadow-lg hover-scale">
                {evt.flyer_url ? (
                  <img src={evt.flyer_url} className="card-img-top" alt={evt.title} style={{ height: "300px", objectFit: "cover" }} />
                ) : (
                  <div className="card-img-top bg-secondary d-flex align-items-center justify-content-center" style={{ height: "300px" }}>
                    <span className="fs-1">TCQ</span>
                  </div>
                )}
                <div className="card-body d-flex flex-column">
                  <h4 className="card-title fw-bold text-uppercase">{evt.title}</h4>
                  <p className="card-text text-white-50">{evt.description}</p>
                  
                  <div className="mt-auto">
                    <p className="mb-2">
                      <i className="bi bi-calendar3 text-primary me-2"></i>
                      {new Date(evt.event_date).toLocaleDateString("es-AR")} - {evt.event_time}
                    </p>
                    <button 
                      className="btn btn-outline-light w-100 fw-bold mt-3 text-uppercase rounded-pill"
                      onClick={() => setSelectedEvent(evt)}
                    >
                      Adquirir Entradas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout del Evento */}
      {selectedEvent && (
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <button 
              className="btn btn-link text-white text-decoration-none mb-4" 
              onClick={() => { setSelectedEvent(null); setSelectedTicket(""); }}
            >
              ← Volver a todos los eventos
            </button>
            
            <div className="card bg-dark text-white border-secondary shadow-lg">
              <div className="row g-0">
                <div className="col-md-5">
                  {selectedEvent.flyer_url ? (
                    <img src={selectedEvent.flyer_url} className="img-fluid rounded-start h-100" alt={selectedEvent.title} style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="h-100 bg-secondary d-flex align-items-center justify-content-center">
                      <span className="fs-1">TCQ</span>
                    </div>
                  )}
                </div>
                
                <div className="col-md-7">
                  <div className="card-body p-4 p-md-5">
                    <h2 className="card-title fw-bold text-uppercase mb-3">{selectedEvent.title}</h2>
                    <p className="text-white-50 mb-4">
                      <i className="bi bi-calendar3 me-2"></i>
                      {new Date(selectedEvent.event_date).toLocaleDateString("es-AR")} - {selectedEvent.event_time}
                    </p>
                    
                    <form onSubmit={handleBuyTicket}>
                      <div className="mb-4">
                        <label className="form-label text-white-50 fw-bold">1. Selecciona tu Ticket</label>
                        <div className="text-info small mb-2"><i className="bi bi-exclamation-triangle me-1"></i> Evento exclusivo para mayores de 18 años.</div>
                        <div className="d-flex flex-column gap-2">
                          {selectedEvent.ticket_types && selectedEvent.ticket_types.length > 0 ? (
                            selectedEvent.ticket_types.map(tt => (
                              <label 
                                key={tt.id} 
                                className={`btn btn-outline-light d-flex justify-content-between align-items-center p-3 text-start ${selectedTicket === tt.id ? 'active bg-white text-dark' : ''} ${tt.stock <= 0 ? 'disabled' : ''}`}
                                style={{ cursor: tt.stock > 0 ? 'pointer' : 'not-allowed' }}
                              >
                                <div>
                                  <input 
                                    type="radio" 
                                    name="ticketType" 
                                    value={tt.id} 
                                    className="d-none"
                                    checked={selectedTicket === tt.id}
                                    onChange={(e) => setSelectedTicket(e.target.value)}
                                    disabled={tt.stock <= 0}
                                  />
                                  <div className="fw-bold fs-5">{tt.name}</div>
                                  <div className="small opacity-75">{tt.state === 'sale' ? 'En Venta' : 'Cortesía'}</div>
                                </div>
                                <div className="text-end">
                                  <div className="fw-bold fs-5">${parseFloat(tt.price).toLocaleString("es-AR")}</div>
                                  {tt.stock <= 0 ? (
                                    <span className="badge bg-danger mt-1">Agotado</span>
                                  ) : (
                                    <span className="badge bg-success mt-1">Disponible</span>
                                  )}
                                </div>
                              </label>
                            ))
                          ) : (
                            <div className="alert alert-warning">No hay tickets disponibles para este evento.</div>
                          )}
                        </div>
                      </div>

                      {selectedTicket && (
                        <div className="mb-4 animation-fade-in">
                          <label className="form-label text-white-50 fw-bold">2. Tus Datos</label>
                          <div className="row g-3">
                            <div className="col-sm-6">
                              <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Nombre" required 
                                value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                            </div>
                            <div className="col-sm-6">
                              <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Apellido" required 
                                value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                            </div>
                            <div className="col-12">
                              <input type="email" className="form-control bg-dark text-white border-secondary" placeholder="Correo Electrónico (Aquí enviaremos tu QR)" required 
                                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                          </div>
                          
                          <button 
                            type="submit" 
                            className="btn btn-primary w-100 mt-4 py-3 fw-bold fs-5 text-uppercase rounded-pill shadow"
                            disabled={purchasing}
                          >
                            {purchasing ? (
                              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Procesando...</>
                            ) : (
                              selectedEvent.ticket_types.find(t => t.id === selectedTicket)?.price == 0 
                              ? "Descargar Entrada Gratis" 
                              : "Pagar con Mercado Pago"
                            )}
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
