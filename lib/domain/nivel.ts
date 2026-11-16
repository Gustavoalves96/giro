/** Do nível n para o n+1 são `XP_POR_NIVEL × n` XP. */
export const XP_POR_NIVEL = 80;

/** Títulos por faixa: cada um vale do seu nível até o próximo da lista. */
export const TITULOS = [
  { nivel: 1, titulo: "Ciclo básico" },
  { nivel: 4, titulo: "Ciclo clínico" },
  { nivel: 8, titulo: "Internato" },
  { nivel: 12, titulo: "R1" },
  { nivel: 16, titulo: "R2" },
  { nivel: 20, titulo: "R3" },
  { nivel: 25, titulo: "Especialista" },
  { nivel: 30, titulo: "Preceptoria" },
  { nivel: 40, titulo: "Referência" },
  { nivel: 42, titulo: "Dr/a. Aura" },
] as const;

/** XP total para chegar ao nível n: 40·n·(n−1). */
export function xpParaNivel(n: number) {
  return (XP_POR_NIVEL / 2) * n * (n - 1);
}

export function tituloDoNivel(n: number) {
  return TITULOS.findLast((t) => t.nivel <= n)?.titulo ?? TITULOS[0].titulo;
}

/** Nível pelo XP total. `xpNoNivel` de `xpDoNivel` é o caminho até o próximo nível. */
export function nivel(xp: number) {
  const total = Math.max(0, Math.floor(xp));
  // inverso de xpParaNivel; nos limites 1 + 4n(n−1) = (2n−1)² é quadrado perfeito, então a raiz é exata
  const n = Math.floor((1 + Math.sqrt(1 + total / (XP_POR_NIVEL / 8))) / 2);
  return { nivel: n, titulo: tituloDoNivel(n), xpNoNivel: total - xpParaNivel(n), xpDoNivel: XP_POR_NIVEL * n };
}
