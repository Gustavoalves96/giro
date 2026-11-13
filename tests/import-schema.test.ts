import { describe, expect, it } from "vitest";
import { ImportSchema, QuestaoImportSchema } from "@/lib/import/schemas";

const alternativas = ["A", "B", "C", "D", "E"].map((letra) => ({ letra, texto: `Opção ${letra}` }));
const me = {
  tipo: "multipla_escolha",
  enunciado: "Qual o primeiro passo no manejo da IC descompensada?",
  alternativas,
  gabarito: "c",
  explicacao: "Porque a congestão é o problema principal.",
};
const vf = {
  tipo: "verdadeiro_falso",
  enunciado: "A furosemida é um diurético de alça.",
  gabarito: "V",
  explicacao: "Atua na alça de Henle, ramo ascendente espesso.",
};

function issues(dados: Record<string, unknown>) {
  const r = QuestaoImportSchema.safeParse(dados);
  expect(r.success).toBe(false);
  return r.error?.issues ?? [];
}

describe("QuestaoImportSchema", () => {
  it("aceita múltipla escolha válida, normaliza o gabarito e põe dificuldade média", () => {
    const q = QuestaoImportSchema.parse(me);
    expect(q.gabarito).toBe("C");
    expect(q.dificuldade).toBe("media");
    expect(q.fonte).toBeUndefined();
  });

  it("aceita V/F sem alternativas", () => {
    expect(QuestaoImportSchema.parse(vf).alternativas).toBeUndefined();
  });

  it("descarta alternativas enviadas em V/F", () => {
    expect(QuestaoImportSchema.parse({ ...vf, alternativas }).alternativas).toBeUndefined();
  });

  it("recusa V/F com gabarito que não é V nem F", () => {
    expect(issues({ ...vf, gabarito: "A" })[0].path).toEqual(["gabarito"]);
  });

  it("recusa múltipla escolha e caso clínico sem alternativas", () => {
    for (const tipo of ["multipla_escolha", "caso_clinico"]) {
      expect(issues({ ...me, tipo, alternativas: undefined })[0]).toMatchObject({
        path: ["alternativas"],
        message: "Preencha as alternativas.",
      });
    }
  });

  it("recusa gabarito ausente nas alternativas", () => {
    const i = issues({ ...me, alternativas: alternativas.slice(0, 2), gabarito: "C" });
    expect(i[0]).toMatchObject({ path: ["gabarito"] });
  });

  it("recusa letras repetidas", () => {
    const repetidas = [...alternativas.slice(0, 3), { letra: "A", texto: "De novo" }];
    expect(issues({ ...me, alternativas: repetidas, gabarito: "B" })[0]).toMatchObject({
      path: ["alternativas"],
      message: "A letra A aparece mais de uma vez.",
    });
  });

  it("recusa enunciado curto", () => {
    expect(issues({ ...me, enunciado: "  Curto   " })[0]).toMatchObject({
      path: ["enunciado"],
      message: "O enunciado precisa de pelo menos 10 caracteres.",
    });
  });

  it("recusa menos de 2 alternativas e letra fora de A–E", () => {
    expect(issues({ ...me, alternativas: alternativas.slice(0, 1), gabarito: "A" })[0].path).toEqual(["alternativas"]);
    expect(issues({ ...me, alternativas: [...alternativas.slice(0, 2), { letra: "F", texto: "x" }] })[0].path).toEqual([
      "alternativas",
      2,
      "letra",
    ]);
  });
});

describe("ImportSchema", () => {
  it("exige ao menos uma questão", () => {
    expect(ImportSchema.safeParse({ questoes: [] }).success).toBe(false);
    expect(ImportSchema.parse({ questoes: [me, vf] }).questoes).toHaveLength(2);
  });
});
