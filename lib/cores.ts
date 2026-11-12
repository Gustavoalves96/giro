// Cores cheias do design (giro — especificação de design.md › Cores das disciplinas).
export const CORES_DISCIPLINA = [
  { nome: "Vermelho", hex: "#D93A49" },
  { nome: "Azul", hex: "#2F7BD1" },
  { nome: "Roxo", hex: "#7C4DD1" },
  { nome: "Laranja", hex: "#D4861A" },
  { nome: "Verde-azulado", hex: "#0F9488" },
  { nome: "Magenta", hex: "#C2408F" },
] as const;

// Texto sobre a tinta clara é sempre este, nos dois temas.
export const TEXTO_SOBRE_TINTA = "#15141F";

// Fatias e fundos: a cor cheia com ~80% de branco.
export function tintaClara(cor: string) {
  return `color-mix(in srgb, ${cor} 20%, white)`;
}
