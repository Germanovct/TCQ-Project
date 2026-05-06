// src/components/pages/Vinyl.jsx
import React from 'react';
import ParticlesBackground from '../ParticlesBackground';

export default function Vinyl() {
  return (
    <>
      <ParticlesBackground />
      <div className="container text-center text-white page-content py-5">
        <h1 className="mb-4">Vinyl Order</h1>
        <p className="lead mb-5">Conseguí los mejores vinilos exclusivos de nuestro sello y artistas invitados.</p>
        
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card bg-dark text-white border-light h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Próximamente</h5>
                <p className="card-text flex-grow-1">
                  Estamos preparando el catálogo físico. ¡Mantenete al tanto en nuestras redes!
                </p>
                <button className="btn btn-outline-light mt-auto" disabled>
                  Catálogo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
