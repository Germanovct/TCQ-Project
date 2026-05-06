import React, { useEffect, useState } from "react";
import AdminLogin from "./AdminLogin";

export default function SubscribersAdmin() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("isAdmin") === "true");

  useEffect(() => {
    if (!isAdmin) return;

    const fetchSubs = async () => {
      try {
        const res = await fetch("https://tcq-backend.onrender.com/subscribers");
        const data = await res.json();
        setSubs(data);
      } catch (error) {
        console.error("❌ Error cargando suscriptores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, [isAdmin]);

  if (!isAdmin) return <AdminLogin onLogin={setIsAdmin} />;

  if (loading) return <p className="text-center mt-5">Cargando suscriptores...</p>;

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">📋 Lista de Suscriptores</h2>
      <button
        className="btn btn-secondary mb-3"
        onClick={() => {
          localStorage.removeItem("isAdmin");
          setIsAdmin(false);
        }}
      >
        Cerrar sesión
      </button>
      <div className="table-responsive">
        <table className="table table-striped table-bordered align-middle">
          <thead className="table-dark">
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
            {subs.map((s) => (
              <tr key={s._id}>
                <td>{s.nombre}</td>
                <td>{s.email}</td>
                <td>{s.ciudad || "-"}</td>
                <td>{s.edad || "-"}</td>
                <td>{s.intereses?.join(", ") || "-"}</td>
                <td>{new Date(s.date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
