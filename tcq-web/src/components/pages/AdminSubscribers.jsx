import React, { useEffect, useState } from "react";

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState([]);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await fetch("https://tcq-backend.onrender.com/subscribers");
        const data = await res.json();
        setSubscribers(data);
      } catch (err) {
        console.error("❌ Error al obtener suscriptores:", err);
      }
    };

    fetchSubscribers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin"); // borra la sesión
    window.location.href = "/admin/login"; // redirige al login
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📋 Lista de Suscriptores</h2>
        <button className="btn btn-danger" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>

      {subscribers.length === 0 ? (
        <p>No hay suscriptores todavía.</p>
      ) : (
        <table className="table table-dark table-striped">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Ciudad</th>
              <th>Edad</th>
              <th>Intereses</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.nombre}</td>
                <td>{sub.email}</td>
                <td>{sub.ciudad || "-"}</td>
                <td>{sub.edad || "-"}</td>
                <td>
                  {sub.intereses && sub.intereses.length > 0
                    ? sub.intereses.join(", ")
                    : "-"}
                </td>
                <td>{new Date(sub.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
