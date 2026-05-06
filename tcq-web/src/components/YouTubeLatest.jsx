import React, { useEffect, useState } from "react";

export default function YouTubeLatest() {
  const [video, setVideo] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/api/youtube/latest")
      .then((res) => res.json())
      .then((data) => {
        console.log("🎥 Respuesta backend:", data);
        if (data.videoId) {
          setVideo({
            id: data.videoId,
            title: data.title,
          });
        } else {
          // Fallback manual si la API no devuelve nada
          setVideo({
            id: "0OHG46VUJkI",
            title: "Último video TCQ",
          });
        }
      })
      .catch((err) => {
        console.error("❌ Error trayendo video:", err);
        setVideo({
          id: "0OHG46VUJkI",
          title: "Último video TCQ",
        });
      });
  }, []);

  if (!video) {
    return (
      <div className="text-center text-muted py-5">
        <p>Cargando último video...</p>
      </div>
    );
  }

  return (
    <section className="py-5 bg-black text-white text-center">
      <div className="container">
        <h2 className="mb-4">Minau Radio Streaming</h2>
        <div className="ratio ratio-16x9 mx-auto" style={{ maxWidth: "800px" }}>
          <iframe
            src={`https://www.youtube.com/embed/${video.id}`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </section>
  );
}
