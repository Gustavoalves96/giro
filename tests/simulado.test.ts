import { describe, expect, it } from "vitest";
import { corrigirSimulado, relogio, rngDeSemente, segundosRestantes, sortearIds } from "@/lib/domain/simulado";

describe("corrigirSimulado", () => {
  const itens = [
    { id: "a", gabarito: "A" },
    { id: "b", gabarito: "V" },
    { id: "c", gabarito: "C" },
    { id: "d", gabarito: "F" },
  ];

  it("acerto, erro e em branco (branco conta como erro na nota)", () => {
    const r = corrigirSimulado(itens, { a: "A", b: "F", d: "F" });
    expect(r.porQuestao.map((p) => p.situacao)).toEqual(["acertou", "errou", "branco", "acertou"]);
    expect(r).toMatchObject({ acertos: 2, total: 4, emBranco: 1, nota: 5, pontos: 20 });
  });

  it("null é em branco; nota com uma casa", () => {
    const tres = itens.slice(0, 3);
    expect(corrigirSimulado(tres, { a: "A", b: null }).nota).toBe(3.3);
    expect(corrigirSimulado(tres, { a: "A", b: "V", c: "C" })).toMatchObject({ nota: 10, pontos: 30, emBranco: 0 });
  });

  it("prova vazia e resposta de questão fora da prova", () => {
    expect(corrigirSimulado([], { x: "A" })).toMatchObject({ acertos: 0, total: 0, nota: 0, pontos: 0 });
  });
});

describe("sortearIds", () => {
  it("n distintos da lista; n maior que a lista devolve todos", () => {
    const ids = ["1", "2", "3", "4", "5"];
    const s = sortearIds(ids, 3, rngDeSemente("x"));
    expect(s).toHaveLength(3);
    expect(new Set(s).size).toBe(3);
    expect(s.every((i) => ids.includes(i))).toBe(true);
    expect(sortearIds(ids, 9).sort()).toEqual(ids);
  });
});

describe("rngDeSemente", () => {
  it("mesma semente, mesma sequência; entre 0 e 1", () => {
    const a = rngDeSemente("sessao:questao");
    const b = rngDeSemente("sessao:questao");
    const xs = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(xs);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });
});

describe("tempo", () => {
  it("segundos restantes nunca negativos", () => {
    const ini = new Date("2026-11-14T12:00:00Z");
    expect(segundosRestantes(ini, 120, new Date("2026-11-14T12:00:30Z"))).toBe(90);
    expect(segundosRestantes(ini, 120, new Date("2026-11-14T12:05:00Z"))).toBe(0);
  });
  it("relógio m:ss", () => {
    expect(relogio(75)).toBe("1:15");
    expect(relogio(3600)).toBe("60:00");
    expect(relogio(0)).toBe("0:00");
  });
});
