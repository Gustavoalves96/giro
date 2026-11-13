import { ChevronRight, Eye, EyeOff, Flag, FlagOff, Pencil, Plus, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarraDominio } from "@/components/barra-dominio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listarQuestoes } from "@/lib/db/questoes";
import { getTopico } from "@/lib/db/topicos";
import { IdSchema } from "@/lib/disciplinas/schema";
import { ROTULO_ORIGEM, ROTULO_TIPO } from "@/lib/questoes/rotulos";
import { cn } from "@/lib/utils";
import { marcar } from "./actions";
import { EditorProcedimento } from "./editor-procedimento";
import { EditorQuestao } from "./editor-questao";
import { ImportarNotebookLM } from "./importar-notebooklm";

export const metadata: Metadata = { title: "Tópico · Giro" };

const ICONE = "size-11 px-0 has-[>svg]:px-0";
const SELO = "h-7 px-2.5 text-[13px]";

type Questao = Awaited<ReturnType<typeof listarQuestoes>>[number];

const contagem = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Linha de questão ou de procedimento: selos, texto e as mesmas ações (editar, sinalizar, ativar).
function LinhaItem({
  q,
  topicoId,
  n,
  editor,
  children,
}: {
  q: Questao;
  topicoId: string;
  n: number;
  editor: (rotulo: string) => React.ReactNode;
  children: React.ReactNode;
}) {
  const proc = q.tipo === "procedimento";
  const rotulo = `${proc ? "procedimento" : "questão"} ${n}`;
  const g = proc ? "o" : "a"; // do/da, no/na
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-line bg-sf p-4 md:flex-row md:items-start md:p-5",
        !q.ativa && "bg-sf2/60",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {!proc && (
            <Badge variant="chip" className={SELO}>
              {ROTULO_TIPO[q.tipo]}
            </Badge>
          )}
          <Badge variant="chip" className={cn(SELO, "font-normal text-ink2")}>
            {ROTULO_ORIGEM[q.origem]}
          </Badge>
          {q.sinalizadaComErro && (
            <Badge variant="chip" className={cn(SELO, "border-warn text-warn")}>
              <Flag aria-hidden />
              {proc ? "Sinalizado com erro" : "Sinalizada com erro"}
            </Badge>
          )}
          {!q.ativa && (
            <Badge variant="chip" className={cn(SELO, "border-dashed text-ink3")}>
              <EyeOff aria-hidden />
              {proc ? "Inativo" : "Inativa"}
            </Badge>
          )}
        </div>
        {children}
      </div>
      <div className="flex items-center gap-1 self-end md:self-start">
        {editor(rotulo)}
        <form action={marcar.bind(null, q.id, topicoId, "sinalizadaComErro", !q.sinalizadaComErro)}>
          <Button
            type="submit"
            variant="ghost"
            className={ICONE}
            aria-label={q.sinalizadaComErro ? `Desmarcar erro d${g} ${rotulo}` : `Sinalizar erro n${g} ${rotulo}`}
            title={q.sinalizadaComErro ? "Desmarcar erro" : "Sinalizar erro"}
          >
            {q.sinalizadaComErro ? <FlagOff aria-hidden /> : <Flag aria-hidden />}
          </Button>
        </form>
        <form action={marcar.bind(null, q.id, topicoId, "ativa", !q.ativa)}>
          <Button
            type="submit"
            variant="ghost"
            className={ICONE}
            aria-label={q.ativa ? `Desativar ${rotulo}` : `Ativar ${rotulo}`}
            title={q.ativa ? "Desativar (sai da roleta e das revisões)" : "Ativar"}
          >
            {q.ativa ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </Button>
        </form>
      </div>
    </li>
  );
}

function LinhaQuestao({ q, topicoId, n }: { q: Questao; topicoId: string; n: number }) {
  const taxa = q.respostas ? Math.round((q.acertos / q.respostas) * 100) : null;
  return (
    <LinhaItem
      q={q}
      topicoId={topicoId}
      n={n}
      editor={(rotulo) => (
        <EditorQuestao topicoId={topicoId} questao={q} variant="ghost" className={ICONE} ariaLabel={`Editar ${rotulo}`}>
          <Pencil aria-hidden />
        </EditorQuestao>
      )}
    >
      <p className={cn("line-clamp-3 text-ink", !q.ativa && "text-ink3")}>{q.enunciado}</p>
      <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-ink3">
        <span>{q.fonte ?? "Sem fonte"}</span>
        <span aria-hidden>·</span>
        <span>
          acerto{" "}
          <span className="font-bold text-ink2 tabular-nums">
            {taxa === null ? "—" : `${taxa}% (${q.acertos}/${q.respostas})`}
          </span>
        </span>
      </p>
    </LinhaItem>
  );
}

function LinhaProcedimento({ q, topicoId, n }: { q: Questao; topicoId: string; n: number }) {
  const passos = q.checklist?.passos ?? [];
  const criticos = passos.filter((p) => p.critico).length;
  return (
    <LinhaItem
      q={q}
      topicoId={topicoId}
      n={n}
      editor={(rotulo) => (
        <EditorProcedimento
          topicoId={topicoId}
          procedimento={q}
          variant="ghost"
          className={ICONE}
          ariaLabel={`Editar ${rotulo}`}
        >
          <Pencil aria-hidden />
        </EditorProcedimento>
      )}
    >
      <p className={cn("font-bold text-ink", !q.ativa && "text-ink3")}>{q.enunciado}</p>
      <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[13px] text-ink3">
        <span className="font-bold text-ink2 tabular-nums">
          {contagem(passos.length, "passo", "passos")} · {contagem(criticos, "crítico", "críticos")}
        </span>
        <span aria-hidden>·</span>
        <span>{q.fonte ?? "Sem fonte"}</span>
      </p>
    </LinhaItem>
  );
}

function Secao({
  id,
  titulo,
  resumo,
  acoes,
  vazio,
  children,
}: {
  id: string;
  titulo: string;
  resumo: string;
  acoes: React.ReactNode;
  vazio: React.ReactNode; // false = mostra a lista
  children: React.ReactNode;
}) {
  const idTitulo = `secao-${id}`;
  return (
    <section aria-labelledby={idTitulo} className="not-first-of-type:mt-12">
      <div className="mb-4 flex flex-col gap-3">
        <h2 id={idTitulo} className="font-display text-2xl font-extrabold">
          {titulo} <span className="font-sans text-base font-normal text-ink3">· {resumo}</span>
        </h2>
        <div className="flex flex-wrap gap-2">{acoes}</div>
      </div>
      {vazio || children}
    </section>
  );
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-line p-8 text-center">
      <p className="font-bold">{titulo}</p>
      <p className="mt-1 text-ink3">{texto}</p>
    </div>
  );
}

// params e banco são dados da requisição: ficam dentro de <Suspense> (Cache Components).
async function Conteudo({ id }: { id: string }) {
  if (!IdSchema.safeParse(id).success) notFound();
  const topico = await getTopico(id);
  if (!topico) notFound();
  const itens = await listarQuestoes(id);
  const questoes = itens.filter((q) => q.tipo !== "procedimento");
  const procedimentos = itens.filter((q) => q.tipo === "procedimento");
  const ativas = questoes.filter((q) => q.ativa).length;
  const procAtivos = procedimentos.filter((q) => q.ativa).length;
  const dominio = Math.round(topico.dominio);
  const importar = {
    topicoId: id,
    topico: topico.nome,
    disciplina: topico.disciplinaNome,
    notebooklmUrl: topico.notebooklmUrl,
  };

  return (
    <>
      <nav aria-label="Caminho" className="mb-2 text-ink3">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/disciplinas" className="inline-flex min-h-11 items-center font-bold hover:text-ink">
              Disciplinas
            </Link>
          </li>
          <li className="flex min-w-0 items-center gap-1">
            <ChevronRight className="size-4 shrink-0" aria-hidden />
            <Link
              href={`/disciplinas/${topico.disciplinaId}`}
              className="inline-flex min-h-11 items-center gap-2 font-bold hover:text-ink"
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: topico.cor }} aria-hidden />
              {topico.disciplinaNome}
            </Link>
          </li>
          <li aria-current="page" className="flex min-w-0 items-center gap-1">
            <ChevronRight className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{topico.nome}</span>
          </li>
        </ol>
      </nav>

      <div className="mb-8 min-w-0">
        <h1 className="font-display text-[32px] font-extrabold wrap-break-word md:text-[34px]">{topico.nome}</h1>
        <p className="mt-1 text-ink3">
          domínio <span className="font-bold text-ink2 tabular-nums">{topico.respondido ? `${dominio}%` : "—"}</span>
          {!topico.respondido && (
            <Badge variant="chip" className={cn(SELO, "ml-2")}>
              novo
            </Badge>
          )}
        </p>
        {topico.respondido && <BarraDominio valor={dominio} cor={topico.cor} className="mt-2 max-w-60" />}
      </div>

      <Secao
        id="questoes"
        titulo="Questões"
        resumo={contagem(ativas, "ativa", "ativas")}
        acoes={
          <>
            <EditorQuestao topicoId={id} variant="default">
              <Plus aria-hidden />
              Nova questão
            </EditorQuestao>
            <ImportarNotebookLM tipo="questoes" {...importar} enunciados={questoes.map((q) => q.enunciado)} />
            {/* espaço reservado: IA (sessão 18) */}
            <Button variant="secondary" disabled title="Em breve">
              <Sparkles aria-hidden />
              Gerar com IA <span className="font-normal text-ink3">· em breve</span>
            </Button>
          </>
        }
        vazio={
          questoes.length === 0 && (
            <Vazio
              titulo="Nenhuma questão ainda."
              texto="Crie a primeira em “Nova questão” ou “Gerar com NotebookLM”. O tópico só entra na roleta com questões ativas."
            />
          )
        }
      >
        <ul className="space-y-3">
          {questoes.map((q, i) => (
            <LinhaQuestao key={q.id} q={q} topicoId={id} n={i + 1} />
          ))}
        </ul>
      </Secao>

      <Secao
        id="procedimentos"
        titulo="Procedimentos"
        resumo={contagem(procAtivos, "ativo", "ativos")}
        acoes={
          <>
            <EditorProcedimento topicoId={id} variant="default">
              <Plus aria-hidden />
              Novo procedimento
            </EditorProcedimento>
            <ImportarNotebookLM tipo="procedimentos" {...importar} enunciados={procedimentos.map((q) => q.enunciado)} />
          </>
        }
        vazio={
          procedimentos.length === 0 && (
            <Vazio
              titulo="Nenhum procedimento ainda."
              texto="Manobras e exames com o passo a passo, para treinar de cabeça. Crie em “Novo procedimento” ou “Gerar com NotebookLM”."
            />
          )
        }
      >
        <ul className="space-y-3">
          {procedimentos.map((q, i) => (
            <LinhaProcedimento key={q.id} q={q} topicoId={id} n={i + 1} />
          ))}
        </ul>
      </Secao>
    </>
  );
}

export default function Page({ params }: PageProps<"/topicos/[id]">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        {params.then(({ id }) => (
          <Conteudo id={id} />
        ))}
      </Suspense>
    </div>
  );
}
