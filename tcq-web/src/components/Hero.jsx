// Hero.jsx
import React from "react";
import "./App.css"; // asegúrate de tener el CSS base

export default function Hero() {
  return (
    <header className="masthead d-flex align-items-center text-center text-white">
      <div className="container px-4 px-lg-5 d-flex flex-column align-items-center">
        <h1 className="mb-1 fw-bold">TCQ Club</h1>
        <h3 className="mb-5">
          <em>El epicentro del Techno en Buenos Aires</em>
        </h3>
        <a className="btn btn-primary btn-lg" href="#events">
          Ver Próximos Eventos
        </a>
      </div>
    </header>
  );
}
