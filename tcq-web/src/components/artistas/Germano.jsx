import React from "react";
import ArtistProfile from "./ArtistProfile";
import { ARTISTAS } from "./artistasData";

export default function Germano() {
  const artista = ARTISTAS.find(a => a.nombre === "Germano");

  return (
    <ArtistProfile {...artista} />
  );
}