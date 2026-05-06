import React from "react";

export default function Footer() {
  return (
    <footer className="footer-modern text-white mt-5 position-relative">
      {/* Wave decorativo */}
      <div className="footer-wave">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
        >
          <path
            d="M0,96L48,122.7C96,149,192,203,288,213.3C384,224,480,192,576,176C672,160,768,160,864,160C960,160,1056,160,1152,170.7C1248,181,1344,203,1392,213.3L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            fill="url(#footerGradient)"
          ></path>
          <defs>
            <linearGradient id="footerGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0a0a0a" />
              <stop offset="100%" stopColor="#111" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Contenido del footer */}
      <div className="container text-center d-flex flex-column align-items-center gap-4 py-5">
        {/* Logo */}
        <a
          href="#top"
          className="footer-logo d-inline-flex align-items-center text-decoration-none"
        >
          <img
            src="/logo-tcq-transparenteblanco.svg"
            alt="TCQ Logo"
            width="64"
            height="64"
            style={{ objectFit: "contain" }}
          />
        </a>

        {/* Redes sociales */}
        <div className="d-flex gap-3">
          <a href="https://instagram.com" className="social-link">
            <i className="bi bi-instagram"></i>
          </a>
          <a href="https://facebook.com" className="social-link">
            <i className="bi bi-facebook"></i>
          </a>
          <a href="https://twitter.com" className="social-link">
            <i className="bi bi-twitter-x"></i>
          </a>
        </div>

        {/* Info corta */}
        <p className="text-white-50 m-0">
          Av. Corrientes 1234 · Buenos Aires · info@tcqclub.com
        </p>

        <hr className="footer-divider" />

        <p className="small text-white-50 m-0">
          © {new Date().getFullYear()} TCQ Club — Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
