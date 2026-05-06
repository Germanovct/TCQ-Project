import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion"; // 🌀 Importamos Framer Motion
import API_BASE_URL from "../../config";

export default function Suscripcion() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    ciudad: "",
    edad: "",
    intereses: [],
  });
  const [toastVisible, setToastVisible] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        intereses: checked
          ? [...prev.intereses, value]
          : prev.intereses.filter((i) => i !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setToastVisible(true);
        setFormData({
          nombre: "",
          email: "",
          ciudad: "",
          edad: "",
          intereses: [],
        });
        setTimeout(() => setToastVisible(false), 4000);
      } else if (res.status === 409) {
        alert("⚠️ Este email ya está suscripto a TCQ Club.");
      } else if (res.status === 400) {
        alert("⚠️ Faltan datos obligatorios. Completá todos los campos.");
      } else {
        alert(`⚠️ Error: ${data.message || "Error en la suscripción."}`);
      }
    } catch (err) {
      console.error("❌ Error en fetch:", err);
      alert("❌ Error de conexión con el servidor.");
    }
  };

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">📝 Suscribite a TCQ Club</h2>

      <form
        onSubmit={handleSubmit}
        className="mx-auto"
        style={{ maxWidth: "600px" }}
      >
        <div className="mb-3">
          <input
            type="text"
            name="nombre"
            className="form-control"
            placeholder="Nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <input
            type="email"
            name="email"
            className="form-control"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <input
            type="text"
            name="ciudad"
            className="form-control"
            placeholder="Ciudad"
            value={formData.ciudad}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Edad</label>
          <select
            name="edad"
            className="form-select"
            value={formData.edad}
            onChange={handleChange}
          >
            <option value="">Seleccionar</option>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45+">45+</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Intereses</label>

          {["Eventos", "Merch", "Techno"].map((interes) => (
            <div className="form-check" key={interes}>
              <input
                type="checkbox"
                name="intereses"
                value={interes}
                checked={formData.intereses.includes(interes)}
                onChange={handleChange}
                className="form-check-input"
                id={`intereses-${interes}`}
              />
              <label
                className="form-check-label"
                htmlFor={`intereses-${interes}`}
              >
                {interes}
              </label>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-dark w-100">
          Suscribirse
        </button>
      </form>

      {/* 🟢 Toast animado con Framer Motion */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, x: 100, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="toast align-items-center text-bg-success border-0 position-fixed bottom-0 end-0 m-4 show shadow-lg"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            style={{ zIndex: 1055 }}
          >
            <div className="d-flex">
              <div className="toast-body">
                🎉 Gracias por sumarte a la familia <b>TCQ</b>, ¡Vamos por todo!!
              </div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToastVisible(false)}
              ></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
