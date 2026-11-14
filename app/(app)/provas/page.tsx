import { CalendarClock, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarraDominio } from "@/components/barra-dominio";
import { Badge } from "@/components/ui/badge";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { listarDisciplinas } from "@/lib/db/disciplinas";
import { listarProvas, listarTodosTopicos } from "@/lib/db/provas";
import { contagemRegressiva, diasAte, hojeEmSP, JANELA_PROVA_DIAS } from "@/lib/domain/provas";
import { cn } from "@/lib/utils";
import { EditorProva, ExcluirProva, type Opcoes } from "./editor-prova";

export const metadata: Metadata = { title: "Provas · Giro" };

const ICONE = "size-11 px-0 has-[>svg]:px-0";
const TITULO = "font-display text-[32px] font-extrabold md:text-[34px]";
// provas.data é dia sem hora: formata em UTC para não voltar um dia
const dataLonga = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric" });

type Prova = Awaited<ReturnType<typeof listarProvas>>[number];
type Topico = Awaited<ReturnType<typeof listarTodosTopicos>>[number];

function LinhaProva({ p, dias, topicos, opcoes }: { p: Prova; dias: number; topicos: Map<string, Topico>; opcoes: Opcoes }) {
  // ids de tópicos apagados (sem FK) ficam de fora
  const tops = p.topicoIds.flatMap((id) => topicos.get(id) ?? []);
  const naJanela = dias >= 0 && dias <= JANELA_PROVA_DIAS;
  return (
    <li className="rounded-3xl border border-line bg-sf p-4 md:p-5" data-prova={p.id}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <p className={cn("font-display text-lg font-extrabold", naJanela ? "text-ink" : "text-ink3")} data-contagem>
            {contagemRegressiva(dias)}
          </p>
          <h3 className="mt-1 font-display text-xl font-bold break-words">{p.titulo}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="chip" style={{ backgroundColor: tintaClara(p.cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: p.cor }} aria-hidden />
              {p.disciplina}
            </Badge>
            <span className="text-ink3 first-letter:uppercase">{dataLonga.format(new Date(`${p.data}T00:00:00Z`))}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 self-end md:self-start">
          <EditorProva prova={p} opcoes={opcoes} variant="ghost" className={ICONE} ariaLabel={`Editar ${p.titulo}`}>
            <Pencil aria-hidden />
          </EditorProva>
          <ExcluirProva id={p.id} titulo={p.titulo} className={ICONE} />
        </div>
      </div>
      {tops.length > 0 && (
        <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {tops.map((t) => (
            <li key={t.id} className="min-w-0">
              <p className="flex justify-between gap-3">
                <span className="min-w-0 break-words">{t.nome}</span>
                <span className="font-bold text-ink2 tabular-nums">{Math.round(t.dominio)}%</span>
              </p>
              <BarraDominio valor={Math.round(t.dominio)} cor={p.cor} className="mt-1" />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// Banco e "hoje" são da requisição: ficam dentro de <Suspense> (Cache Components).
async function Conteudo() {
  await connection();
  const hoje = hojeEmSP(new Date());
  const [provas, todosTopicos, disciplinas] = await Promise.all([listarProvas(), listarTodosTopicos(), listarDisciplinas()]);
  const opcoes: Opcoes = {
    disciplinas: disciplinas.map(({ id, nome, arquivada }) => ({ id, nome, arquivada })),
    topicos: todosTopicos,
  };
  const topicos = new Map(todosTopicos.map((t) => [t.id, t]));
  const comDias = provas.map((p) => ({ p, dias: diasAte(p.data, hoje) }));
  const proximas = comDias.filter((x) => x.dias >= 0);
  const passadas = comDias.filter((x) => x.dias < 0).reverse(); // mais recente primeiro

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className={TITULO}>Provas</h1>
        <EditorProva opcoes={opcoes} variant="default">
          <Plus aria-hidden />
          Nova prova
        </EditorProva>
      </div>

      {proximas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line p-8 text-center">
          <CalendarClock className="mx-auto mb-3 size-8 text-ink3" aria-hidden />
          <p className="font-bold">Nenhuma prova marcada.</p>
          <p className="mt-1 text-ink3">Marque as próximas: os tópicos delas ganham fatia maior na roleta nos 14 dias antes.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {proximas.map(({ p, dias }) => (
            <LinhaProva key={p.id} p={p} dias={dias} topicos={topicos} opcoes={opcoes} />
          ))}
        </ul>
      )}

      {passadas.length > 0 && (
        <details className="mt-8">
          <summary className="flex min-h-11 cursor-pointer items-center text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase">
            Passadas ({passadas.length})
          </summary>
          <ul className="mt-3 space-y-3 opacity-80">
            {passadas.map(({ p, dias }) => (
              <LinhaProva key={p.id} p={p} dias={dias} topicos={topicos} opcoes={opcoes} />
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
      <Suspense
        fallback={
          <>
            <h1 className={cn(TITULO, "mb-6")}>Provas</h1>
            <div className="h-64 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />
          </>
        }
      >
        <Conteudo />
      </Suspense>
    </div>
  );
}
