// Contact.jsx
import React from "react";

export default function Contact() {
  return (
    <section id="contact" className="page-section bg-dark text-white">
      <div className="container px-4 px-lg-5">
        <h2 className="text-center mt-0">Consultas</h2>
        <hr className="divider" />
        <form className="mx-auto" style={{ maxWidth: "600px" }}>
          <div className="mb-3">
            <input className="form-control" type="text" placeholder="Tu nombre" />
          </div>
          <div className="mb-3">
            <input className="form-control" type="email" placeholder="Tu email" />
          </div>
          <div className="mb-3">
            <textarea className="form-control" rows="5" placeholder="Mensaje"></textarea>
          </div>
          <button className="btn btn-primary btn-xl" type="submit">
            Enviar
          </button>
        </form>
      </div>
    </section>
  );
}
