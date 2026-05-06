// src/components/Nav.jsx
import React, { useState } from "react";
import logo from "../assets/react.svg"; // reemplazá con tu logo real

// Datos de ejemplo para buscar (pueden venir de tus eventos reales)
const EVENTS = [
  { id: 1, title: "Techno Night", date: "04/10", link: "#events" },
  { id: 2, title: "House Vibes", date: "05/10", link: "#events" },
  { id: 3, title: "DJ Internacional", date: "11/10", link: "#events" },
  { id: 4, title: "Fiesta de Halloween", date: "31/10", link: "#events" },
];

export default function Nav() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Filtra resultados según lo que se escriba
  const filtered = EVENTS.filter((e) =>
    e.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <header>
      <nav className="navbar navbar-dark bg-dark fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Logo */}
          <a className="navbar-brand d-flex align-items-center" href="#top">
            <img
              src={logo}
              alt="Logo"
              width="32"
              height="32"
              className="d-inline-block align-top"
            />
          </a>

          <div className="d-flex align-items-center gap-3">
            {/* Botón de búsqueda */}
            <button
              className="btn btn-dark p-0"
              type="button"
              aria-label="Buscar"
              onClick={() => setSearchOpen((prev) => !prev)}
            >
              <i className="bi bi-search" style={{ fontSize: "1.4rem" }}></i>
            </button>

            {/* Botón hamburguesa */}
            <button
              className="navbar-toggler border-0"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Menú"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        {searchOpen && (
          <div className="bg-dark px-3 py-2 border-top">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar eventos, artistas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />

            {/* Resultados dinámicos */}
            {query && (
              <ul className="list-group mt-2">
                {filtered.length > 0 ? (
                  filtered.map((event) => (
                    <li
                      key={event.id}
                      className="list-group-item list-group-item-action"
                    >
                      <a href={event.link} className="text-decoration-none">
                        <strong>{event.title}</strong>{" "}
                        <span className="text-muted">({event.date})</span>
                      </a>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item text-muted">
                    No se encontraron resultados
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* Menú colapsable */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto text-end">
            <li className="nav-item">
              <a className="nav-link" href="#events">Eventos</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#gallery">Galería</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#menu">Menú</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#reserve">Reservas</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#contact">Contacto</a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
