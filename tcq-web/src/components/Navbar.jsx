// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark fixed-top artlab-nav">
      <div className="container">
        {/* Logo */}
        <Link className="navbar-brand" to="/">
          <img
            src="/logo-tcq-transparenteblanco.svg"
            alt="TCQ Club"
            height="40"
          />
        </Link>

        {/* Hamburguesa mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Links */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-3">
            <li className="nav-item">
              <Link className="nav-link modern-link" to="/">
                TCQ Club
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link modern-link" to="/vinyl">
                Vinyl Order
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link modern-link" to="/label">
                Label
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link modern-link" to="/streaming">
                Streaming
              </Link>
            </li>
            <li className="nav-item">
              <a 
                className="nav-link modern-link" 
                href="https://venti.com.ar/organizadores/tcq" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Tickets / Events
              </a>
            </li>

            {/* Botones especiales */}
            <li className="nav-item ms-lg-3">
              <a
                className="btn btn-pill btn-gradient"
                href="https://app.tcqlub.com"
                style={{ background: 'linear-gradient(45deg, #FF0055, #8A2BE2)', color: 'white', border: 'none' }}
              >
                <i className="bi bi-wallet2 me-2"></i> Billetera Cashless
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
