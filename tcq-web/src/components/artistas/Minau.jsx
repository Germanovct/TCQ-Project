import React from "react";
import ArtistProfile from "./ArtistProfile";
import { ARTISTAS } from "./artistasData";

export default function Minau() {
  const artista = ARTISTAS.find(a => a.nombre === "Minau");

  return (
    <ArtistProfile {...artista} />
  );
}
