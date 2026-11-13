import { describe, expect, it } from "vitest";
import type { Alternativa } from "@/lib/db/schema";
import { embaralharAlternativas, opcoesDaQuestao, selecionarQuestoes } from "@/lib/domain/selecao-questoes";

const agora = new Date("2026-11-13T12:00:00Z");
const antes = (h: number) => new Date(agora.getTime() - h * 3_600_000);
const depois = (h: number) => new Date(agora.getTime() + h * 3_600_000);

describe("selecionarQuestoes", () => {
  const c = [
    { id: "acertada", due: depois(48), respostas: 3, erros: 0 },
    { id: "errada-1", due: depois(24), respostas: 2, erros: 1 },
    { id: "nova", due: null, respostas: 0, erros: 0 },
    { id: "vencida-recente", due: antes(1), respostas: 1, erros: 0 },
    { id: "errada-3", due: depois(2), respostas: 4, erros: 3 },
    { id: "vencida-antiga", due: antes(30), respostas: 2, erros: 2 },
  ];

  it("vencidas (mais antiga primeiro) → nunca respondidas → mais erradas", () => {
    expect(selecionarQuestoes(c, 10, agora).map((q) => q.id)).toEqual([
      "vencida-antiga",
      "vencida-recente",
      "nova",
      "errada-3",
      "errada-1",
      "acertada",
    ]);
  });
  it("vencida exatamente agora conta como vencida", () => {
    expect(selecionarQuestoes([...c, { id: "agora", due: agora, respostas: 1, erros: 0 }], 3, agora).map((q) => q.id)).toEqual([
      "vencida-antiga",
      "vencida-recente",
      "agora",
    ]);
  });
  it("corta em N e não altera a lista recebida", () => {
    const copia = [...c];
    expect(selecionarQuestoes(c, 2, agora)).toHaveLength(2);
    expect(c).toEqual(copia);
  });
});

describe("embaralharAlternativas", () => {
  const alts: Alternativa[] = ["A", "B", "C", "D", "E"].map((letra) => ({
    letra: letra as Alternativa["letra"],
    texto: `texto ${letra}`,
  }));
  // rng fixo que embaralha de verdade
  const seq = [0.1, 0.9, 0.3, 0.7];
  const rng = () => seq.shift() ?? 0.5;

  it("reetiqueta A–E e o mapa volta para a letra original", () => {
    const { alternativas, mapa } = embaralharAlternativas(alts, rng);
    expect(alternativas.map((a) => a.letra)).toEqual(["A", "B", "C", "D", "E"]);
    expect(alternativas.map((a) => a.texto)).not.toEqual(alts.map((a) => a.texto));
    for (const a of alternativas) expect(a.texto).toBe(`texto ${mapa[a.letra]}`);
    expect(new Set(Object.values(mapa)).size).toBe(5);
  });
  it("com menos de 5 alternativas usa só A..", () => {
    const { alternativas } = embaralharAlternativas(alts.slice(0, 3));
    expect(alternativas.map((a) => a.letra)).toEqual(["A", "B", "C"]);
  });
});

describe("opcoesDaQuestao", () => {
  it("V/F: Verdadeiro e Falso, sem embaralhar", () => {
    expect(opcoesDaQuestao(null).map((o) => o.valor)).toEqual(["V", "F"]);
  });
  it("múltipla escolha: valor é a letra original do texto", () => {
    const alts: Alternativa[] = [
      { letra: "A", texto: "um" },
      { letra: "B", texto: "dois" },
    ];
    for (const o of opcoesDaQuestao(alts)) expect(alts.find((a) => a.letra === o.valor)?.texto).toBe(o.texto);
  });
});
