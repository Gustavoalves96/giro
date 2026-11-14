import { ImageResponse } from "next/og";

// Ícone da tela de início do iPad (PNG: o iOS não usa SVG). Mesmo desenho de app/icon.svg, em fundo claro
// opaco (o iOS pinta de preto o que for transparente).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F5F7" }}>
        <svg width="132" height="143" viewBox="0 0 100 108">
          <path d="M50 64 L50 24 A40 40 0 0 1 90 64 Z" fill="#E8492A" />
          <path d="M50 64 L90 64 A40 40 0 0 1 50 104 Z" fill="#15141F" />
          <path d="M50 64 L50 104 A40 40 0 0 1 10 64 Z" fill="#E8492A" />
          <path d="M50 64 L10 64 A40 40 0 0 1 50 24 Z" fill="#15141F" />
          <circle cx="50" cy="64" r="13" fill="#F4F5F7" />
          <path d="M40 4 H60 L50 30 Z" fill="#E9A800" />
        </svg>
      </div>
    ),
    size,
  );
}
