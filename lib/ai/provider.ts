import type { Alternativa } from "@/lib/db/schema";
import { GeminiProvider } from "./gemini";
import { MSG_FALHA, MSG_LIMITE } from "./mensagens";

// IA opcional (CLAUDE.md §2 e §6): só "Explique melhor", por clique, com cache em explicacoes_ia.

/** Só o que a questão já mostra depois da resposta. Nada além disso vai para a API. */
export type QuestaoParaIA = {
  enunciado: string;
  alternativas: Alternativa[] | null; // null = verdadeiro/falso
  gabarito: string;
  explicacao: string;
};

export interface AIProvider {
  explicar(q: QuestaoParaIA): Promise<string>;
}

/** 429 do provedor: limite do plano gratuito. */
export class LimiteIA extends Error {
  constructor() {
    super("Limite de IA atingido");
    this.name = "LimiteIA";
  }
}

export const iaDisponivel = () => Boolean(process.env.GEMINI_API_KEY);

export function getProvider(): AIProvider | null {
  const chave = process.env.GEMINI_API_KEY;
  return chave ? new GeminiProvider(chave) : null;
}


export type Explicacao = { ok: true; texto: string } | { ok: false; confirmar: true } | { ok: false; mensagem: string };

/**
 * Cache primeiro: com texto salvo, devolve sem chamar a API nem pedir confirmação.
 * Sem cache, só chama com `confirmado` (o OK dela na tela) e salva o resultado.
 */
export async function explicarComCache(
  q: QuestaoParaIA,
  confirmado: boolean,
  cache: { ler: () => Promise<string | null>; salvar: (texto: string) => Promise<void> },
  provider: AIProvider | null,
): Promise<Explicacao> {
  const salvo = await cache.ler();
  if (salvo) return { ok: true, texto: salvo };
  if (!provider) return { ok: false, mensagem: MSG_FALHA };
  if (!confirmado) return { ok: false, confirmar: true };
  let texto: string;
  try {
    texto = (await provider.explicar(q)).trim();
  } catch (e) {
    return { ok: false, mensagem: e instanceof LimiteIA ? MSG_LIMITE : MSG_FALHA };
  }
  if (!texto) return { ok: false, mensagem: MSG_FALHA };
  await cache.salvar(texto);
  return { ok: true, texto };
}
