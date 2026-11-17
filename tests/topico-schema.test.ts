import { describe, expect, it } from "vitest";
import { TopicoSchema } from "@/lib/topicos/schema";

describe("TopicoSchema · caderno do NotebookLM", () => {
  it("sem link (ou em branco) segue o da disciplina: null", () => {
    expect(TopicoSchema.parse({ nome: "ICC" }).notebooklmUrl).toBeNull();
    expect(TopicoSchema.parse({ nome: "ICC", notebooklmUrl: "  " }).notebooklmUrl).toBeNull();
  });

  it("guarda o link próprio e recusa o que não é http(s)", () => {
    const url = "https://notebooklm.google.com/notebook/xyz";
    expect(TopicoSchema.parse({ nome: "ICC", notebooklmUrl: ` ${url} ` }).notebooklmUrl).toBe(url);
    for (const notebooklmUrl of ["notebooklm", "javascript:alert(1)"]) {
      const r = TopicoSchema.safeParse({ nome: "ICC", notebooklmUrl });
      expect(r.success ? null : r.error.issues[0].path).toEqual(["notebooklmUrl"]);
    }
  });
});
