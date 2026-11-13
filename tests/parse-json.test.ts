import { describe, expect, it } from "vitest";
import { extrairJson, lerResposta, normalizarEnunciado } from "@/lib/import/parse-json";
import { montarPrompt } from "@/lib/prompts/notebooklm";

const alternativas = ["A", "B", "C", "D", "E"].map((letra) => ({ letra, texto: `Opção ${letra}` }));
const me = (enunciado: string, extra: Record<string, unknown> = {}) => ({
  tipo: "multipla_escolha",
  enunciado,
  alternativas,
  gabarito: "B",
  explicacao: "Porque a opção B é a descrita no slide.",
  ...extra,
});
const vf = { tipo: "verdadeiro_falso", enunciado: "A furosemida é um diurético de alça.", gabarito: "F", explicacao: "Pegadinha de teste aqui." };
const json = (questoes: unknown[]) => JSON.stringify({ questoes });

function ok(texto: string, existentes: string[] = []) {
  const r = lerResposta(texto, existentes);
  if (!r.ok) throw new Error(r.erro.causa);
  return r;
}

describe("normalizarEnunciado", () => {
  it("tira acento, caixa e espaços extras", () => {
    expect(normalizarEnunciado("  Qual   a CAUSA\n da Insuficiência   cardíaca? ")).toBe(
      "qual a causa da insuficiencia cardiaca?",
    );
  });
});

describe("extrairJson", () => {
  it("pega o bloco ```json com texto antes e depois", () => {
    expect(extrairJson('Claro! Aqui estão:\n```json\n{"a":1}\n```\nBons estudos.')).toBe('{"a":1}');
  });
  it("sem cerca, vai do primeiro { ao último }", () => {
    expect(extrairJson('Segue: {"a":{"b":1}} fim')).toBe('{"a":{"b":1}}');
  });
  it("devolve null sem chaves", () => {
    expect(extrairJson("Não encontrei fontes sobre isso.")).toBeNull();
  });
});

describe("lerResposta", () => {
  it("aceita texto antes/depois e cerca ```json", () => {
    const r = ok(`Aqui estão as questões:\n\`\`\`json\n${json([me("Primeira questão de teste?"), vf])}\n\`\`\`\nEspero ter ajudado!`);
    expect(r.validas).toHaveLength(2);
    expect(r.validas[1].alternativas).toBeUndefined();
    expect(r.invalidas).toEqual([]);
  });

  it("separa válidas e inválidas com o motivo e o índice", () => {
    const r = ok(json([me("Questão válida número um?"), me("Gabarito fora das alternativas?", { gabarito: "F" }), "texto solto"]));
    expect(r.validas).toHaveLength(1);
    expect(r.invalidas).toEqual([
      { indice: 1, motivo: "A resposta correta precisa ser uma das alternativas preenchidas." },
      { indice: 2, motivo: "A questão não está no formato esperado." },
    ]);
  });

  it("motivo em português quando o campo vem com tipo errado", () => {
    expect(ok(json([me("Alternativas como texto?", { alternativas: "A) x" })])).invalidas[0].motivo).toBe(
      "O campo “alternativas” veio num formato errado.",
    );
  });

  it("marca duplicata contra o banco (acento/espaço diferentes) e dentro do lote", () => {
    const r = ok(json([me("Qual  a causa da insuficiencia CARDIACA?"), me("Nova questão sobre o tema?"), me("Nova   questao sobre o tema?")]), [
      "Qual a causa da insuficiência cardíaca?",
    ]);
    expect(r.validas.map((q) => q.enunciado)).toEqual(["Nova questão sobre o tema?"]);
    expect(r.duplicadas).toEqual([
      { indice: 0, enunciado: "Qual  a causa da insuficiencia CARDIACA?", motivo: "Já existe neste tópico." },
      { indice: 2, enunciado: "Nova   questao sobre o tema?", motivo: "Repetida nesta resposta." },
    ]);
  });

  it("erros de leitura: vazio, sem JSON, JSON quebrado, sem lista", () => {
    for (const texto of ["   ", "Não encontrei nada nas fontes.", '```json\n{"questoes":[{"tipo":"multi\n```', '{"perguntas":[]}']) {
      const r = lerResposta(texto, []);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.erro.oQueFazer).not.toBe("");
    }
    const quebrado = lerResposta('{"questoes":[{"tipo":"multi', []);
    expect(!quebrado.ok && quebrado.erro.causa).toMatch(/cortada/);
  });
});

describe("montarPrompt", () => {
  it("preenche quantidade, tópico e disciplina", () => {
    const p = montarPrompt({ quantidade: 10, topico: "Insuficiência cardíaca", disciplina: "Cardiologia" });
    expect(p).toContain('crie 10 questões sobre o tópico\n"Insuficiência cardíaca" da disciplina "Cardiologia"');
    expect(p).not.toContain("{{");
  });
});
