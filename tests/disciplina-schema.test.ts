import { describe, expect, it } from "vitest";
import { tintaClara } from "@/lib/cores";
import { DisciplinaSchema } from "@/lib/disciplinas/schema";

const valida = { nome: "Cardiologia", cor: "#d93a49", notebooklmUrl: "https://notebooklm.google.com/notebook/abc" };

function erro(dados: Record<string, unknown>) {
  const r = DisciplinaSchema.safeParse(dados);
  expect(r.success).toBe(false);
  return r.error?.issues[0];
}

describe("DisciplinaSchema", () => {
  it("aceita disciplina válida e normaliza a cor", () => {
    expect(DisciplinaSchema.parse(valida)).toEqual({ ...valida, cor: "#D93A49" });
  });

  it("recusa nome vazio ou só espaços", () => {
    expect(erro({ ...valida, nome: "" })?.message).toBe("Digite o nome da disciplina.");
    expect(erro({ ...valida, nome: "   " })?.path).toEqual(["nome"]);
  });

  it("recusa hex inválido", () => {
    for (const cor of ["D93A49", "#D93A4", "#D93A49F", "#GG0000", "red", ""]) {
      expect(erro({ ...valida, cor })?.path).toEqual(["cor"]);
    }
  });

  it("recusa URL inválida", () => {
    for (const notebooklmUrl of ["notebooklm", "javascript:alert(1)", "ftp://x.com", "https://"]) {
      expect(erro({ ...valida, notebooklmUrl })?.path).toEqual(["notebooklmUrl"]);
    }
  });

  it("link vazio ou ausente vira null", () => {
    expect(DisciplinaSchema.parse({ ...valida, notebooklmUrl: "  " }).notebooklmUrl).toBeNull();
    expect(DisciplinaSchema.parse({ nome: "X", cor: "#000000" }).notebooklmUrl).toBeNull();
  });
});

describe("tintaClara", () => {
  it("mistura 20% da cor com branco", () => {
    expect(tintaClara("#D93A49")).toBe("color-mix(in srgb, #D93A49 20%, white)");
  });
});
