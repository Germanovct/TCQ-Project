// src/components/pages/Home.jsx
import React from "react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <header
      id="home"
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden"
      style={{
        backgroundImage: "url('/backgroundHero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Dark overlay for high contrast */}
      <div 
        className="position-absolute top-0 start-0 w-100 h-100" 
        style={{ 
          background: "linear-gradient(to bottom, rgba(10,10,12,0.8) 0%, rgba(10,10,12,0.95) 100%)",
          zIndex: 1
        }}
      ></div>

      <div className="container position-relative text-center text-white" style={{ zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="d-flex flex-column align-items-center"
        >
          {/* Minimalist Logo */}
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            src="/logo-tcq-transparenteblanco.svg"
            alt="TCQ Club"
            className="mb-5"
            style={{ 
              height: '80px', 
              opacity: 0.9,
              filter: 'drop-shadow(0px 4px 15px rgba(0, 0, 0, 0.5))'
            }}
          />

          {/* Premium Typography */}
          <h1 
            className="fw-bold mb-3 text-uppercase" 
            style={{ 
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              letterSpacing: '8px',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            TCQ <span style={{ color: '#8c8c8c' }}>CLUB</span>
          </h1>

          <div 
            style={{ 
              width: '40px', 
              height: '2px', 
              backgroundColor: '#FF0055', 
              margin: '2rem auto' 
            }} 
          />

          <p 
            className="mb-5 text-uppercase" 
            style={{ 
              letterSpacing: '5px', 
              fontSize: '0.9rem',
              color: '#a0a0a0',
              fontWeight: 300
            }}
          >
            Cultura Techno · Buenos Aires
          </p>
          
          {/* Sharp Brutalist Buttons */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="d-flex gap-4 justify-content-center flex-wrap mt-3"
          >
            <a 
              href="https://app.tcqlub.com" 
              className="btn btn-dark text-white rounded-0 px-5 py-3 text-uppercase position-relative overflow-hidden group"
              style={{ 
                letterSpacing: '2px',
                fontSize: '0.85rem',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                backgroundColor: 'rgba(0,0,0,0.6)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = 'black';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
                e.currentTarget.style.color = 'white';
              }}
            >
              Billetera Cashless
            </a>

            <a 
              href="https://venti.com.ar/organizadores/tcq" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn text-white rounded-0 px-5 py-3 text-uppercase"
              style={{ 
                letterSpacing: '2px',
                fontSize: '0.85rem',
                border: '1px solid transparent',
                borderBottom: '1px solid #FF0055',
                transition: 'all 0.3s ease',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,0,85,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Tickets
            </a>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
