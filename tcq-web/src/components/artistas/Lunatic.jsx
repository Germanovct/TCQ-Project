import React from "react";
import ArtistProfile from "./ArtistProfile";
import { ARTISTAS } from "./artistasData";

export default function Lunatic() {
  const artista = ARTISTAS.find(a => a.nombre === "Lunatic");

  return (
    <ArtistProfile {...artista} />
  );
}