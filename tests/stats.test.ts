import { describe, expect, it } from "vitest";
import { agregarPorDia, diaSP, mapaDeCalor, rodadasHoje, streak, xpTotal } from "@/lib/domain/stats";
import { etapaParaContinuar, primeiroPasso, saudacao, tempoRetomado } from "@/lib/domain/inicio";

describe("diaSP", () => {
  it("01:00 UTC ainda é o dia anterior em SP; a virada é às 03:00 UTC", () => {
    expect(diaSP(new Date("2026-11-14T01:00:00Z"))).toBe("2026-11-13");
    expect(diaSP(new Date("2026-11-14T02:59:59Z"))).toBe("2026-11-13");
    expect(diaSP(new Date("2026-11-14T03:00:00Z"))).toBe("2026-11-14");
  });
});

describe("streak", () => {
  const hoje = "2026-11-14";
  it("conta os dias seguidos até hoje", () => {
    expect(streak(["2026-11-12", "2026-11-13", "2026-11-14"], hoje)).toBe(3);
  });
  it("hoje sem resposta mas ontem com → mantém", () => {
    expect(streak(["2026-11-12", "2026-11-13"], hoje)).toBe(2);
  });
  it("buraco de um dia zera", () => {
    expect(streak(["2026-11-11", "2026-11-12"], hoje)).toBe(0);
    expect(streak(["2026-11-10", "2026-11-12", "2026-11-13", "2026-11-14"], hoje)).toBe(3);
  });
  it("sem atividade → 0", () => {
    expect(streak([], hoje)).toBe(0);
  });
  it("atravessa o mês", () => {
    expect(streak(["2026-10-31", "2026-11-01"], "2026-11-01")).toBe(2);
  });
});

describe("xpTotal", () => {
  it("só sessões finalizadas", () => {
    const fim = new Date();
    expect(
      xpTotal([
        { pontuacao: 50, finalizadaEm: fim },
        { pontuacao: 30, finalizadaEm: null },
        { pontuacao: 12, finalizadaEm: fim },
      ]),
    ).toBe(62);
    expect(xpTotal([])).toBe(0);
  });
});

describe("agregarPorDia", () => {
  it("soma pelo dia de SP, não pelo de UTC", () => {
    const m = agregarPorDia([
      { em: new Date("2026-11-14T01:00:00Z"), n: 2 }, // 22h de 13/11 em SP
      { em: new Date("2026-11-13T15:00:00Z"), n: 3 },
      { em: new Date("2026-11-14T03:00:00Z"), n: 1 },
    ]);
    expect(Object.fromEntries(m)).toEqual({ "2026-11-13": 5, "2026-11-14": 1 });
  });
});

describe("rodadasHoje", () => {
  it("só roleta finalizada hoje em SP", () => {
    expect(
      rodadasHoje(
        [
          { modo: "roleta", finalizadaEm: new Date("2026-11-14T12:00:00Z") },
          { modo: "roleta", finalizadaEm: new Date("2026-11-14T02:00:00Z") }, // 23h de ontem em SP
          { modo: "roleta", finalizadaEm: null },
          { modo: "revisao", finalizadaEm: new Date("2026-11-14T12:00:00Z") },
        ],
        "2026-11-14",
      ),
    ).toBe(1);
  });
});

describe("mapaDeCalor", () => {
  it("14 semanas de domingo a sábado; a última tem hoje e os dias futuros vêm vazios", () => {
    const hoje = "2026-11-14"; // sábado
    const m = mapaDeCalor(new Map([["2026-11-14", 4], ["2026-08-09", 1]]), hoje);
    expect(m).toHaveLength(14);
    expect(m.every((s) => s.length === 7)).toBe(true);
    expect(m[0][0].dia).toBe("2026-08-09"); // domingo, 13 semanas antes do domingo 08/11
    expect(m[0][0].n).toBe(1);
    expect(m[13][6]).toEqual({ dia: hoje, n: 4, futuro: false });
    const quarta = mapaDeCalor(new Map(), "2026-11-11");
    expect(quarta[13][3].dia).toBe("2026-11-11");
    expect(quarta[13][4].futuro).toBe(true);
  });
});

describe("saudacao", () => {
  it("pelo horário de SP, com e sem nome", () => {
    expect(saudacao(new Date("2026-11-14T14:59:00Z"), "Ana")).toBe("Bom dia, Ana! Bora uma rodada?"); // 11:59
    expect(saudacao(new Date("2026-11-14T15:00:00Z"), null)).toBe("Boa tarde! Bora uma rodada?"); // 12:00
    expect(saudacao(new Date("2026-11-14T21:00:00Z"), "Ana")).toBe("Boa noite, Ana! Bora uma rodada?"); // 18:00
    expect(saudacao(new Date("2026-11-14T02:00:00Z"), "")).toBe("Boa noite! Bora uma rodada?"); // 23:00
  });
});

describe("primeiroPasso", () => {
  it("sem disciplina → criar; sem questão → gerar; senão nada", () => {
    expect(primeiroPasso(0, 0)).toBe("disciplina");
    expect(primeiroPasso(2, 0)).toBe("questoes");
    expect(primeiroPasso(2, 5)).toBeNull();
  });
});

describe("etapaParaContinuar", () => {
  it("com resposta, nas questões; sem, no estudo", () => {
    expect(etapaParaContinuar(0)).toBe("estudo");
    expect(etapaParaContinuar(2)).toBe("questoes");
  });
});

describe("tempoRetomado", () => {
  const D = 600_000;
  const t = 1_000_000_000;
  it("sem nada guardado: do zero, rodando", () => {
    expect(tempoRetomado("s", 0, null, t, D)).toEqual({ acumuladoMs: 0, rodando: true });
  });
  it("só o banco: retoma do gravado", () => {
    expect(tempoRetomado("s", 120_000, null, t, D)).toEqual({ acumuladoMs: 120_000, rodando: true });
  });
  it("rodando ao esconder: soma o tempo fora (estava no NotebookLM)", () => {
    const local = { sessaoId: "s", acumuladoMs: 100_000, salvoEm: t - 200_000, rodando: true };
    expect(tempoRetomado("s", 100_000, local, t, D)).toEqual({ acumuladoMs: 300_000, rodando: true });
  });
  it("pausado ao esconder: não soma e continua pausado", () => {
    const local = { sessaoId: "s", acumuladoMs: 100_000, salvoEm: t - 200_000, rodando: false };
    expect(tempoRetomado("s", 0, local, t, D)).toEqual({ acumuladoMs: 100_000, rodando: false });
  });
  it("limita à duração e para; ignora o guardado de outra sessão", () => {
    const local = { sessaoId: "s", acumuladoMs: 500_000, salvoEm: t - 500_000, rodando: true };
    expect(tempoRetomado("s", 0, local, t, D)).toEqual({ acumuladoMs: D, rodando: false });
    expect(tempoRetomado("outra", 30_000, local, t, D)).toEqual({ acumuladoMs: 30_000, rodando: true });
  });
  it("tempo fora conta no máximo 1 h", () => {
    const local = { sessaoId: "s", acumuladoMs: 0, salvoEm: t - 5 * 3_600_000, rodando: true };
    expect(tempoRetomado("s", 0, local, t, 2 * 3_600_000).acumuladoMs).toBe(3_600_000);
  });
});
