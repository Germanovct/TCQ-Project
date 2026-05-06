import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "./Booking.css";

export default function Booking() {
  const artistas = [
    {
      id: 1,
      nombre: "Minau",
      imagen: "/images/minau.jpg",
      link: "/artistas/minau",
    },
    {
      id: 2,
      nombre: "Germano",
      imagen: "/images/ger.jpg",
      link: "/artistas/germano",
    },
    {
      id: 3,
      nombre: "Lunatic",
      imagen: "/images/lunatic.jpg",
      link: "/artistas/lunatic",
    },
  ];

  return (
    <div className="booking-section">
      <div className="container">
        <h1 className="titulo">Nuestros artistas</h1>
        <p className="intro">
          Conocé a los DJs y productores que forman parte de la escena{" "}
          <strong>TCQ Club</strong>.
        </p>

        <div className="grilla-artistas">
          {artistas.map((artista) => (
            <motion.div
              key={artista.id}
              className="tarjeta-artista"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="imagen-wrapper">
                <img src={artista.imagen} alt={artista.nombre} />
                <motion.div
                  className="overlay"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3>{artista.nombre}</h3>
                  <Link to={artista.link} className="boton-info">
                    Más información
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
