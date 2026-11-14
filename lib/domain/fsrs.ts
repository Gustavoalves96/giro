import { createEmptyCard, fsrs, type Grade, Rating } from "ts-fsrs";
import type { Revisao } from "@/lib/db/schema";

// Repetição espaçada (CLAUDE.md §4.5). Funções puras; o banco guarda o estado em `revisoes`.

// Sem passos de aprendizado em minutos: `revisoes` não tem coluna para a posição no passo e a revisão é diária.
const agendador = fsrs({ learning_steps: [], relearning_steps: [] });

export { Rating };
export type Estado = Omit<Revisao, "questaoId">;

/** Questão: errou → Again; acertou e > 45 s → Hard; < 15 s → Easy; senão Good. */
export function notaDaResposta({ acertou, tempoMs }: { acertou: boolean; tempoMs: number }): Grade {
  if (!acertou) return Rating.Again;
  if (tempoMs > 45_000) return Rating.Hard;
  if (tempoMs < 15_000) return Rating.Easy;
  return Rating.Good;
}

/** Procedimento (sem pressão de tempo): crítico esquecido ou < 0,5 → Again; < 0,8 → Hard; < 1 → Good; 1 → Easy. */
export function notaDoProcedimento({ fracao, criticosEsquecidos }: { fracao: number; criticosEsquecidos: number }): Grade {
  if (criticosEsquecidos > 0 || fracao < 0.5) return Rating.Again;
  if (fracao < 0.8) return Rating.Hard;
  if (fracao < 1) return Rating.Good;
  return Rating.Easy;
}

/** Próximo estado depois de uma resposta. `atual` null = item nunca agendado. */
export function proximoEstado(atual: Estado | null, nota: Grade, agora: Date): Estado {
  const card = atual
    ? {
        due: atual.due,
        stability: atual.stability,
        difficulty: atual.difficulty,
        elapsed_days: atual.elapsedDays,
        scheduled_days: atual.scheduledDays,
        learning_steps: 0,
        reps: atual.reps,
        lapses: atual.lapses,
        state: atual.state,
        last_review: atual.lastReview ?? undefined,
      }
    : createEmptyCard(agora);
  const { card: c } = agendador.next(card, agora, nota);
  return {
    due: c.due,
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    lastReview: c.last_review ?? agora,
  };
}
