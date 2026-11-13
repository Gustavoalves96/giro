import { z } from "zod";
import { type QuestaoImport, QuestaoImportSchema } from "./schemas";

// Leitura da resposta colada do NotebookLM (CLAUDE.md §5). Puro: roda no cliente (prévia) e de novo no servidor.

export type ErroLeitura = { causa: string; oQueFazer: string };
export type Leitura =
  | { ok: false; erro: ErroLeitura }
  | {
      ok: true;
      validas: QuestaoImport[];
      invalidas: { indice: number; motivo: string }[];
      duplicadas: { indice: number; enunciado: string; motivo: string }[];
    };

/** minúsculo, sem acento, espaços colapsados */
export function normalizarEnunciado(texto: string) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

/** bloco ```json … ``` (ou ``` … ```) ou, sem cerca, do primeiro { ao último }; null se não houver { */
export function extrairJson(texto: string) {
  const cerca = texto.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (cerca && cerca[1].includes("{")) return cerca[1].trim();
  const inicio = texto.indexOf("{");
  const fim = texto.lastIndexOf("}");
  if (inicio < 0) return null;
  // sem } final = resposta cortada: segue até o fim para o JSON.parse acusar
  return fim > inicio ? texto.slice(inicio, fim + 1) : texto.slice(inicio);
}

const EnvelopeSchema = z.object({ questoes: z.array(z.unknown()).min(1) });

// Só vale onde o schema não tem mensagem própria (ex.: "alternativas" como texto em vez de lista).
const motivoGenerico = (iss: { path?: PropertyKey[] }) =>
  iss.path?.length ? `O campo “${iss.path.join(".")}” veio num formato errado.` : "A questão não está no formato esperado.";

const REFAZER = "Cole o prompt do passo 1 de novo no NotebookLM e copie a resposta inteira.";

export function lerResposta(texto: string, enunciadosExistentes: string[]): Leitura {
  if (!texto.trim()) {
    return { ok: false, erro: { causa: "A caixa está vazia.", oQueFazer: "Cole a resposta do NotebookLM aqui." } };
  }
  const json = extrairJson(texto);
  if (!json) {
    return {
      ok: false,
      erro: {
        causa: "Não achei as questões no texto colado: ele não tem nenhum trecho em JSON (entre { e }).",
        oQueFazer:
          "Confira se copiou a resposta inteira. Se o NotebookLM respondeu em texto corrido, cole o prompt do passo 1 de novo no caderno.",
      },
    };
  }
  let dados: unknown;
  try {
    dados = JSON.parse(json);
  } catch {
    return {
      ok: false,
      erro: {
        causa: "A resposta parece cortada ou com um erro de formatação (falta uma aspa, vírgula ou chave).",
        oQueFazer: `Peça ao NotebookLM “responda de novo só com o JSON completo” e cole outra vez. Se continuar, gere menos questões por vez.`,
      },
    };
  }
  const envelope = EnvelopeSchema.safeParse(dados);
  if (!envelope.success) {
    return {
      ok: false,
      erro: { causa: "O texto não traz a lista de questões no formato que o Giro espera.", oQueFazer: REFAZER },
    };
  }

  const vistos = new Set(enunciadosExistentes.map(normalizarEnunciado));
  const validas: QuestaoImport[] = [];
  const invalidas: { indice: number; motivo: string }[] = [];
  const duplicadas: { indice: number; enunciado: string; motivo: string }[] = [];
  envelope.data.questoes.forEach((bruta, indice) => {
    const q = QuestaoImportSchema.safeParse(bruta, { error: motivoGenerico });
    if (!q.success) {
      invalidas.push({ indice, motivo: q.error.issues[0].message });
      return;
    }
    const chave = normalizarEnunciado(q.data.enunciado);
    if (vistos.has(chave)) {
      const noLote = validas.some((v) => normalizarEnunciado(v.enunciado) === chave);
      duplicadas.push({
        indice,
        enunciado: q.data.enunciado,
        motivo: noLote ? "Repetida nesta resposta." : "Já existe neste tópico.",
      });
      return;
    }
    vistos.add(chave);
    validas.push(q.data);
  });
  return { ok: true, validas, invalidas, duplicadas };
}
