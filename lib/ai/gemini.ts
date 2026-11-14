import { ApiError, GoogleGenAI } from "@google/genai";
import { montarPromptExplicacao } from "@/lib/prompts/explicacao";
import { type AIProvider, LimiteIA, type QuestaoParaIA } from "./provider";

// Flash-Lite estável do plano gratuito (14/11/2026: o 3.8-flash deu 503/504 por demanda e o 3.6 levou ~20 s;
// este respondeu em ~1 s). Limites no painel do AI Studio.
export const MODELO_GEMINI = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 25_000; // função do Vercel Hobby: nada de request longo

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: TIMEOUT_MS } });
  }

  async explicar(q: QuestaoParaIA): Promise<string> {
    console.info(`[ia] chamada ao ${MODELO_GEMINI}`); // conta as chamadas reais no log (o cache não passa aqui)
    try {
      const r = await this.ai.models.generateContent({ model: MODELO_GEMINI, contents: montarPromptExplicacao(q) });
      return (r.text ?? "").replace(/\*\*/g, ""); // tela mostra texto puro
    } catch (e) {
      console.warn(`[ia] falha: ${e instanceof ApiError ? e.status : e instanceof Error ? e.name : "desconhecida"}`); // só o código, sem conteúdo
      if (e instanceof ApiError && e.status === 429) throw new LimiteIA();
      throw e;
    }
  }
}
