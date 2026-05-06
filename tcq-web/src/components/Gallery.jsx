// src/components/Gallery.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const IMAGES = [
  { src: "/gallery/1.jpg", alt: "Fiesta techno 1" },
  { src: "/gallery/2.jpg", alt: "Fiesta techno 2" },
  { src: "/gallery/3.jpg", alt: "Ambiente club" },
  { src: "/gallery/4.jpg", alt: "Cabina DJ" },
];

export default function Gallery() {
  return (
    <section id="gallery" className="section bg-dark text-white">
      <div className="container">
        <h2 className="section-title text-center">Galería</h2>
        <p className="section-subtitle text-center">
          Un vistazo a nuestras noches más memorables en TCQ.
        </p>
      </div>

      <div className="container mt-4">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {IMAGES.map((img, i) => (
            <SwiperSlide key={i}>
              <div className="card-pro overflow-hidden">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-100"
                  style={{ height: 220, objectFit: "cover" }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
