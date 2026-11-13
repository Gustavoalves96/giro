import { ChevronRight, Eye, EyeOff, Flag, FlagOff, Pencil, Plus, Sparkles, Upload } from "lucide-react";
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
import { EditorQuestao } from "./editor-questao";

export const metadata: Metadata = { title: "Tópico · Giro" };

const ICONE = "size-11 px-0 has-[>svg]:px-0";
const SELO = "h-7 px-2.5 text-[13px]";

type Questao = Awaited<ReturnType<typeof listarQuestoes>>[number];

function LinhaQuestao({ q, topicoId, n }: { q: Questao; topicoId: string; n: number }) {
  const taxa = q.respostas ? Math.round((q.acertos / q.respostas) * 100) : null;
  const rotulo = `questão ${n}`;
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-3xl border border-line bg-sf p-4 md:flex-row md:items-start md:p-5",
        !q.ativa && "bg-sf2/60",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="chip" className={SELO}>
            {ROTULO_TIPO[q.tipo]}
          </Badge>
          <Badge variant="chip" className={cn(SELO, "font-normal text-ink2")}>
            {ROTULO_ORIGEM[q.origem]}
          </Badge>
          {q.sinalizadaComErro && (
            <Badge variant="chip" className={cn(SELO, "border-warn text-warn")}>
              <Flag aria-hidden />
              Sinalizada com erro
            </Badge>
          )}
          {!q.ativa && (
            <Badge variant="chip" className={cn(SELO, "border-dashed text-ink3")}>
              <EyeOff aria-hidden />
              Inativa
            </Badge>
          )}
        </div>
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
      </div>
      <div className="flex items-center gap-1 self-end md:self-start">
        <EditorQuestao topicoId={topicoId} questao={q} variant="ghost" className={ICONE} ariaLabel={`Editar ${rotulo}`}>
          <Pencil aria-hidden />
        </EditorQuestao>
        <form action={marcar.bind(null, q.id, topicoId, "sinalizadaComErro", !q.sinalizadaComErro)}>
          <Button
            type="submit"
            variant="ghost"
            className={ICONE}
            aria-label={q.sinalizadaComErro ? `Desmarcar erro da ${rotulo}` : `Sinalizar erro na ${rotulo}`}
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

// params e banco são dados da requisição: ficam dentro de <Suspense> (Cache Components).
async function Conteudo({ id }: { id: string }) {
  if (!IdSchema.safeParse(id).success) notFound();
  const topico = await getTopico(id);
  if (!topico) notFound();
  const questoes = await listarQuestoes(id);
  const ativas = questoes.filter((q) => q.ativa).length;
  const dominio = Math.round(topico.dominio);

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

      <div className="mb-6 flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-[32px] font-extrabold wrap-break-word md:text-[34px]">{topico.nome}</h1>
          <p className="mt-1 text-ink3">
            {ativas} {ativas === 1 ? "questão ativa" : "questões ativas"} · domínio{" "}
            <span className="font-bold text-ink2 tabular-nums">{topico.respondido ? `${dominio}%` : "—"}</span>
            {!topico.respondido && (
              <Badge variant="chip" className={cn(SELO, "ml-2")}>
                novo
              </Badge>
            )}
          </p>
          {topico.respondido && <BarraDominio valor={dominio} cor={topico.cor} className="mt-2 max-w-60" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <EditorQuestao topicoId={id} variant="default">
            <Plus aria-hidden />
            Nova questão
          </EditorQuestao>
          {/* espaços reservados: importação (sessão 06) e IA (sessão 16) */}
          <Button variant="secondary" disabled title="Em breve">
            <Upload aria-hidden />
            Gerar com NotebookLM <span className="font-normal text-ink3">· em breve</span>
          </Button>
          <Button variant="secondary" disabled title="Em breve">
            <Sparkles aria-hidden />
            Gerar com IA <span className="font-normal text-ink3">· em breve</span>
          </Button>
        </div>
      </div>

      {questoes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-8 text-center">
          <p className="font-bold">Nenhuma questão ainda.</p>
          <p className="mt-1 text-ink3">Crie a primeira em “Nova questão”. O tópico só entra na roleta com questões ativas.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {questoes.map((q, i) => (
            <LinhaQuestao key={q.id} q={q} topicoId={id} n={i + 1} />
          ))}
        </ul>
      )}
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
