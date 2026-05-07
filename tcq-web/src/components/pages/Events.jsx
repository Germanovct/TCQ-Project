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
  const [successData, setSuccessData] = useState(null);

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
          setSuccessData(data);
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

      {/* Modal de Éxito (Gratuito) */}
      {successData && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-primary shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-primary fw-bold">¡MUCHAS GRACIAS POR TU COMPRA!</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSuccessData(null)}></button>
              </div>
              <div className="modal-body text-center py-4">
                <p className="mb-4 text-white-50">Tu entrada para <strong>{successData.event_name}</strong> ya está lista.</p>
                
                <div className="bg-white p-3 rounded-4 d-inline-block mb-4 shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${successData.qr_code}`} 
                    alt="Ticket QR" 
                    className="img-fluid"
                  />
                </div>
                
                <div className="alert alert-info bg-primary bg-opacity-10 border-primary text-white text-start small">
                  <i className="bi bi-info-circle me-2"></i>
                  Si no podés descargar por aquí tu ticket, te lo enviamos por email o podés descargarte nuestra <strong>Wallet TCQ</strong>, donde vas a poder ver todos tus tickets QR y acceder a beneficios exclusivos.
                </div>
                
                <div className="d-grid gap-2 mt-4">
                  <button className="btn btn-primary btn-lg rounded-pill" onClick={() => window.print()}>
                    Descargar / Imprimir Ticket
                  </button>
                  <button className="btn btn-outline-light rounded-pill" onClick={() => setSuccessData(null)}>
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                        <div className="mb-4 mt-5 animation-fade-in">
                          <h4 className="text-primary mb-4 border-bottom border-secondary pb-2 text-uppercase fw-bold">2. Completá tus datos</h4>
                          <div className="row g-3">
                            <div className="col-md-6">
                              <div className="form-floating">
                                <input type="text" className="form-control bg-dark text-white border-secondary" id="firstName" placeholder="Nombre" required 
                                  value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                                <label htmlFor="firstName" className="text-white-50">Nombre</label>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="form-floating">
                                <input type="text" className="form-control bg-dark text-white border-secondary" id="lastName" placeholder="Apellido" required 
                                  value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                                <label htmlFor="lastName" className="text-white-50">Apellido</label>
                              </div>
                            </div>
                            <div className="col-12">
                              <div className="form-floating">
                                <input type="email" className="form-control bg-dark text-white border-secondary" id="email" placeholder="nombre@email.com" required 
                                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                <label htmlFor="email" className="text-white-50">Correo Electrónico (Aquí recibirás tu QR)</label>
                              </div>
                            </div>
                          </div>
                          
                          <div className="alert alert-info bg-transparent border-info text-info mt-4 d-flex align-items-center">
                            <i className="bi bi-info-circle-fill me-3 fs-3"></i>
                            <div className="small">
                              <strong>Evento +18:</strong> Al continuar, confirmas que tienes la edad legal para ingresar. 
                              Tus entradas se enviarán por email y estarán disponibles en tu <strong>Wallet TCQ</strong>.
                            </div>
                          </div>
                          
                          <button 
                            type="submit" 
                            className="btn btn-primary w-100 mt-4 py-3 fw-bold fs-5 text-uppercase rounded-pill shadow-lg"
                            disabled={purchasing}
                            style={{ letterSpacing: '1px' }}
                          >
                            {purchasing ? (
                              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Procesando...</>
                            ) : (
                              selectedEvent.ticket_types.find(t => t.id === selectedTicket)?.price == 0 
                              ? "Obtener Entrada Gratis" 
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
