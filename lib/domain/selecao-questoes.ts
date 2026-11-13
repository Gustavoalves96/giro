// Seleção das questões da sessão e embaralhamento das alternativas (CLAUDE.md §4.3 passo 3). Funções puras.
import type { Alternativa } from "@/lib/db/schema";
import { LETRAS } from "@/lib/import/schemas";

export type Candidata = { id: string; due: Date | null; respostas: number; erros: number };

// 0 = revisão vencida, 1 = nunca respondida, 2 = o resto (mais erradas primeiro)
function grupo(c: Candidata, agora: Date) {
  if (c.due && c.due <= agora) return 0;
  return c.respostas === 0 ? 1 : 2;
}

/** Ordena por (1) revisão vencida, (2) nunca respondida, (3) mais erradas, e corta em `n`. */
export function selecionarQuestoes<T extends Candidata>(candidatas: T[], n: number, agora: Date): T[] {
  return [...candidatas]
    .sort(
      (a, b) =>
        grupo(a, agora) - grupo(b, agora) ||
        (a.due && b.due && grupo(a, agora) === 0 ? a.due.getTime() - b.due.getTime() : 0) ||
        b.erros - a.erros,
    )
    .slice(0, n);
}

/** Embaralha e reetiqueta A–E na exibição; `mapa[letraExibida]` = letra original (a que vai para o servidor). */
export function embaralharAlternativas(alternativas: Alternativa[], rng: () => number = Math.random) {
  const a = [...alternativas];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return {
    alternativas: a.map((alt, i) => ({ letra: LETRAS[i], texto: alt.texto })),
    mapa: Object.fromEntries(a.map((alt, i) => [LETRAS[i], alt.letra])) as Record<string, Alternativa["letra"]>,
  };
}

/** Uma linha da questão na tela. `valor` = letra original (ou V/F), o que o servidor confere. */
export type Opcao = { letra: string; texto: string; valor: Alternativa["letra"] | "V" | "F" };

const VERDADEIRO_FALSO: Opcao[] = [
  { letra: "V", texto: "Verdadeiro", valor: "V" },
  { letra: "F", texto: "Falso", valor: "F" },
];

export function opcoesDaQuestao(alternativas: Alternativa[] | null, rng: () => number = Math.random): Opcao[] {
  if (!alternativas?.length) return VERDADEIRO_FALSO;
  const { alternativas: exibidas, mapa } = embaralharAlternativas(alternativas, rng);
  return exibidas.map((a) => ({ ...a, valor: mapa[a.letra] }));
}
