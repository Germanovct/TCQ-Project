import React from "react";
import Particles from "react-tsparticles";

export default function ParticlesBackground({ className }) {
  return (
    <Particles
      className={className}
      id="tsparticles"
      options={{
        background: { color: "transparent" },
        fpsLimit: 60,
        interactivity: {
          events: { 
            onHover: { enable: true, mode: "repulse" }, 
            onClick: { enable: true, mode: "push" } 
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
            push: { quantity: 4 }
          }
        },
        particles: {
          number: { value: 80, density: { enable: true, area: 800 } },
          color: { value: ["#ff004f", "#1db954", "#ffffff"] },
          shape: { type: "circle" },
          opacity: { value: 0.8 },
          size: { value: { min: 3, max: 6 } },
          move: { enable: true, speed: 1, direction: "none", random: true, outModes: { default: "bounce" } }
        }
      }}
    />
  );
}
