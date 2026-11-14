import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { filtrarErros, type ItemErro, listarErros } from "@/lib/db/erros";
import { FiltroErrosSchema, queryFiltro } from "@/lib/erros/schema";
import { ROTULO_TIPO } from "@/lib/questoes/rotulos";
import { cn } from "@/lib/utils";
import { Refazer } from "./refazer";

export const metadata: Metadata = { title: "Caderno de erros · Giro" };

const CARD = "rounded-3xl border border-line bg-sf p-4 md:p-5";
const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const FILTRO = "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-bold transition-colors";
const quando = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Texto da alternativa (sem a letra: na tela ela via as alternativas embaralhadas).
function textoDe(letra: string, item: ItemErro) {
  if (letra === "?") return "Não sabia (mostrou a resposta)";
  if (letra === "V") return "Verdadeiro";
  if (letra === "F") return "Falso";
  return item.alternativas?.find((a) => a.letra === letra)?.texto ?? letra;
}

function Chip({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "true" : undefined}
      className={cn(FILTRO, ativo ? "border-ink bg-ink text-bg" : "border-line bg-sf text-ink hover:bg-sf2")}
    >
      {children}
    </Link>
  );
}

// Disciplinas e tópicos com erro (na ordem da lista), com a contagem.
function contar<K extends "disciplinaId" | "topicoId">(itens: ItemErro[], chave: K, nome: (i: ItemErro) => string) {
  const m = new Map<string, { id: string; nome: string; cor: string; n: number }>();
  for (const i of itens) {
    const g = m.get(i[chave]) ?? { id: i[chave], nome: nome(i), cor: i.cor, n: 0 };
    g.n++;
    m.set(i[chave], g);
  }
  return [...m.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function Item({ i }: { i: ItemErro }) {
  return (
    <li className={cn(CARD, "flex flex-col gap-3")} data-erro={i.questaoId}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="chip" style={{ backgroundColor: tintaClara(i.cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}>
          <span className="size-2.5 rounded-full" style={{ backgroundColor: i.cor }} aria-hidden />
          {i.disciplina}
        </Badge>
        <span className="min-w-0 font-bold break-words text-ink2">{i.topico}</span>
      </div>
      <p className="text-[14px] text-ink3">
        {ROTULO_TIPO[i.tipo]} · errou em <time dateTime={i.respondidaEm.toISOString()}>{quando.format(i.respondidaEm)}</time>
      </p>
      <p className="line-clamp-4 text-[17px] leading-snug break-words">{i.enunciado}</p>
      {i.fracao != null ? (
        <div className="rounded-2xl bg-sf2 p-3 text-[15px]">
          <p data-fracao={i.fracao}>
            <span className="font-bold tabular-nums">{Math.round(i.fracao * 100)}% lembrado</span> na última tentativa
          </p>
          {!!i.esquecidos?.length && (
            <ul className="mt-1 flex flex-col gap-0.5 text-ink2">
              {i.esquecidos.map((t, k) => (
                <li key={k} className="break-words">
                  <span className="font-bold text-warn">Esqueceu:</span> {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <dl className="grid gap-2 rounded-2xl bg-sf2 p-3 text-[15px] sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="font-bold text-warn">Sua resposta</dt>
            <dd className="break-words" data-resposta>{textoDe(i.respostaDada, i)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="font-bold text-ok">Correta</dt>
            <dd className="break-words" data-gabarito>{textoDe(i.gabarito, i)}</dd>
          </div>
        </dl>
      )}
      <Refazer
        filtro={{ questao: i.questaoId }}
        rotulo="Refazer"
        ariaLabel={`Refazer: ${i.enunciado.slice(0, 80)}`}
        variant="secondary"
        className="self-start"
      />
    </li>
  );
}

// Banco e search params são da requisição: ficam dentro de <Suspense> (Cache Components).
async function Conteudo({ searchParams }: PageProps<"/erros">) {
  const [todos, params] = await Promise.all([listarErros(), searchParams]);
  const f = FiltroErrosSchema.parse(params);
  // vindo do resultado da roleta só com ?topico=: a disciplina é a do tópico
  const disciplina = f.disciplina ?? todos.find((i) => i.topicoId === f.topico)?.disciplinaId;
  const filtro = { disciplina, topico: f.topico };
  const itens = filtrarErros(todos, filtro);

  if (!todos.length) {
    return (
      <section className={CARD} data-erros-vazio>
        <h2 className="font-display text-[24px] font-extrabold">Nenhum erro no caderno</h2>
        <p className="mt-2 text-ink2">Aqui aparece cada questão ou procedimento cuja última resposta foi errada.</p>
        <Button asChild variant="secondary" className="mt-5">
          <Link href="/roleta">Girar a roleta</Link>
        </Button>
      </section>
    );
  }

  const disciplinas = contar(todos, "disciplinaId", (i) => i.disciplina);
  const topicos = disciplina ? contar(filtrarErros(todos, { disciplina }), "topicoId", (i) => i.topico) : [];
  return (
    <>
      <nav aria-label="Filtrar por disciplina" className="flex flex-wrap gap-2">
        <Chip href="/erros" ativo={!disciplina}>
          Todas · <span className="tabular-nums">{todos.length}</span>
        </Chip>
        {disciplinas.map((d) => (
          <Chip key={d.id} href={`/erros${queryFiltro({ disciplina: d.id })}`} ativo={d.id === disciplina}>
            <span className="size-2.5 rounded-full" style={{ backgroundColor: d.cor }} aria-hidden />
            {d.nome} · <span className="tabular-nums">{d.n}</span>
          </Chip>
        ))}
      </nav>
      {topicos.length > 0 && (
        <nav aria-label="Filtrar por tópico" className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          <Chip href={`/erros${queryFiltro({ disciplina })}`} ativo={!f.topico}>
            Todos os tópicos
          </Chip>
          {topicos.map((t) => (
            <Chip key={t.id} href={`/erros${queryFiltro({ disciplina, topico: t.id })}`} ativo={t.id === f.topico}>
              {t.nome} · <span className="tabular-nums">{t.n}</span>
            </Chip>
          ))}
        </nav>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className={ROTULO} data-erros-total={itens.length}>
          {plural(itens.length, "item", "itens")}
        </p>
        {itens.length > 0 && <Refazer filtro={filtro} rotulo={itens.length === 1 ? "Refazer" : `Refazer todos os ${itens.length}`} />}
      </div>
      {itens.length ? (
        <ul className="mt-3 grid gap-3 xl:grid-cols-2">
          {itens.map((i) => (
            <Item key={i.questaoId} i={i} />
          ))}
        </ul>
      ) : (
        <section className={cn(CARD, "mt-3")}>
          <h2 className="font-display text-[22px] font-extrabold">Nenhum erro neste filtro</h2>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/erros">Ver todos os erros</Link>
          </Button>
        </section>
      )}
    </>
  );
}

export default function Page(props: PageProps<"/erros">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="font-display text-[32px] font-extrabold md:text-[34px]">Caderno de erros</h1>
      <p className="mt-1 mb-6 text-ink3">Questões e procedimentos cuja última resposta foi errada. Acertou de novo, sai daqui.</p>
      <Suspense fallback={<div className="h-56 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        <Conteudo {...props} />
      </Suspense>
    </div>
  );
}
