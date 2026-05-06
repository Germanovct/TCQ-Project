// src/components/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_KEY) {
      localStorage.setItem("isAdmin", "true"); // ✅ guarda sesión
      navigate("/admin/subscribers"); // ✅ redirige a admin
    } else {
      setError("Clave incorrecta");
    }
  };

  return (
    <div className="container py-5 text-center">
      <h2 className="mb-4">🔐 Acceso Admin</h2>
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: "400px", margin: "0 auto" }}
      >
        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Ingrese clave"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-danger">{error}</p>}
        <button type="submit" className="btn btn-dark w-100">
          Ingresar
        </button>
      </form>
    </div>
  );
}
