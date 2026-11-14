// Roleta (CLAUDE.md §4.2): pesos, sorteio e geometria. Funções puras, sem banco.

export type Modo = "inteligente" | "sorte";

export type FatoresPeso = {
  dominio: number; // 0..100
  nuncaEstudado: boolean;
  estudadoUltimas24h: boolean;
  temProvaEm14Dias: boolean; // topicosComProvaEm14Dias (lib/domain/provas.ts)
};

export type Candidato = FatoresPeso & {
  topicoId: string;
  nome: string;
  disciplinaId: string;
  disciplina: string;
  cor: string;
  notebooklmUrl: string | null;
  novo: boolean; // sem nenhuma resposta: domínio exibido como "novo"
};

export type Fatia = Candidato & { peso: number };

export function pesoTopico(f: FatoresPeso) {
  let peso = 1 + (100 - f.dominio) / 25;
  if (f.nuncaEstudado) peso *= 1.5;
  if (f.temProvaEm14Dias) peso *= 2;
  if (f.estudadoUltimas24h) peso *= 0.5;
  return peso;
}

/** Texto do "Por que ele?" no modo Inteligente. */
export function motivoPeso(f: FatoresPeso) {
  const motivos: string[] = [];
  if (f.temProvaEm14Dias) motivos.push("tem prova nos próximos 14 dias");
  if (f.nuncaEstudado) motivos.push("nunca estudado");
  else if (f.dominio < 50) motivos.push("domínio baixo");
  if (f.estudadoUltimas24h) motivos.push("estudado nas últimas 24 h, então a chance era menor");
  if (!motivos.length) return "Saiu no sorteio ponderado: quanto menor o domínio, maior a fatia.";
  const texto = motivos.join(", ");
  return texto[0].toUpperCase() + texto.slice(1) + ".";
}

export const MOTIVO_SORTE = "Sorte pura: todos os tópicos tinham a mesma chance.";

export function motivoVazio(totalCandidatos: number) {
  return totalCandidatos === 0
    ? "Nenhum tópico tem questão ativa ainda. Crie questões para a roleta ganhar fatias."
    : "Nenhuma disciplina ligada tem tópicos com questões. Ligue pelo menos uma.";
}

const H24 = 24 * 60 * 60 * 1000;

/** Linha do banco → fatores de peso. "Nunca estudado" = sem ultima_vez_estudado. */
export function candidatoDe(
  l: Omit<Candidato, keyof FatoresPeso> & { dominio: number; ultimaVezEstudado: Date | null },
  agora: Date,
  comProva: ReadonlySet<string> = new Set(),
): Candidato {
  const { ultimaVezEstudado, ...resto } = l;
  return {
    ...resto,
    nuncaEstudado: ultimaVezEstudado === null,
    estudadoUltimas24h: ultimaVezEstudado !== null && agora.getTime() - ultimaVezEstudado.getTime() < H24,
    temProvaEm14Dias: comProva.has(l.topicoId),
  };
}

/** Filtra por disciplinas ligadas (e tópicos marcados, se houver) e dá o peso do modo. */
export function montarFatias(
  candidatos: Candidato[],
  modo: Modo,
  filtro: { disciplinaIds: string[]; topicoIds?: string[] },
): Fatia[] {
  const disc = new Set(filtro.disciplinaIds);
  const tops = filtro.topicoIds?.length ? new Set(filtro.topicoIds) : null;
  return candidatos
    .filter((c) => disc.has(c.disciplinaId) && (!tops || tops.has(c.topicoId)))
    .map((c) => ({ ...c, peso: modo === "sorte" ? 1 : pesoTopico(c) }));
}

/** Sorteio ponderado. rng devolve [0, 1). */
export function sortear<T extends { peso: number }>(itens: T[], rng: () => number = Math.random): T {
  if (!itens.length) throw new Error("Nada para sortear.");
  const total = itens.reduce((s, i) => s + i.peso, 0);
  let alvo = rng() * total;
  for (const item of itens) {
    alvo -= item.peso;
    if (alvo < 0) return item;
  }
  return itens[itens.length - 1]; // arredondamento de ponto flutuante
}

/** Início e fim de cada fatia em graus, no sentido horário a partir do topo (0°). */
export function limitesFatias(fatias: { peso: number }[]) {
  const total = fatias.reduce((s, f) => s + f.peso, 0);
  let acc = 0;
  return fatias.map((f) => {
    const inicio = (acc / total) * 360;
    acc += f.peso;
    return { inicio, fim: (acc / total) * 360 };
  });
}

/**
 * Índice da fatia sob o ponteiro (no topo) com a roda girada `angulo` graus no sentido horário.
 * Na fronteira exata, vale a fatia que começa ali.
 */
export function fatiaSobPonteiro(angulo: number, fatias: { peso: number }[]) {
  if (!fatias.length) return -1;
  const pos = (((-angulo % 360) + 360) % 360) % 360; // ponto da roda que está no topo
  const lim = limitesFatias(fatias);
  const i = lim.findIndex((l) => pos >= l.inicio && pos < l.fim);
  return i === -1 ? fatias.length - 1 : i;
}

/**
 * Ângulo final (sempre à frente de `atual`, com `voltas` voltas inteiras) em que o ponteiro cai
 * num ponto aleatório *dentro* da fatia `indice` (com margem das bordas).
 */
export function anguloFinal(
  atual: number,
  fatias: { peso: number }[],
  indice: number,
  voltas = 6,
  rng: () => number = Math.random,
) {
  const { inicio, fim } = limitesFatias(fatias)[indice];
  const margem = Math.min(3, (fim - inicio) * 0.2);
  const ponto = inicio + margem + rng() * (fim - inicio - 2 * margem);
  const delta = (((-ponto - atual) % 360) + 360) % 360;
  return atual + voltas * 360 + delta;
}
