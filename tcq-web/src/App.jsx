// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";

import Navbar from "./components/Navbar";

// Importamos las páginas
import Home from "./components/pages/Home";
import Label from "./components/pages/Label";
import Streaming from "./components/pages/Streaming";
import Vinyl from "./components/pages/Vinyl";
import Events from "./components/pages/Events";

export default function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vinyl" element={<Vinyl />} />
        <Route path="/label" element={<Label />} />
        <Route path="/streaming" element={<Streaming />} />
        <Route path="/events" element={<Events />} />
      </Routes>

      <footer className="footer-modern text-white text-center py-4">
        <div className="container">
          <p className="mb-1 small">
            © {new Date().getFullYear()} TCQ Club · Cultura Techno en Buenos Aires
          </p>
        </div>
      </footer>
    </Router>
  );
}
