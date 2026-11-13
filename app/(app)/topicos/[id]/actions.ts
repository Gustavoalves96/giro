"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import {
  criarQuestao,
  type DadosQuestao,
  definirMarcacao,
  editarQuestao,
  inserirQuestoes,
  listarEnunciados,
} from "@/lib/db/questoes";
import { IdSchema } from "@/lib/disciplinas/schema";
import { lerProcedimentos, lerResposta } from "@/lib/import/parse-json";
import {
  LETRAS,
  OrigemManualSchema,
  type ProcedimentoImport,
  ProcedimentoSchema,
  QuestaoImportSchema,
} from "@/lib/import/schemas";

type Campo = "tipo" | "enunciado" | "alternativas" | "gabarito" | "explicacao" | "fonte" | "dificuldade" | "origem";
export type EstadoQuestao = { erros?: Partial<Record<Campo, string[]>>; salvo?: boolean };

const texto = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : undefined);

// Cria quando o form não traz id; edita quando traz. Mesmo schema da importação (CLAUDE.md §5).
export async function salvarQuestao(_anterior: EstadoQuestao, form: FormData): Promise<EstadoQuestao> {
  await requireUser();
  const topicoId = IdSchema.parse(form.get("topicoId"));
  const id = form.get("id") ? IdSchema.parse(form.get("id")) : null;
  const tipo = texto(form.get("tipo"));

  // alternativas em branco são ignoradas (pode ter só A–C, por exemplo)
  const alternativas = LETRAS.map((letra) => ({ letra, texto: texto(form.get(`alternativa_${letra}`))?.trim() ?? "" }))
    .filter((a) => a.texto);
  const questao = QuestaoImportSchema.safeParse({
    tipo,
    enunciado: texto(form.get("enunciado")),
    alternativas: tipo === "verdadeiro_falso" || alternativas.length === 0 ? undefined : alternativas,
    gabarito: texto(form.get("gabarito")),
    explicacao: texto(form.get("explicacao")),
    fonte: texto(form.get("fonte")),
    dificuldade: texto(form.get("dificuldade")),
  });
  // Na edição de questão importada (notebooklm / ia) o form não manda origem e ela não muda.
  const mudaOrigem = !id || form.has("origem");
  const origem = mudaOrigem ? OrigemManualSchema.safeParse(form.get("origem")) : null;

  if (!questao.success || (origem && !origem.success)) {
    return {
      erros: {
        ...(questao.success ? {} : z.flattenError(questao.error).fieldErrors),
        ...(origem && !origem.success ? { origem: z.flattenError(origem.error).formErrors } : {}),
      },
    };
  }
  const q = questao.data;
  const dados = {
    tipo: q.tipo,
    enunciado: q.enunciado,
    alternativas: q.alternativas ?? null,
    gabarito: q.gabarito,
    explicacao: q.explicacao,
    fonte: q.fonte ?? null,
    dificuldade: q.dificuldade,
  };
  if (id) await editarQuestao(id, origem ? { ...dados, origem: origem.data } : dados);
  else await criarQuestao(topicoId, { ...dados, origem: origem!.data });
  revalidatePath(`/topicos/${topicoId}`);
  return { salvo: true };
}

export type EstadoImportacao = { importadas: number } | { erro: string };

// Recebe o texto colado e lê de novo aqui: a prévia do cliente não é confiável.
export async function importarQuestoes(topicoId: string, texto: string): Promise<EstadoImportacao> {
  await requireUser();
  const id = IdSchema.parse(topicoId);
  const leitura = lerResposta(z.string().max(500_000).parse(texto), await listarEnunciados(id));
  if (!leitura.ok) return { erro: leitura.erro.causa };
  await inserirQuestoes(
    id,
    leitura.validas.map((q) => ({
      tipo: q.tipo,
      enunciado: q.enunciado,
      alternativas: q.alternativas ?? null,
      gabarito: q.gabarito,
      explicacao: q.explicacao,
      fonte: q.fonte ?? null,
      dificuldade: q.dificuldade,
      origem: "notebooklm" as const,
    })),
  );
  revalidatePath(`/topicos/${id}`);
  return { importadas: leitura.validas.length };
}

// ── Procedimentos (tipo 'procedimento'): enunciado = nome, explicacao = pontos de atenção, gabarito = '' ──

type CampoProc = "nome" | "material" | "passos" | "pontosDeAtencao" | "fonte" | "origem";
export type EstadoProcedimento = { erros?: Partial<Record<CampoProc, string[]>>; salvo?: boolean };

// Passos chegam do formulário como JSON; id vem nos passos que já existiam (a ordem muda, o id não).
const PassosFormSchema = z.array(z.object({ id: z.uuid().optional() }).loose()).max(40);

function linhaProcedimento(p: ProcedimentoImport, ids: (string | undefined)[] = []): Omit<DadosQuestao, "origem"> {
  const usados = new Set<string>();
  const passos = p.passos.map((passo, i) => {
    const id = ids[i] && !usados.has(ids[i]) ? ids[i] : crypto.randomUUID();
    usados.add(id);
    return { id, texto: passo.texto, critico: passo.critico };
  });
  return {
    tipo: "procedimento",
    enunciado: p.nome,
    alternativas: null,
    gabarito: "",
    explicacao: p.pontosDeAtencao,
    checklist: { material: p.material, passos },
    fonte: p.fonte ?? null,
  };
}

export async function salvarProcedimento(_anterior: EstadoProcedimento, form: FormData): Promise<EstadoProcedimento> {
  await requireUser();
  const topicoId = IdSchema.parse(form.get("topicoId"));
  const id = form.get("id") ? IdSchema.parse(form.get("id")) : null;
  let passosBrutos: unknown;
  try {
    passosBrutos = JSON.parse(texto(form.get("passos")) ?? "[]");
  } catch {
    passosBrutos = null;
  }
  const ids = PassosFormSchema.safeParse(passosBrutos);
  const proc = ProcedimentoSchema.safeParse({
    nome: texto(form.get("nome")),
    // um item por linha; linhas em branco ignoradas
    material: (texto(form.get("material")) ?? "").split("\n").map((l) => l.trim()).filter(Boolean),
    passos: passosBrutos,
    pontosDeAtencao: texto(form.get("pontosDeAtencao")),
    fonte: texto(form.get("fonte")),
  });
  const mudaOrigem = !id || form.has("origem");
  const origem = mudaOrigem ? OrigemManualSchema.safeParse(form.get("origem")) : null;

  if (!proc.success || !ids.success || (origem && !origem.success)) {
    const erros: EstadoProcedimento["erros"] = proc.success ? {} : { ...z.flattenError(proc.error).fieldErrors };
    // erro num passo: diz qual
    const doPasso = proc.success ? undefined : proc.error.issues.find((i) => i.path[0] === "passos" && typeof i.path[1] === "number");
    if (doPasso) erros.passos = [`Passo ${Number(doPasso.path[1]) + 1}: ${doPasso.message}`];
    if (!ids.success) erros.passos = ["Não consegui ler a lista de passos. Recarregue a página e tente de novo."];
    if (origem && !origem.success) erros.origem = z.flattenError(origem.error).formErrors;
    return { erros };
  }
  const dados = linhaProcedimento(
    proc.data,
    ids.data.map((p) => p.id),
  );
  if (id) await editarQuestao(id, origem ? { ...dados, origem: origem.data } : dados);
  else await criarQuestao(topicoId, { ...dados, origem: origem!.data });
  revalidatePath(`/topicos/${topicoId}`);
  return { salvo: true };
}

// Mesmo caminho da importação de questões: lê de novo aqui, duplicata = nome entre os procedimentos do tópico.
export async function importarProcedimentos(topicoId: string, texto: string): Promise<EstadoImportacao> {
  await requireUser();
  const id = IdSchema.parse(topicoId);
  const leitura = lerProcedimentos(z.string().max(500_000).parse(texto), await listarEnunciados(id, true));
  if (!leitura.ok) return { erro: leitura.erro.causa };
  await inserirQuestoes(
    id,
    leitura.validas.map((p) => ({ ...linhaProcedimento(p), origem: "notebooklm" as const })),
  );
  revalidatePath(`/topicos/${id}`);
  return { importadas: leitura.validas.length };
}

export async function marcar(id: string, topicoId: string, campo: "ativa" | "sinalizadaComErro", valor: boolean) {
  await requireUser();
  await definirMarcacao(
    IdSchema.parse(id),
    z.enum(["ativa", "sinalizadaComErro"]).parse(campo),
    z.boolean().parse(valor),
  );
  revalidatePath(`/topicos/${IdSchema.parse(topicoId)}`);
}
