import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import {
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaInstagram,
  FaSoundcloud,
  FaSpotify,
  FaFacebookF,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { SiBandcamp } from "react-icons/si";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./ArtistProfile.css";

export default function ArtistProfile({
  nombre = "",
  bio = "",
  images = [],
  redes = null,
  presskit = null,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);


  // Normaliza 'redes' a array [{ nombre, url }]
  const redesList = Array.isArray(redes)
    ? redes
    : redes && typeof redes === "object"
      ? Object.entries(redes).map(([k, v]) => ({ nombre: k, url: v }))
      : [];

  // Devuelve componente icono según nombre/url
  const getIcon = (name = "", url = "") => {
    const key = String(name || url).toLowerCase();
    if (key.includes("instagram")) return <FaInstagram />;
    if (key.includes("soundcloud")) return <FaSoundcloud />;
    if (key.includes("spotify")) return <FaSpotify />;
    if (key.includes("facebook")) return <FaFacebookF />;
    if (key.includes("twitter")) return <FaTwitter />;
    if (key.includes("youtube") || key.includes("yt")) return <FaYoutube />;
    if (key.includes("bandcamp")) return <SiBandcamp />;
    // fallback by url
    if (String(url).includes("instagram.com")) return <FaInstagram />;
    if (String(url).includes("soundcloud.com")) return <FaSoundcloud />;
    if (String(url).includes("spotify.com")) return <FaSpotify />;
    if (String(url).includes("facebook.com")) return <FaFacebookF />;
    if (String(url).includes("twitter.com")) return <FaTwitter />;
    if (String(url).includes("youtube.com")) return <FaYoutube />;
    if (String(url).includes("bandcamp.com")) return <SiBandcamp />;
    return null;
  };

  // Lightbox controls
  const openLightbox = (i) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = (e) => {
    e && e.stopPropagation();
    setLightboxIndex((p) => (p === null ? 0 : (p + 1) % images.length));
  };
  const prevImage = (e) => {
    e && e.stopPropagation();
    setLightboxIndex((p) =>
      p === null ? Math.max(images.length - 1, 0) : (p - 1 + images.length) % images.length
    );
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, images.length]);

  // Flechas personalizadas para react-slick
  const PrevArrow = ({ onClick }) => (
    <button type="button" className="custom-arrow prev" aria-label="Anterior" onClick={onClick}>
      <FaChevronLeft />
    </button>
  );
  const NextArrow = ({ onClick }) => (
    <button type="button" className="custom-arrow next" aria-label="Siguiente" onClick={onClick}>
      <FaChevronRight />
    </button>
  );

  const settings = {
    dots: true,
    infinite: images.length > 3,
    speed: 500,
    slidesToShow: Math.min(3, Math.max(1, images.length)),
    slidesToScroll: 1,
    adaptiveHeight: true,
    swipeToSlide: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: Math.min(2, images.length) } },
      { breakpoint: 768, settings: { slidesToShow: 1, arrows: true } },
    ],
  };

  return (
    <div className="artist-profile">
      <h2 className="artist-name">{nombre}</h2>

      <div className="artist-carousel" aria-hidden={lightboxIndex !== null}>
        {images && images.length > 0 ? (
          <Slider {...settings}>
            {images.map((src, i) => (
              <div
                key={i}
                className="carousel-slide-inner"
                onMouseEnter={() => !isMobile && setHoveredIndex(i)}
                onMouseLeave={() => !isMobile && setHoveredIndex(null)}
                onClick={() => {
                  if (isMobile) {
                    if (hoveredIndex === i) openLightbox(i); // segundo tap -> abre lightbox
                    else setHoveredIndex(i); // primer tap -> muestra overlay
                  } else {
                    openLightbox(i);
                  }
                }}
              >
                <img
                  className="carousel-img"
                  src={src}
                  alt={`${nombre} ${i + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </Slider>
        ) : (
          <div className="carousel-placeholder">No hay imágenes</div>
        )}
      </div>

      <p className="artist-bio">{bio}</p>

      <div className="artist-redes" aria-label="Redes sociales">
        {redesList.map((r, i) => {
          const icon = getIcon(r.nombre, r.url);
          return (
            <a
              key={i}
              className="social-link"
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={r.nombre}
            >
              {icon ?? r.nombre}
            </a>
          );
        })}
      </div>

      {presskit && (
        <div className="mt-4">
          <a className="btn-presskit" href={presskit} target="_blank" rel="noopener noreferrer">
            Descargar Presskit
          </a>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="lightbox-overlay" onClick={closeLightbox} role="dialog" aria-modal="true">
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Cerrar">
              <FaTimes />
            </button>

            <img
              className="lightbox-img"
              src={images[lightboxIndex]}
              alt={`${nombre} ${lightboxIndex + 1}`}
            />

            <button className="lightbox-prev" onClick={prevImage} aria-label="Anterior">
              <FaChevronLeft />
            </button>

            <button className="lightbox-next" onClick={nextImage} aria-label="Siguiente">
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
