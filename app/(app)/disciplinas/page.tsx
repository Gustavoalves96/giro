import { Archive, ArchiveRestore, ArrowDown, ArrowUp, ExternalLink, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BarraDominio } from "@/components/barra-dominio";
import { Button } from "@/components/ui/button";
import { listarDisciplinas } from "@/lib/db/disciplinas";
import { arquivar, mover } from "./actions";
import { EditorDisciplina } from "./editor-disciplina";

export const metadata: Metadata = { title: "Disciplinas · Giro" };

type Linha = Awaited<ReturnType<typeof listarDisciplinas>>[number];

const ICONE = "size-11 px-0 has-[>svg]:px-0";

function Detalhes({ d }: { d: Linha }) {
  const dominio = d.dominioMedio === null ? null : Math.round(d.dominioMedio);
  return (
    <div className="min-w-0 flex-1">
      <h3 className="flex items-center gap-3 font-display text-xl font-bold">
        <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: d.cor }} aria-hidden />
        <Link
          href={`/disciplinas/${d.id}`}
          className="flex min-h-11 min-w-0 items-center underline-offset-4 hover:underline"
        >
          <span className="truncate">{d.nome}</span>
        </Link>
      </h3>
      <p className="mt-1 text-ink3">
        {d.totalTopicos} {d.totalTopicos === 1 ? "tópico" : "tópicos"} · domínio médio{" "}
        <span className="font-bold text-ink2 tabular-nums">{dominio === null ? "—" : `${dominio}%`}</span>
      </p>
      {dominio !== null && <BarraDominio valor={dominio} cor={d.cor} className="mt-2 max-w-60" />}
    </div>
  );
}

function BotaoNotebook({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <Button asChild variant="secondary">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden />
        NotebookLM
      </a>
    </Button>
  );
}

function LinhaAtiva({ d, primeira, ultima }: { d: Linha; primeira: boolean; ultima: boolean }) {
  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line bg-sf p-4 md:flex-row md:items-center md:p-5">
      <Detalhes d={d} />
      <div className="flex flex-wrap items-center gap-1">
        <BotaoNotebook url={d.notebooklmUrl} />
        <EditorDisciplina disciplina={d} variant="ghost" className={ICONE} ariaLabel={`Editar ${d.nome}`}>
          <Pencil aria-hidden />
        </EditorDisciplina>
        <form action={mover.bind(null, d.id, "subir")}>
          <Button type="submit" variant="ghost" className={ICONE} disabled={primeira} aria-label={`Subir ${d.nome}`}>
            <ArrowUp aria-hidden />
          </Button>
        </form>
        <form action={mover.bind(null, d.id, "descer")}>
          <Button type="submit" variant="ghost" className={ICONE} disabled={ultima} aria-label={`Descer ${d.nome}`}>
            <ArrowDown aria-hidden />
          </Button>
        </form>
        <form action={arquivar.bind(null, d.id, true)}>
          <Button type="submit" variant="ghost" className={ICONE} aria-label={`Arquivar ${d.nome}`} title="Arquivar">
            <Archive aria-hidden />
          </Button>
        </form>
      </div>
    </li>
  );
}

function LinhaArquivada({ d }: { d: Linha }) {
  return (
    <li className="flex flex-col gap-3 rounded-3xl border border-line bg-sf p-4 md:flex-row md:items-center md:p-5">
      <Detalhes d={d} />
      <form action={arquivar.bind(null, d.id, false)}>
        <Button type="submit" variant="secondary">
          <ArchiveRestore aria-hidden />
          Desarquivar
        </Button>
      </form>
    </li>
  );
}

// Banco = dado da requisição: fica dentro de <Suspense> (Cache Components).
async function Lista() {
  const todas = await listarDisciplinas();
  const ativas = todas.filter((d) => !d.arquivada);
  const arquivadas = todas.filter((d) => d.arquivada);

  return (
    <>
      {ativas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-8 text-center">
          <p className="font-bold">Nenhuma disciplina ainda.</p>
          <p className="mt-1 text-ink3">Crie a primeira para começar a montar a roleta.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ativas.map((d, i) => (
            <LinhaAtiva key={d.id} d={d} primeira={i === 0} ultima={i === ativas.length - 1} />
          ))}
        </ul>
      )}

      {arquivadas.length > 0 && (
        <details className="mt-8">
          <summary className="flex min-h-11 cursor-pointer items-center text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase">
            Arquivadas ({arquivadas.length}) · fora da roleta
          </summary>
          <ul className="mt-3 space-y-3 opacity-80">
            {arquivadas.map((d) => (
              <LinhaArquivada key={d.id} d={d} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-[32px] font-extrabold md:text-[34px]">Disciplinas</h1>
        <EditorDisciplina variant="default">
          <Plus aria-hidden />
          Nova disciplina
        </EditorDisciplina>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        <Lista />
      </Suspense>
    </div>
  );
}
