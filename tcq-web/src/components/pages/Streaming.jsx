// src/components/pages/Streaming.jsx
import React from "react";
import YouTubeLatest from "../YouTubeLatest";

export default function Streaming() {
  return (
    <div className="py-5 text-center">
      <div className="container">
        <h1>Streaming & Radio</h1>
        <p>
          En <strong>TCQ Club</strong> llevamos la música más allá de la pista.  
          Con nuestro canal de <strong>radio & streaming</strong>, 
          podés revivir nuestras <em>club nights</em> y acceder a sets 
          exclusivos de DJs locales e internacionales.  
          Conectamos Buenos Aires con el mundo a través del techno y el house.
        </p>

        {/* Último Video embebido */}
        <div className="mt-4">
          <YouTubeLatest />
        </div>
      </div>
    </div>
  );
}
