import type { MetadataRoute } from "next";

// "Adicionar à tela de início" no iPad: abre em tela cheia, já no Início.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Giro",
    short_name: "Giro",
    description: "Gire. Estude. Domine o tópico.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F5F7",
    theme_color: "#F4F5F7",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
