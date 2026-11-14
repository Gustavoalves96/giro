import { describe, expect, it } from "vitest";
import { contagemRegressiva, diasAte, hojeEmSP, topicosComProvaEm14Dias } from "@/lib/domain/provas";

describe("diasAte", () => {
  it("hoje = 0, amanhã = 1, ontem = -1", () => {
    expect(diasAte("2026-11-13", "2026-11-13")).toBe(0);
    expect(diasAte("2026-11-14", "2026-11-13")).toBe(1);
    expect(diasAte("2026-11-12", "2026-11-13")).toBe(-1);
  });
  it("atravessa mês e ano", () => {
    expect(diasAte("2027-01-02", "2026-12-30")).toBe(3);
  });
});

describe("hojeEmSP", () => {
  it("22h em SP já é o dia seguinte em UTC, mas continua hoje em SP", () => {
    expect(hojeEmSP(new Date("2026-11-14T01:00:00Z"))).toBe("2026-11-13");
    expect(hojeEmSP(new Date("2026-11-14T03:00:00Z"))).toBe("2026-11-14"); // meia-noite em SP
  });
  it("prova amanhã às 23h de SP conta 1 dia", () => {
    const hoje = hojeEmSP(new Date("2026-11-14T02:30:00Z")); // 23h30 de 13/11 em SP
    expect(diasAte("2026-11-14", hoje)).toBe(1);
  });
});

describe("topicosComProvaEm14Dias", () => {
  const hoje = "2026-11-13";
  const p = (data: string, ...topicoIds: string[]) => ({ data, topicoIds });
  it("de hoje até o 14º dia entra; 15º e passadas não", () => {
    const ids = topicosComProvaEm14Dias(
      [p("2026-11-13", "hoje"), p("2026-11-27", "dia14"), p("2026-11-28", "dia15"), p("2026-11-12", "ontem")],
      hoje,
    );
    expect([...ids].sort()).toEqual(["dia14", "hoje"]);
  });
  it("junta tópicos de várias provas sem repetir", () => {
    expect([...topicosComProvaEm14Dias([p("2026-11-15", "a", "b"), p("2026-11-20", "b", "c")], hoje)]).toEqual(["a", "b", "c"]);
  });
});

describe("contagemRegressiva", () => {
  it("hoje, amanhã, em N dias e passadas", () => {
    expect([0, 1, 6, -1, -3].map(contagemRegressiva)).toEqual(["hoje", "amanhã", "em 6 dias", "ontem", "há 3 dias"]);
  });
});
