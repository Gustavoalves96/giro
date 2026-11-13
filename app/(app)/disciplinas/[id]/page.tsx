import { ChevronLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarraDominio } from "@/components/barra-dominio";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDisciplina, listarTopicos } from "@/lib/db/topicos";
import { IdSchema } from "@/lib/disciplinas/schema";
import { EditorTopico } from "./editor-topico";
import { ExcluirTopico } from "./excluir-topico";

export const metadata: Metadata = { title: "Disciplina · Giro" };

const ICONE = "size-11 px-0 has-[>svg]:px-0";

type Topico = Awaited<ReturnType<typeof listarTopicos>>[number];

function LinhaTopico({ t, cor, disciplinaId }: { t: Topico; cor: string; disciplinaId: string }) {
  const dominio = Math.round(t.dominio);
  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line bg-sf p-4 md:flex-row md:items-center md:p-5">
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-xl font-bold">
          <Link href={`/topicos/${t.id}`} className="flex min-h-11 items-center underline-offset-4 hover:underline">
            <span className="truncate">{t.nome}</span>
          </Link>
        </h2>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink3">
          <span>
            {t.questoesAtivas} {t.questoesAtivas === 1 ? "questão ativa" : "questões ativas"}
          </span>
          <span aria-hidden>·</span>
          {t.respondido ? (
            <span>
              domínio <span className="font-bold text-ink2 tabular-nums">{dominio}%</span>
            </span>
          ) : (
            <span>
              domínio <span className="font-bold text-ink2">—</span>{" "}
              <Badge variant="chip" className="ml-1 h-7 px-2.5 text-[13px]">
                novo
              </Badge>
            </span>
          )}
        </p>
        {t.respondido && <BarraDominio valor={dominio} cor={cor} className="mt-2 max-w-60" />}
      </div>
      <div className="flex items-center gap-1">
        <EditorTopico disciplinaId={disciplinaId} topico={t} variant="ghost" className={ICONE} ariaLabel={`Editar ${t.nome}`}>
          <Pencil aria-hidden />
        </EditorTopico>
        <ExcluirTopico
          id={t.id}
          disciplinaId={disciplinaId}
          nome={t.nome}
          totalQuestoes={t.totalQuestoes}
          className={ICONE}
        />
      </div>
    </li>
  );
}

// params e banco são dados da requisição: ficam dentro de <Suspense> (Cache Components).
async function Conteudo({ id }: { id: string }) {
  if (!IdSchema.safeParse(id).success) notFound();
  const disciplina = await getDisciplina(id);
  if (!disciplina) notFound();
  const topicos = await listarTopicos(id);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex min-w-0 items-center gap-3 font-display text-[32px] font-extrabold md:text-[34px]">
          <span className="size-4 shrink-0 rounded-full" style={{ backgroundColor: disciplina.cor }} aria-hidden />
          <span className="min-w-0 wrap-break-word">{disciplina.nome}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          {disciplina.notebooklmUrl && (
            <Button asChild variant="secondary">
              <a href={disciplina.notebooklmUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                Abrir no NotebookLM
              </a>
            </Button>
          )}
          <EditorTopico disciplinaId={id} variant="default">
            <Plus aria-hidden />
            Novo tópico
          </EditorTopico>
        </div>
      </div>
      {disciplina.arquivada && (
        <p className="mb-4 rounded-2xl bg-sf2 px-4 py-3 text-ink2">Disciplina arquivada: fora da roleta.</p>
      )}

      {topicos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-8 text-center">
          <p className="font-bold">Nenhum tópico ainda.</p>
          <p className="mt-1 text-ink3">Crie o primeiro tópico e depois adicione questões a ele.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {topicos.map((t) => (
            <LinhaTopico key={t.id} t={t} cor={disciplina.cor} disciplinaId={id} />
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page({ params }: PageProps<"/disciplinas/[id]">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <Link
        href="/disciplinas"
        className="mb-2 -ml-2 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 font-bold text-ink3 hover:text-ink"
      >
        <ChevronLeft className="size-5" aria-hidden />
        Disciplinas
      </Link>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        {params.then(({ id }) => (
          <Conteudo id={id} />
        ))}
      </Suspense>
    </div>
  );
}
