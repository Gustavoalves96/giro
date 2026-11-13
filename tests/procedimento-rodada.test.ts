import { describe, expect, it } from "vitest";
import { pontosQuestao, resumoSessao } from "@/lib/domain/pontuacao";
import { avaliarProcedimento, type Nota, notasCobremPassos } from "@/lib/domain/procedimento";
import { selecionarRodada } from "@/lib/domain/selecao-questoes";

// 10 passos; o 1º é crítico
const passos = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, critico: i === 0 }));
const notas = (f: (i: number) => Nota) => Object.fromEntries(passos.map((p, i) => [p.id, f(i)]));

describe("avaliarProcedimento", () => {
  it("tudo lembrado → 1,0 e acertou", () => {
    expect(avaliarProcedimento(passos, notas(() => "lembrei"))).toEqual({ fracao: 1, criticosEsquecidos: [], acertou: true });
  });
  it("80% sem crítico esquecido → acertou", () => {
    const r = avaliarProcedimento(passos, notas((i) => (i >= 8 ? "esqueci" : "lembrei")));
    expect(r.fracao).toBeCloseTo(0.8);
    expect(r.acertou).toBe(true);
  });
  it("70% → não acertou", () => {
    expect(avaliarProcedimento(passos, notas((i) => (i >= 7 ? "esqueci" : "lembrei"))).acertou).toBe(false);
  });
  it("90% com um crítico esquecido → não acertou", () => {
    const r = avaliarProcedimento(passos, notas((i) => (i === 0 ? "esqueci" : "lembrei")));
    expect(r.fracao).toBeCloseTo(0.9);
    expect(r.criticosEsquecidos).toEqual(["p0"]);
    expect(r.acertou).toBe(false);
  });
  it("crítico com erro não conta como esquecido; com erro vale metade", () => {
    const r = avaliarProcedimento(passos, notas((i) => (i < 4 ? "com_erro" : "lembrei")));
    expect(r.fracao).toBeCloseTo(0.8); // 6 + 4 × 0,5
    expect(r.criticosEsquecidos).toEqual([]);
    expect(r.acertou).toBe(true);
  });
});

describe("notasCobremPassos", () => {
  const tres = [{ id: "a" }, { id: "b" }, { id: "c" }];
  it("exatamente os passos → aceita", () => {
    expect(notasCobremPassos(tres, { c: "esqueci", a: "lembrei", b: "com_erro" })).toBe(true);
  });
  it("faltando passo, passo a mais ou id desconhecido → recusa", () => {
    expect(notasCobremPassos(tres, { a: "lembrei", b: "lembrei" })).toBe(false);
    expect(notasCobremPassos(tres, { a: "lembrei", b: "lembrei", c: "lembrei", d: "lembrei" })).toBe(false);
    expect(notasCobremPassos(tres, { a: "lembrei", b: "lembrei", x: "lembrei" })).toBe(false);
  });
});

describe("pontuação com procedimento", () => {
  it("procedimento ignora o tempo e vale round(10 × fração)", () => {
    expect(pontosQuestao({ acertou: true, tempoMs: 0, fracao: 1, sequenciaAtual: 1 })).toBe(10);
    expect(pontosQuestao({ acertou: true, tempoMs: 600_000, fracao: 0.85, sequenciaAtual: 1 })).toBe(9);
    expect(pontosQuestao({ acertou: false, tempoMs: 0, fracao: 0.7, sequenciaAtual: 0 })).toBe(7); // crédito parcial
  });
  it("sequência mistura questão e procedimento", () => {
    const q = { acertou: true, tempoMs: 60_000 };
    const proc = { acertou: true, tempoMs: 5_000, fracao: 1 };
    // q, q, proc (3º seguido ×1,5), q (4º ×1,5)
    expect(resumoSessao([q, q, proc, q])).toEqual({ total: 10 + 10 + 15 + 15, acertos: 4, maiorSequencia: 4, sequencia: 4 });
    // procedimento que não passou quebra a sequência
    const falhou = { acertou: false, tempoMs: 0, fracao: 0.5 };
    expect(resumoSessao([q, q, falhou, q])).toEqual({ total: 10 + 10 + 5 + 10, acertos: 3, maiorSequencia: 2, sequencia: 1 });
  });
});

describe("selecionarRodada", () => {
  const agora = new Date("2026-11-13T12:00:00Z");
  const c = (id: string, tipo: string, respostas = 0) => ({ id, tipo, due: null, respostas, erros: 0 });
  it("no máximo 1 procedimento, mesma prioridade, total n", () => {
    const lista = [c("p1", "procedimento"), c("q1", "multipla_escolha"), c("p2", "procedimento"), c("q2", "caso_clinico", 1)];
    expect(selecionarRodada(lista, 5, agora, 1).map((x) => x.id)).toEqual(["p1", "q1", "q2"]);
  });
  it("procedimento já feito na rodada → nenhum outro", () => {
    expect(selecionarRodada([c("p1", "procedimento"), c("q1", "multipla_escolha")], 5, agora, 0).map((x) => x.id)).toEqual(["q1"]);
  });
  it("corta em n", () => {
    const lista = Array.from({ length: 8 }, (_, i) => c(`q${i}`, "multipla_escolha"));
    expect(selecionarRodada(lista, 5, agora, 1)).toHaveLength(5);
  });
});
