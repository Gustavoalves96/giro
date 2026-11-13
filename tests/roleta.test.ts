import { describe, expect, it } from "vitest";
import {
  anguloFinal,
  candidatoDe,
  fatiaSobPonteiro,
  montarFatias,
  motivoPeso,
  pesoTopico,
  sortear,
  type Candidato,
} from "@/lib/domain/roleta";

const base = { dominio: 50, nuncaEstudado: false, estudadoUltimas24h: false, temProvaEm14Dias: false };

describe("pesoTopico", () => {
  it("novo: domínio 0 e nunca estudado → (1 + 4) × 1,5", () => {
    expect(pesoTopico({ ...base, dominio: 0, nuncaEstudado: true })).toBe(7.5);
  });
  it("domínio 100 → 1", () => {
    expect(pesoTopico({ ...base, dominio: 100 })).toBe(1);
  });
  it("estudado nas últimas 24 h → metade", () => {
    expect(pesoTopico({ ...base, estudadoUltimas24h: true })).toBe(1.5);
  });
  it("combina fatores: domínio 50, prova em 14 dias e estudado < 24 h", () => {
    expect(pesoTopico({ ...base, temProvaEm14Dias: true, estudadoUltimas24h: true })).toBe(3);
  });
});

describe("motivoPeso", () => {
  it("explica novo e domínio baixo", () => {
    expect(motivoPeso({ ...base, dominio: 0, nuncaEstudado: true })).toBe("Nunca estudado.");
    expect(motivoPeso({ ...base, dominio: 30 })).toBe("Domínio baixo.");
  });
  it("tem texto padrão sem fator especial", () => {
    expect(motivoPeso({ ...base, dominio: 80 })).toMatch(/ponderado/);
  });
});

describe("sortear", () => {
  const itens = [
    { id: "a", peso: 1 },
    { id: "b", peso: 3 },
    { id: "c", peso: 1 },
  ];
  it("cai no item esperado com rng fixo", () => {
    expect(sortear(itens, () => 0).id).toBe("a");
    expect(sortear(itens, () => 0.2).id).toBe("b"); // 1,0 de 5 → começo de b
    expect(sortear(itens, () => 0.79).id).toBe("b");
    expect(sortear(itens, () => 0.8).id).toBe("c");
    expect(sortear(itens, () => 0.999999).id).toBe("c");
  });
  it("sorte pura: pesos iguais dividem o intervalo por igual", () => {
    const iguais = ["x", "y", "z", "w"].map((id) => ({ id, peso: 1 }));
    expect([0.1, 0.3, 0.6, 0.9].map((r) => sortear(iguais, () => r).id)).toEqual(["x", "y", "z", "w"]);
  });
  it("lista vazia lança erro", () => {
    expect(() => sortear([])).toThrow();
  });
});

describe("fatiaSobPonteiro", () => {
  const quatro = [{ peso: 1 }, { peso: 1 }, { peso: 1 }, { peso: 1 }]; // 90° cada
  it("0° e 360° → primeira fatia", () => {
    expect(fatiaSobPonteiro(0, quatro)).toBe(0);
    expect(fatiaSobPonteiro(360, quatro)).toBe(0);
    expect(fatiaSobPonteiro(-360, quatro)).toBe(0);
  });
  it("girar no sentido horário traz a última fatia para o ponteiro", () => {
    expect(fatiaSobPonteiro(10, quatro)).toBe(3);
    expect(fatiaSobPonteiro(100, quatro)).toBe(2);
  });
  it("fronteira exata fica com a fatia que começa ali", () => {
    expect(fatiaSobPonteiro(-90, quatro)).toBe(1);
    expect(fatiaSobPonteiro(270, quatro)).toBe(1);
    expect(fatiaSobPonteiro(90, quatro)).toBe(3);
  });
  it("pesos diferentes mudam o tamanho", () => {
    expect(fatiaSobPonteiro(-100, [{ peso: 3 }, { peso: 1 }])).toBe(0); // fatia 0 vai até 270°
    expect(fatiaSobPonteiro(-280, [{ peso: 3 }, { peso: 1 }])).toBe(1);
  });
  it("sem fatias → -1", () => {
    expect(fatiaSobPonteiro(0, [])).toBe(-1);
  });
});

describe("anguloFinal", () => {
  it("para dentro da fatia pedida, à frente do ângulo atual", () => {
    const fatias = [{ peso: 7.5 }, { peso: 1 }, { peso: 0.2 }, { peso: 3 }];
    for (const atual of [0, 123.4, -50, 4000]) {
      for (let i = 0; i < fatias.length; i++) {
        for (const r of [0, 0.5, 0.9999]) {
          const alvo = anguloFinal(atual, fatias, i, 6, () => r);
          expect(fatiaSobPonteiro(alvo, fatias)).toBe(i);
          expect(alvo).toBeGreaterThanOrEqual(atual + 6 * 360);
          expect(alvo).toBeLessThan(atual + 7 * 360);
        }
      }
    }
  });
});

describe("montarFatias / candidatoDe", () => {
  const agora = new Date("2026-11-13T12:00:00Z");
  const linha = (topicoId: string, disciplinaId: string, ultima: Date | null, dominio = 0) =>
    candidatoDe(
      { topicoId, nome: topicoId, disciplinaId, disciplina: disciplinaId, cor: "#000000", notebooklmUrl: null, novo: true, dominio, ultimaVezEstudado: ultima },
      agora,
    );
  const cands: Candidato[] = [
    linha("t1", "d1", null),
    linha("t2", "d1", new Date("2026-11-13T02:00:00Z"), 100),
    linha("t3", "d2", new Date("2026-11-10T12:00:00Z"), 100),
  ];

  it("deriva nunca estudado e últimas 24 h", () => {
    expect(cands.map((c) => [c.nuncaEstudado, c.estudadoUltimas24h])).toEqual([
      [true, false],
      [false, true],
      [false, false],
    ]);
  });
  it("filtra disciplinas e tópicos e aplica o peso do modo", () => {
    expect(montarFatias(cands, "inteligente", { disciplinaIds: ["d1"] }).map((f) => f.peso)).toEqual([7.5, 0.5]);
    expect(montarFatias(cands, "sorte", { disciplinaIds: ["d1", "d2"] }).map((f) => f.peso)).toEqual([1, 1, 1]);
    expect(montarFatias(cands, "sorte", { disciplinaIds: ["d1", "d2"], topicoIds: ["t3"] }).map((f) => f.topicoId)).toEqual(["t3"]);
    expect(montarFatias(cands, "inteligente", { disciplinaIds: [] })).toEqual([]);
  });
});
