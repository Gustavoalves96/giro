import { describe, expect, it } from "vitest";
import { topicosARecalcular } from "@/lib/domain/dominio";
import { notaDaResposta, notaDoProcedimento, proximoEstado, Rating } from "@/lib/domain/fsrs";

describe("notaDaResposta", () => {
  it("limites de tempo", () => {
    expect(notaDaResposta({ acertou: true, tempoMs: 14_900 })).toBe(Rating.Easy);
    expect(notaDaResposta({ acertou: true, tempoMs: 15_000 })).toBe(Rating.Good);
    expect(notaDaResposta({ acertou: true, tempoMs: 45_000 })).toBe(Rating.Good);
    expect(notaDaResposta({ acertou: true, tempoMs: 45_100 })).toBe(Rating.Hard);
  });
  it("erro é sempre Again", () => {
    for (const tempoMs of [1_000, 30_000, 120_000]) expect(notaDaResposta({ acertou: false, tempoMs })).toBe(Rating.Again);
  });
});

describe("notaDoProcedimento", () => {
  it("crítico esquecido → Again mesmo com fração alta", () => {
    expect(notaDoProcedimento({ fracao: 0.95, criticosEsquecidos: 1 })).toBe(Rating.Again);
  });
  it("limites de fração", () => {
    expect(notaDoProcedimento({ fracao: 0.49, criticosEsquecidos: 0 })).toBe(Rating.Again);
    expect(notaDoProcedimento({ fracao: 0.5, criticosEsquecidos: 0 })).toBe(Rating.Hard);
    expect(notaDoProcedimento({ fracao: 0.79, criticosEsquecidos: 0 })).toBe(Rating.Hard);
    expect(notaDoProcedimento({ fracao: 0.8, criticosEsquecidos: 0 })).toBe(Rating.Good);
    expect(notaDoProcedimento({ fracao: 1, criticosEsquecidos: 0 })).toBe(Rating.Easy);
  });
});

describe("proximoEstado", () => {
  const agora = new Date("2026-11-13T12:00:00Z");
  it("questão nova → due no futuro e reps = 1", () => {
    const e = proximoEstado(null, Rating.Good, agora);
    expect(e.due.getTime()).toBeGreaterThan(agora.getTime());
    expect(e.reps).toBe(1);
    expect(e.lastReview).toEqual(agora);
  });
  it("acertar de novo no vencimento empurra o due mais longe; errar conta lapso", () => {
    const e1 = proximoEstado(null, Rating.Good, agora);
    const e2 = proximoEstado(e1, Rating.Good, e1.due);
    expect(e2.reps).toBe(2);
    expect(e2.due.getTime() - e1.due.getTime()).toBeGreaterThan(e1.due.getTime() - agora.getTime());
    const e3 = proximoEstado(e2, Rating.Again, e2.due);
    expect(e3.lapses).toBe(1);
    expect(e3.due.getTime()).toBeGreaterThan(e2.due.getTime());
  });
});

describe("topicosARecalcular", () => {
  it("tópico da sessão + tópicos das respostas, sem repetição", () => {
    expect(topicosARecalcular("a", [{ topicoId: "b" }, { topicoId: "a" }, { topicoId: "b" }, { topicoId: "c" }])).toEqual(["a", "b", "c"]);
  });
  it("sessão sem tópico (revisão) usa só as respostas; roleta sem resposta usa só o tópico", () => {
    expect(topicosARecalcular(null, [{ topicoId: "x" }, { topicoId: "x" }])).toEqual(["x"]);
    expect(topicosARecalcular("a", [])).toEqual(["a"]);
    expect(topicosARecalcular(null, [])).toEqual([]);
  });
});
