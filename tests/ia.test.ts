import { ApiError } from "@google/genai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeminiProvider } from "@/lib/ai/gemini";
import { MSG_FALHA, MSG_LIMITE } from "@/lib/ai/mensagens";
import { type AIProvider, explicarComCache, getProvider, iaDisponivel, LimiteIA, type QuestaoParaIA } from "@/lib/ai/provider";
import { montarPromptExplicacao } from "@/lib/prompts/explicacao";

const q: QuestaoParaIA = {
  enunciado: "Qual a capital do Brasil?",
  alternativas: [
    { letra: "A", texto: "Brasília" },
    { letra: "B", texto: "Rio de Janeiro" },
  ],
  gabarito: "A",
  explicacao: "Brasília é a capital desde 1960.",
};

function memoria() {
  let salvo: string | null = null;
  return { ler: async () => salvo, salvar: vi.fn(async (t: string) => void (salvo = t)) };
}

function falso(impl: AIProvider["explicar"]) {
  return { explicar: vi.fn(impl) };
}

describe("explicarComCache", () => {
  it("sem OK dela não chama o provider; com OK chama, salva, e a segunda vez vem do cache", async () => {
    const cache = memoria();
    const p = falso(async () => "Explicação didática.");
    expect(await explicarComCache(q, false, cache, p)).toEqual({ ok: false, confirmar: true });
    expect(p.explicar).not.toHaveBeenCalled();

    expect(await explicarComCache(q, true, cache, p)).toEqual({ ok: true, texto: "Explicação didática." });
    expect(cache.salvar).toHaveBeenCalledOnce();

    expect(await explicarComCache(q, false, cache, p)).toEqual({ ok: true, texto: "Explicação didática." });
    expect(p.explicar).toHaveBeenCalledOnce();
  });

  it("LimiteIA vira a mensagem de limite diário e não salva nada", async () => {
    const cache = memoria();
    const r = await explicarComCache(q, true, cache, falso(async () => Promise.reject(new LimiteIA())));
    expect(r).toEqual({ ok: false, mensagem: MSG_LIMITE });
    expect(cache.salvar).not.toHaveBeenCalled();
  });

  it("erro de rede ou resposta vazia vira mensagem amigável", async () => {
    const cache = memoria();
    expect(await explicarComCache(q, true, cache, falso(async () => Promise.reject(new TypeError("fetch failed"))))).toEqual({
      ok: false,
      mensagem: MSG_FALHA,
    });
    expect(await explicarComCache(q, true, cache, falso(async () => "   "))).toEqual({ ok: false, mensagem: MSG_FALHA });
    expect(cache.salvar).not.toHaveBeenCalled();
  });

  it("cache vale mesmo sem provider (chave tirada depois)", async () => {
    const cache = memoria();
    await cache.salvar("Já explicada.");
    expect(await explicarComCache(q, false, cache, null)).toEqual({ ok: true, texto: "Já explicada." });
  });
});

describe("GeminiProvider", () => {
  it("429 da API vira LimiteIA; outros erros passam", async () => {
    const p = new GeminiProvider("chave-falsa");
    const gerar = vi.spyOn(p["ai"].models, "generateContent");
    gerar.mockRejectedValueOnce(new ApiError({ message: "quota", status: 429 }));
    await expect(p.explicar(q)).rejects.toBeInstanceOf(LimiteIA);
    gerar.mockRejectedValueOnce(new ApiError({ message: "erro", status: 500 }));
    await expect(p.explicar(q)).rejects.not.toBeInstanceOf(LimiteIA);
  });
});

describe("getProvider / iaDisponivel", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("sem GEMINI_API_KEY: null e indisponível", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(getProvider()).toBeNull();
    expect(iaDisponivel()).toBe(false);
  });
  it("com chave: provider Gemini", () => {
    vi.stubEnv("GEMINI_API_KEY", "x");
    expect(getProvider()).toBeInstanceOf(GeminiProvider);
    expect(iaDisponivel()).toBe(true);
  });
});

describe("montarPromptExplicacao", () => {
  it("leva enunciado, alternativas, gabarito e explicação, sem letras (a tela embaralha)", () => {
    const p = montarPromptExplicacao(q);
    for (const t of [q.enunciado, "- Brasília", "- Rio de Janeiro", "Resposta correta: Brasília", q.explicacao]) expect(p).toContain(t);
    expect(p).not.toMatch(/\b[A-E]\)/);
    const vf = montarPromptExplicacao({ ...q, alternativas: null, gabarito: "F" });
    expect(vf).toContain("- Verdadeiro\n- Falso");
    expect(vf).toContain("Resposta correta: Falso");
  });
});
