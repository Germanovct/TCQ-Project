// src/pages/Home.jsx
import React from "react";

export default function Home() {
  return (
    <header
      id="home"
      className="vh-100 d-flex align-items-center justify-content-center text-center text-white position-relative"
      style={{
        backgroundImage: "url('/backgroundHero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="overlay"></div>
      <div className="container position-relative">
        <h1 className="hero-subtitle fade-in">
          Cultura Techno · Buenos Aires · Argentina
        </h1>
      </div>
    </header>
  );
}
