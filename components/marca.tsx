// Marca: roleta de 4 quadrantes (Brasa/tinta), centro vazado, ponteiro dourado.
export function MarcaGiro({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 108" className={className} aria-hidden="true">
      <path d="M50 64 L50 24 A40 40 0 0 1 90 64 Z" className="fill-ac" />
      <path d="M50 64 L90 64 A40 40 0 0 1 50 104 Z" className="fill-ink" />
      <path d="M50 64 L50 104 A40 40 0 0 1 10 64 Z" className="fill-ac" />
      <path d="M50 64 L10 64 A40 40 0 0 1 50 24 Z" className="fill-ink" />
      <circle cx="50" cy="64" r="13" className="fill-bg" />
      <path d="M40 4 H60 L50 30 Z" className="fill-gold" />
    </svg>
  );
}
