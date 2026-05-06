import React, { useEffect, useState } from "react";

export default function WelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem("welcome_shown");
    if (!hasVisited) {
      setShow(true);
      localStorage.setItem("welcome_shown", "true");
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="modal fade show"
      style={{ display: "block", background: "rgba(0,0,0,0.7)" }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-white text-center p-4">
          <h2 className="mb-3">TE DAMOS LA BIENVENIDA</h2>
          <p className="mb-3">
            ESTE VIERNES RADIO MINAU , Sab ACID D 12 HORAS DE VINILOS - MINAU RADIO & FIESTA MEMENTO MORI (Frctl Bar)
          </p>
          <button
            className="btn-modern w-100"
            onClick={() => setShow(false)}
          >
            Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
