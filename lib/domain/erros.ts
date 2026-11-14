// Caderno de erros (CLAUDE.md §4.6): itens cuja ÚLTIMA resposta foi errada. Funções puras.
// No banco a mesma regra é o DISTINCT ON de lib/db/erros.ts; aqui ela fica testável.

import { fracaoLembrada, type Nota } from "./procedimento";

type Passo = { id: string; texto: string };
export type RespostaParaCaderno = {
  id: string;
  questaoId: string;
  respondidaEm: Date;
  acertou: boolean;
  checklist?: { passos: Passo[] } | null;
  notas?: { passoId: string; nota: Nota }[] | null;
};

/** Textos dos passos esquecidos, na ordem do checklist atual (passo apagado depois da conferência some). */
export function passosEsquecidos(passos: Passo[], notas: { passoId: string; nota: Nota }[]) {
  const nota = new Map(notas.map((n) => [n.passoId, n.nota]));
  return passos.filter((p) => nota.get(p.id) === "esqueci").map((p) => p.texto);
}

/**
 * Última resposta de cada questão; ficam só as erradas, do erro mais recente para o mais antigo.
 * Procedimento ganha `fracao` e `esquecidos` daquela tentativa (null em questão).
 * Empate de horário: decide o id (mesma ordem do ORDER BY da query).
 */
export function cadernoDeErros<T extends RespostaParaCaderno>(respostas: T[]) {
  const recente = (a: T, b: T) => b.respondidaEm.getTime() - a.respondidaEm.getTime() || (b.id < a.id ? -1 : b.id > a.id ? 1 : 0);
  const ultima = new Map<string, T>();
  for (const r of [...respostas].sort(recente)) if (!ultima.has(r.questaoId)) ultima.set(r.questaoId, r);
  return [...ultima.values()]
    .filter((r) => !r.acertou)
    .map((r) => ({
      ...r,
      fracao: r.notas ? fracaoLembrada(r.notas.map((n) => n.nota)) : null,
      esquecidos: r.notas && r.checklist ? passosEsquecidos(r.checklist.passos, r.notas) : null,
    }));
}
