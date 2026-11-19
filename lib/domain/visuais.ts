// Visuais desbloqueáveis (CLAUDE.md §4.7). Só os dados e a regra; o desenho fica nos componentes.
import { medalhaPorId } from "./conquistas";
import { nivel, TITULOS, tituloDoNivel } from "./nivel";

export type Libera = { nivel: number } | { medalha: string } | null; // null = livre desde o início

type Visual = { id: string; nome: string; libera: Libera };

/** O `id` é gravado no perfil: nunca renomear. O primeiro de cada lista é o padrão. */
export const ESTILOS_ROLETA = [
  { id: "classico", nome: "Clássico", libera: null },
  { id: "estetoscopio", nome: "Estetoscópio", libera: { nivel: 4 } },
  { id: "plantao", nome: "Plantão", libera: { medalha: "ofensiva-7" } },
  { id: "dupla-helice", nome: "Dupla hélice", libera: { medalha: "rodada-perfeita" } },
  { id: "ouro", nome: "Ouro", libera: { nivel: 12 } },
  { id: "aura", nome: "Aura", libera: { nivel: 42 } },
] as const satisfies Visual[];

export const MOLDURAS = [
  { id: "nenhuma", nome: "Sem moldura", libera: null },
  { id: "estetoscopio", nome: "Estetoscópio", libera: { nivel: 2 } },
  { id: "coracao", nome: "Coração", libera: { medalha: "ofensiva-3" } },
  { id: "microscopio", nome: "Microscópio", libera: { nivel: 6 } },
  { id: "cerebro", nome: "Cérebro", libera: { medalha: "respostas-100" } },
  { id: "pilula", nome: "Pílula", libera: { medalha: "caderno-vazio" } },
  { id: "coroa", nome: "Coroa", libera: { nivel: 20 } },
  { id: "aura", nome: "Aura", libera: { nivel: 42 } },
] as const satisfies Visual[];

export type EstiloRoleta = (typeof ESTILOS_ROLETA)[number]["id"];
export type Moldura = (typeof MOLDURAS)[number]["id"];
export type TipoVisual = "roleta" | "moldura";

export const visuaisDo = (tipo: TipoVisual): readonly Visual[] => (tipo === "roleta" ? ESTILOS_ROLETA : MOLDURAS);

export function liberado(libera: Libera, nivel: number, medalhas: ReadonlySet<string>) {
  if (!libera) return true;
  return "nivel" in libera ? nivel >= libera.nivel : medalhas.has(libera.medalha);
}

export function textoLibera(libera: Libera) {
  if (!libera) return "Livre";
  if ("nivel" in libera) return `Libera no nível ${libera.nivel} (${tituloDoNivel(libera.nivel)})`;
  return `Libera com a medalha “${medalhaPorId(libera.medalha)?.nome ?? libera.medalha}”`;
}

/**
 * Quantas recompensas a conta já desbloqueou: medalhas, títulos acima do primeiro e visuais não livres.
 * Só cresce (XP e medalhas não diminuem), então comparar com o número já visto basta para a bolinha.
 */
export function contarDesbloqueios(n: number, medalhas: ReadonlySet<string>) {
  const visuais = [...ESTILOS_ROLETA, ...MOLDURAS].filter((v) => v.libera && liberado(v.libera, n, medalhas)).length;
  return medalhas.size + TITULOS.filter((t) => t.nivel > 1 && n >= t.nivel).length + visuais;
}

/** Bolinha em Recompensas: há desbloqueio que ela ainda não viu na página. */
export function temNovidade(xp: number, medalhas: ReadonlySet<string>, vistas: number) {
  return contarDesbloqueios(nivel(xp).nivel, medalhas) > vistas;
}

/** Estilo salvo no perfil, ou o padrão se não houver (ou se o id não existir mais). */
export function estiloRoletaDe(id: string | null | undefined): EstiloRoleta {
  return ESTILOS_ROLETA.find((e) => e.id === id)?.id ?? ESTILOS_ROLETA[0].id;
}

export function molduraDe(id: string | null | undefined): Moldura {
  return MOLDURAS.find((m) => m.id === id)?.id ?? MOLDURAS[0].id;
}
