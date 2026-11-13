import { z } from "zod";
import { type ProcedimentoImport, ProcedimentoSchema, type QuestaoImport, QuestaoImportSchema } from "./schemas";

// Leitura da resposta colada do NotebookLM (CLAUDE.md §5). Puro: roda no cliente (prévia) e de novo no servidor.

export type ErroLeitura = { causa: string; oQueFazer: string };
export type Leitura<T = QuestaoImport> =
  | { ok: false; erro: ErroLeitura }
  | {
      ok: true;
      validas: T[];
      invalidas: { indice: number; motivo: string }[];
      /** enunciado = enunciado da questão ou nome do procedimento */
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

// O que muda entre importar questões e procedimentos: chave do envelope, schema, campo comparado e palavras.
type Tipo<T> = {
  chave: "questoes" | "procedimentos";
  schema: z.ZodType<T, unknown>;
  nome: (item: T) => string;
  plural: string;
  artigo: string;
  item: string;
  repetida: string;
};

const QUESTOES: Tipo<QuestaoImport> = {
  chave: "questoes",
  schema: QuestaoImportSchema,
  nome: (q) => q.enunciado,
  plural: "questões",
  artigo: "as",
  item: "A questão",
  repetida: "Repetida nesta resposta.",
};

const PROCEDIMENTOS: Tipo<ProcedimentoImport> = {
  chave: "procedimentos",
  schema: ProcedimentoSchema,
  nome: (p) => p.nome,
  plural: "procedimentos",
  artigo: "os",
  item: "O procedimento",
  repetida: "Repetido nesta resposta.",
};

// Só vale onde o schema não tem mensagem própria (ex.: "alternativas" como texto em vez de lista).
const motivoGenerico = (item: string) => (iss: { path?: PropertyKey[] }) =>
  iss.path?.length ? `O campo “${iss.path.join(".")}” veio num formato errado.` : `${item} não está no formato esperado.`;

const REFAZER = "Cole o prompt do passo 1 de novo no NotebookLM e copie a resposta inteira.";

/** questões coladas; enunciadosExistentes = questões do tópico (duplicatas) */
export function lerResposta(texto: string, enunciadosExistentes: string[]) {
  return lerItens(texto, enunciadosExistentes, QUESTOES);
}

/** procedimentos colados; nomesExistentes = procedimentos do tópico (duplicatas) */
export function lerProcedimentos(texto: string, nomesExistentes: string[]) {
  return lerItens(texto, nomesExistentes, PROCEDIMENTOS);
}

function lerItens<T>(texto: string, existentes: string[], tipo: Tipo<T>): Leitura<T> {
  if (!texto.trim()) {
    return { ok: false, erro: { causa: "A caixa está vazia.", oQueFazer: "Cole a resposta do NotebookLM aqui." } };
  }
  const json = extrairJson(texto);
  if (!json) {
    return {
      ok: false,
      erro: {
        causa: `Não achei ${tipo.artigo} ${tipo.plural} no texto colado: ele não tem nenhum trecho em JSON (entre { e }).`,
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
        oQueFazer: `Peça ao NotebookLM “responda de novo só com o JSON completo” e cole outra vez. Se continuar, gere menos ${tipo.plural} por vez.`,
      },
    };
  }
  const envelope = z.object({ [tipo.chave]: z.array(z.unknown()).min(1) }).safeParse(dados);
  if (!envelope.success) {
    return {
      ok: false,
      erro: { causa: `O texto não traz a lista de ${tipo.plural} no formato que o Giro espera.`, oQueFazer: REFAZER },
    };
  }

  const vistos = new Set(existentes.map(normalizarEnunciado));
  const validas: T[] = [];
  const invalidas: { indice: number; motivo: string }[] = [];
  const duplicadas: { indice: number; enunciado: string; motivo: string }[] = [];
  envelope.data[tipo.chave].forEach((bruta, indice) => {
    const q = tipo.schema.safeParse(bruta, { error: motivoGenerico(tipo.item) });
    if (!q.success) {
      invalidas.push({ indice, motivo: q.error.issues[0].message });
      return;
    }
    const nome = tipo.nome(q.data);
    const chave = normalizarEnunciado(nome);
    if (vistos.has(chave)) {
      const noLote = validas.some((v) => normalizarEnunciado(tipo.nome(v)) === chave);
      duplicadas.push({ indice, enunciado: nome, motivo: noLote ? tipo.repetida : "Já existe neste tópico." });
      return;
    }
    vistos.add(chave);
    validas.push(q.data);
  });
  return { ok: true, validas, invalidas, duplicadas };
}
