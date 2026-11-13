import { describe, expect, it } from "vitest";
import { pontosQuestao, resumoSessao } from "@/lib/domain/pontuacao";

describe("pontosQuestao", () => {
  it("0 s → 10 + 5", () => {
    expect(pontosQuestao({ acertou: true, tempoMs: 0, sequenciaAtual: 1 })).toBe(15);
  });
  it("60 s ou mais → sem bônus", () => {
    expect(pontosQuestao({ acertou: true, tempoMs: 60_000, sequenciaAtual: 1 })).toBe(10);
    expect(pontosQuestao({ acertou: true, tempoMs: 300_000, sequenciaAtual: 1 })).toBe(10);
  });
  it("bônus arredondado: 30 s → +3 (2,5 arredonda para cima)", () => {
    expect(pontosQuestao({ acertou: true, tempoMs: 30_000, sequenciaAtual: 1 })).toBe(13);
  });
  it("3º acerto seguido → ×1,5", () => {
    expect(pontosQuestao({ acertou: true, tempoMs: 0, sequenciaAtual: 2 })).toBe(15);
    expect(pontosQuestao({ acertou: true, tempoMs: 0, sequenciaAtual: 3 })).toBe(23); // 22,5
    expect(pontosQuestao({ acertou: true, tempoMs: 60_000, sequenciaAtual: 4 })).toBe(15);
  });
  it("erro = 0, mesmo rápido e em sequência", () => {
    expect(pontosQuestao({ acertou: false, tempoMs: 0, sequenciaAtual: 5 })).toBe(0);
  });
});

describe("resumoSessao", () => {
  const ok = (tempoMs = 60_000) => ({ acertou: true, tempoMs });
  const erro = { acertou: false, tempoMs: 1000 };

  it("soma pontos, acertos e maior sequência", () => {
    expect(resumoSessao([ok(), ok(), ok(), erro, ok()])).toEqual({
      total: 10 + 10 + 15 + 0 + 10,
      acertos: 4,
      maiorSequencia: 3,
      sequencia: 1,
    });
  });
  it("sequência quebrada zera o multiplicador", () => {
    // 3º acerto depois do erro não é o 3º seguido
    expect(resumoSessao([ok(), ok(), erro, ok()]).total).toBe(30);
    expect(resumoSessao([ok(), ok(), erro, ok(), ok(), ok()]).total).toBe(10 + 10 + 10 + 10 + 15);
  });
  it("vazio", () => {
    expect(resumoSessao([])).toEqual({ total: 0, acertos: 0, maiorSequencia: 0, sequencia: 0 });
  });
});
