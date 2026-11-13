import { describe, expect, it } from "vitest";
import { lerProcedimentos, lerResposta } from "@/lib/import/parse-json";
import { ImportProcedimentosSchema, ProcedimentoSchema } from "@/lib/import/schemas";
import { montarPromptProcedimentos } from "@/lib/prompts/notebooklm";

const proc = (nome: string, extra: Record<string, unknown> = {}) => ({
  nome,
  material: ["Espéculo", "Espátula de Ayre"],
  passos: [
    { texto: "Identificar a paciente", critico: true },
    { texto: "Introduzir o espéculo", critico: false },
    { texto: "Coletar a ectocérvice" },
  ],
  pontosDeAtencao: "Evitar lubrificante; não coletar durante a menstruação.",
  fonte: "Roteiro de GO, p. 4",
  ...extra,
});
const motivo = (dados: unknown) => {
  const r = ProcedimentoSchema.safeParse(dados);
  return r.success ? null : r.error.issues[0].message;
};

describe("ProcedimentoSchema", () => {
  it("aceita, apara e preenche critico ausente com false", () => {
    const p = ProcedimentoSchema.parse(proc("  Coleta de citopatológico  "));
    expect(p.nome).toBe("Coleta de citopatológico");
    expect(p.passos.map((x) => x.critico)).toEqual([true, false, false]);
  });
  it("material é opcional (vira lista vazia)", () => {
    const sem: Record<string, unknown> = proc("Exame do joelho");
    delete sem.material;
    expect(ProcedimentoSchema.parse(sem).material).toEqual([]);
  });
  it("recusa menos de 2 passos, passo vazio, nome curto e item de material vazio", () => {
    expect(motivo(proc("Exame", { passos: [{ texto: "Inspecionar", critico: false }] }))).toBe(
      "O procedimento precisa de pelo menos 2 passos.",
    );
    expect(motivo(proc("Exame", { passos: [{ texto: "Inspecionar" }, { texto: "  " }] }))).toBe(
      "Cada passo precisa de pelo menos 3 caracteres.",
    );
    expect(motivo(proc("Ex"))).toBe("O nome precisa de pelo menos 3 caracteres.");
    expect(motivo(proc("Exame", { material: ["Luvas", " "] }))).toBe("Há um item de material vazio.");
    expect(motivo(proc("Exame", { pontosDeAtencao: "curto" }))).toBe(
      "Os pontos de atenção precisam de pelo menos 10 caracteres.",
    );
  });
  it("envelope exige ao menos 1 procedimento", () => {
    expect(ImportProcedimentosSchema.safeParse({ procedimentos: [] }).success).toBe(false);
  });
});

describe("lerProcedimentos", () => {
  const colado = (lista: unknown[]) =>
    `Claro! Seguem os roteiros:\n\`\`\`json\n${JSON.stringify({ procedimentos: lista })}\n\`\`\`\nBons estudos!`;

  it("cerca ```json com texto em volta; inválido no meio; ordem dos passos preservada", () => {
    const r = lerProcedimentos(colado([proc("Coleta de citopatológico"), proc("Sem passos", { passos: [] }), proc("Exame físico do joelho")]), []);
    if (!r.ok) throw new Error(r.erro.causa);
    expect(r.validas.map((p) => p.nome)).toEqual(["Coleta de citopatológico", "Exame físico do joelho"]);
    expect(r.validas[0].passos.map((p) => p.texto)).toEqual([
      "Identificar a paciente",
      "Introduzir o espéculo",
      "Coletar a ectocérvice",
    ]);
    expect(r.invalidas).toEqual([{ indice: 1, motivo: "O procedimento precisa de pelo menos 2 passos." }]);
  });

  it("duplicata contra o tópico e dentro do lote (acentos/espaços)", () => {
    const r = lerProcedimentos(colado([proc("COLETA de  citopatologico"), proc("Exame do joelho"), proc("Exame  do Joelho ")]), [
      "Coleta de citopatológico",
    ]);
    if (!r.ok) throw new Error(r.erro.causa);
    expect(r.validas.map((p) => p.nome)).toEqual(["Exame do joelho"]);
    expect(r.duplicadas.map((d) => d.motivo)).toEqual(["Já existe neste tópico.", "Repetido nesta resposta."]);
  });

  it("envelope de questões não passa como procedimentos (e vice-versa)", () => {
    const r = lerProcedimentos('{"questoes":[{"tipo":"verdadeiro_falso"}]}', []);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erro.causa).toBe("O texto não traz a lista de procedimentos no formato que o Giro espera.");
    expect(lerResposta(colado([proc("Exame do joelho")]), []).ok).toBe(false);
  });
});

describe("montarPromptProcedimentos", () => {
  it("preenche quantidade, tópico e disciplina", () => {
    const p = montarPromptProcedimentos({ quantidade: 3, topico: "Rastreamento do câncer de colo", disciplina: "Ginecologia" });
    expect(p).toContain('descreva 3 procedimentos do tópico\n"Rastreamento do câncer de colo" da disciplina "Ginecologia"');
    expect(p).not.toContain("{{");
    expect(p).toContain('{"procedimentos":[');
  });
});
