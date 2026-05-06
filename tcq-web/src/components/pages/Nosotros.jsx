import React from "react";
import { motion } from "framer-motion";
import { NOSOTROS } from "../../data/nosotrosData";
import "./Styles/Nosotros.css";

export default function Nosotros() {
  return (
    <div className="nosotros-section">
      <div className="overlay"></div>

      <div className="container position-relative">
        {/* Título animado */}
        <motion.h1
          className="nosotros-title"
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          {NOSOTROS.titulo}
        </motion.h1>

        {/* Párrafos animados */}
        {NOSOTROS.parrafos.map((p, index) => (
          <motion.p
            key={index}
            className="nosotros-text"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.3 }}
          >
            {p.split(" ").map((word, i) => (
              <span key={i} className="highlight-word">{word} </span>
            ))}
          </motion.p>
        ))}
      </div>
    </div>
  );
}
