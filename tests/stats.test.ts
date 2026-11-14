import { describe, expect, it } from "vitest";
import { acertosInicioFim, agregarPorDia, agregarPorSemana, diaSP, maiorSequencia, mapaDeCalor, rodadasHoje, streak, xpTotal } from "@/lib/domain/stats";
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
    expect(saudacao(new Date("2026-11-14T07:59:00Z"), null)).toBe("Boa noite! Bora uma rodada?"); // 04:59, madrugada
    expect(saudacao(new Date("2026-11-14T08:00:00Z"), null)).toBe("Bom dia! Bora uma rodada?"); // 05:00
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

describe("maiorSequencia", () => {
  it("acha a maior corrida, mesmo antiga, e ignora repetidos", () => {
    expect(maiorSequencia(["2026-10-01", "2026-10-02", "2026-10-03", "2026-11-13", "2026-11-14", "2026-10-02"])).toBe(3);
  });
  it("sem atividade → 0", () => {
    expect(maiorSequencia([])).toBe(0);
  });
});

describe("agregarPorSemana", () => {
  const hoje = "2026-11-14"; // sábado
  it("semana começa na segunda; a última contém hoje; vazias vêm zeradas", () => {
    const s = agregarPorSemana([], hoje);
    expect(s).toHaveLength(8);
    expect(s[7].inicio).toBe("2026-11-09"); // segunda
    expect(s[0].inicio).toBe("2026-09-21");
    expect(s.every((x) => x.respostas === 0 && x.acertos === 0 && x.segundos === 0)).toBe(true);
  });
  it("hoje sendo segunda abre semana nova; domingo fecha a anterior", () => {
    expect(agregarPorSemana([], "2026-11-16")[7].inicio).toBe("2026-11-16");
    expect(agregarPorSemana([], "2026-11-15")[7].inicio).toBe("2026-11-09");
  });
  it("usa o dia de SP: segunda 01:00 UTC ainda é domingo em SP", () => {
    const s = agregarPorSemana(
      [
        { em: new Date("2026-11-09T01:00:00Z"), respostas: 2, acertos: 1 }, // domingo 08/11 em SP
        { em: new Date("2026-11-09T03:00:00Z"), respostas: 3, acertos: 3, segundos: 600 }, // segunda em SP
      ],
      hoje,
    );
    expect(s[6]).toMatchObject({ inicio: "2026-11-02", respostas: 2, acertos: 1 });
    expect(s[7]).toMatchObject({ respostas: 3, acertos: 3, segundos: 600 });
  });
  it("ignora o que está fora do período", () => {
    const s = agregarPorSemana([{ em: new Date("2026-09-20T15:00:00Z"), respostas: 9 }], hoje);
    expect(s.reduce((t, x) => t + x.respostas, 0)).toBe(0);
  });
});

describe("acertosInicioFim", () => {
  const sem = (respostas: number, acertos: number) => ({ inicio: "", respostas, acertos, segundos: 0 });
  it("primeira × última semana com resposta, pulando as vazias", () => {
    expect(acertosInicioFim([sem(0, 0), sem(10, 5), sem(0, 0), sem(4, 3), sem(0, 0)])).toEqual({ inicio: 50, fim: 75 });
  });
  it("uma semana só → fim null; nenhuma → null", () => {
    expect(acertosInicioFim([sem(3, 2), sem(0, 0)])).toEqual({ inicio: 67, fim: null });
    expect(acertosInicioFim([sem(0, 0)])).toBeNull();
  });
});
