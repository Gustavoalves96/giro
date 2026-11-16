import { describe, expect, it } from "vitest";
import { eRetroativa, type Fatos, feitosDeSessoes, MEDALHAS, medalhasGanhas } from "@/lib/domain/conquistas";

const nada: Fatos = {
  sessoesFinalizadas: 0,
  xp: 0,
  respostas: 0,
  maiorSequencia: 0,
  rodadaPerfeita: false,
  simuladoDez: false,
  procedimentoPerfeito: false,
  topicoDominado: false,
  revisaoEmDia: false,
  cadernoVazio: false,
};

describe("medalhasGanhas", () => {
  it("conta nova não ganha nada", () => {
    expect(medalhasGanhas(nada)).toEqual([]);
  });

  it("marcos no limite exato", () => {
    expect(medalhasGanhas({ ...nada, sessoesFinalizadas: 1, maiorSequencia: 7, xp: 999, respostas: 100 })).toEqual([
      "primeiro-giro",
      "ofensiva-3",
      "ofensiva-7",
      "respostas-100",
    ]);
    expect(medalhasGanhas({ ...nada, xp: 1000 })).toEqual(["xp-1000"]);
  });

  it("ids únicos (são a chave no banco)", () => {
    expect(new Set(MEDALHAS.map((m) => m.id)).size).toBe(MEDALHAS.length);
  });
});

describe("feitosDeSessoes", () => {
  const fim = new Date();
  it("rodada perfeita só da roleta finalizada com 5+ questões", () => {
    expect(feitosDeSessoes([{ modo: "roleta", finalizadaEm: fim, acertos: 5, totalQuestoes: 5 }]).rodadaPerfeita).toBe(true);
    expect(feitosDeSessoes([{ modo: "roleta", finalizadaEm: fim, acertos: 4, totalQuestoes: 4 }]).rodadaPerfeita).toBe(false);
    expect(feitosDeSessoes([{ modo: "roleta", finalizadaEm: null, acertos: 5, totalQuestoes: 5 }]).rodadaPerfeita).toBe(false);
    expect(feitosDeSessoes([{ modo: "revisao", finalizadaEm: fim, acertos: 9, totalQuestoes: 9 }]).rodadaPerfeita).toBe(false);
  });
  it("nota 10 só em simulado de 10+ (em branco conta no total)", () => {
    expect(feitosDeSessoes([{ modo: "simulado", finalizadaEm: fim, acertos: 10, totalQuestoes: 10 }]).simuladoDez).toBe(true);
    expect(feitosDeSessoes([{ modo: "simulado", finalizadaEm: fim, acertos: 9, totalQuestoes: 10 }]).simuladoDez).toBe(false);
  });
});

describe("eRetroativa", () => {
  it("histórico antigo entra sem comemorar; conta nova comemora", () => {
    expect(eRetroativa(0, 12)).toBe(true);
    expect(eRetroativa(0, 1)).toBe(false);
    expect(eRetroativa(3, 12)).toBe(false);
  });
});
