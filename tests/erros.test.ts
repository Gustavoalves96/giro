import { describe, expect, it } from "vitest";
import { cadernoDeErros, passosEsquecidos } from "@/lib/domain/erros";

const t = (min: number) => new Date(Date.UTC(2026, 10, 13, 12, min));
const r = (id: string, questaoId: string, min: number, acertou: boolean) => ({ id, questaoId, respondidaEm: t(min), acertou });

describe("cadernoDeErros", () => {
  it("errou e depois acertou → não aparece", () => {
    expect(cadernoDeErros([r("1", "q", 0, false), r("2", "q", 5, true)])).toEqual([]);
  });

  it("acertou e depois errou → aparece, com a resposta do erro", () => {
    const out = cadernoDeErros([r("1", "q", 0, true), r("2", "q", 5, false)]);
    expect(out.map((x) => x.id)).toEqual(["2"]);
  });

  it("ordem de entrada não importa; erro mais recente primeiro", () => {
    const out = cadernoDeErros([r("3", "b", 9, false), r("1", "a", 1, false), r("2", "a", 2, false), r("4", "c", 5, true)]);
    expect(out.map((x) => x.id)).toEqual(["3", "2"]);
  });

  it("empate de horário: vale o maior id", () => {
    expect(cadernoDeErros([r("a", "q", 0, false), r("b", "q", 0, true)])).toEqual([]);
    expect(cadernoDeErros([r("b", "q", 0, false), r("a", "q", 0, true)]).map((x) => x.id)).toEqual(["b"]);
  });

  it("procedimento que não passou → aparece com % lembrado e os passos esquecidos daquela tentativa", () => {
    const checklist = { passos: [{ id: "p1", texto: "Lavar as mãos" }, { id: "p2", texto: "Posicionar" }, { id: "p3", texto: "Coletar" }] };
    const antiga = { ...r("1", "proc", 0, false), checklist, notas: [{ passoId: "p1", nota: "esqueci" as const }, { passoId: "p2", nota: "esqueci" as const }, { passoId: "p3", nota: "esqueci" as const }] };
    const ultima = { ...r("2", "proc", 5, false), checklist, notas: [{ passoId: "p1", nota: "lembrei" as const }, { passoId: "p2", nota: "com_erro" as const }, { passoId: "p3", nota: "esqueci" as const }] };
    const [item] = cadernoDeErros([antiga, ultima]);
    expect(item.id).toBe("2");
    expect(item.fracao).toBeCloseTo(0.5, 10);
    expect(item.esquecidos).toEqual(["Coletar"]);
  });

  it("questão não tem fração nem passos", () => {
    const [item] = cadernoDeErros([r("1", "q", 0, false)]);
    expect(item.fracao).toBeNull();
    expect(item.esquecidos).toBeNull();
  });
});

describe("passosEsquecidos", () => {
  it("segue a ordem do checklist e ignora passo apagado", () => {
    const passos = [{ id: "b", texto: "B" }, { id: "a", texto: "A" }];
    expect(passosEsquecidos(passos, [{ passoId: "a", nota: "esqueci" }, { passoId: "b", nota: "esqueci" }, { passoId: "x", nota: "esqueci" }])).toEqual(["B", "A"]);
  });
});
