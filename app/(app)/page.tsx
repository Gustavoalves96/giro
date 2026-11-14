import { ArrowRight, CalendarDays, Flame, NotebookPen, RotateCw, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarraDominio } from "@/components/barra-dominio";
import { ContinuarRodada } from "@/components/continuar-rodada";
import { MapaCalor } from "@/components/mapa-calor";
import { MarcaGiro } from "@/components/marca";
import { Roda } from "@/components/roleta/roda";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { listarErros } from "@/lib/db/erros";
import { contarDisciplinasAtivas, pontosFracos, resumoSessoes, respostasPorHora } from "@/lib/db/inicio";
import { getPerfil } from "@/lib/db/perfil";
import { provasDesde, proximaProva } from "@/lib/db/provas";
import { minutosRevisao, resumoRevisao } from "@/lib/db/revisao";
import { rodadaAbertaHoje } from "@/lib/db/sessoes";
import { listarTopicosRoleta } from "@/lib/db/topicos";
import { primeiroPasso, saudacao, TEXTO_PRIMEIRO_PASSO } from "@/lib/domain/inicio";
import { contagemRegressiva, diasAte, hojeEmSP, topicosComProvaEm14Dias } from "@/lib/domain/provas";
import { candidatoDe, montarFatias } from "@/lib/domain/roleta";
import { agregarPorDia, mapaDeCalor, rodadasHoje, streak, xpTotal } from "@/lib/domain/stats";
import { META_PADRAO } from "@/lib/perfil/schema";
import { RevisarAgora } from "./revisao/revisar-agora";

export const metadata: Metadata = { title: "Início · Giro" };

const CARD = "rounded-3xl border border-line bg-sf p-5 md:p-6";
const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const dataLonga = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "numeric", month: "long" });
const numero = new Intl.NumberFormat("pt-BR");
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function Chip({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <Badge variant="chip" style={{ backgroundColor: tintaClara(cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}>
      <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
      {children}
    </Badge>
  );
}

function Dominio({ nome, dominio, cor, novo = false }: { nome: string; dominio: number; cor: string; novo?: boolean }) {
  const pct = Math.round(dominio);
  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 font-bold wrap-break-word">{nome}</span>
        <span className="shrink-0 text-ink2 tabular-nums">{novo ? "novo" : `${pct}%`}</span>
      </div>
      <BarraDominio valor={novo ? 0 : pct} cor={cor} />
    </li>
  );
}

// auth(), banco e "agora" são da requisição: tudo dentro de <Suspense> (Cache Components).
async function Conteudo() {
  await connection();
  const agora = new Date();
  const hoje = hojeEmSP(agora);
  const [perfil, sessoes, horas, aberta, revisao, erros, prova, fracos, linhasRoleta, provas, disciplinasAtivas] =
    await Promise.all([
      getPerfil(),
      resumoSessoes(),
      respostasPorHora(),
      rodadaAbertaHoje(agora),
      resumoRevisao(agora),
      listarErros(),
      proximaProva(hoje),
      pontosFracos(),
      listarTopicosRoleta(),
      provasDesde(hoje),
      contarDisciplinasAtivas(),
    ]);

  const porDia = agregarPorDia(horas);
  const sequencia = streak(porDia.keys(), hoje);
  const xp = xpTotal(sessoes);
  const feitas = rodadasHoje(sessoes, hoje);
  const meta = perfil?.metaRodadas ?? META_PADRAO;
  const comProva = topicosComProvaEm14Dias(provas, hoje);
  const candidatos = linhasRoleta.map((l) => candidatoDe(l, agora, comProva));
  const fatias = montarFatias(candidatos, "inteligente", { disciplinaIds: candidatos.map((c) => c.disciplinaId) });
  const passo = primeiroPasso(disciplinasAtivas, candidatos.length);
  const vencidas = revisao.reduce((t, d) => t + d.questoes + d.procedimentos, 0);
  const minutos = minutosRevisao(
    revisao.reduce((t, d) => t + d.questoes, 0),
    revisao.reduce((t, d) => t + d.procedimentos, 0),
  );
  const data = dataLonga.format(agora);

  return (
    <>
      <header className="mb-6">
        <p className="text-ink3">{data[0].toUpperCase() + data.slice(1)}</p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-extrabold md:text-[34px]">{saudacao(agora, perfil?.nome)}</h1>
        <ul className="mt-4 flex flex-wrap gap-2">
          <li>
            <Badge variant="chip" className="border-gold/60 bg-gold/15" data-streak={sequencia}>
              <Flame className="text-gold" aria-hidden />
              <span>
                <span className="tabular-nums">{sequencia}</span> {sequencia === 1 ? "dia" : "dias"}
                <span className="sr-only"> seguidos estudando</span>
              </span>
            </Badge>
          </li>
          <li>
            <Badge variant="chip" data-xp={xp}>
              <Sparkles className="text-gold" aria-hidden />
              <span className="tabular-nums">{numero.format(xp)}</span> XP
            </Badge>
          </li>
        </ul>
      </header>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          {/* card escuro nos dois temas: a classe .dark troca os tokens só dentro dele */}
          <section aria-labelledby="rodada-titulo" className="dark rounded-3xl border border-line bg-sf p-5 text-ink md:p-6">
            <div className="flex items-center gap-5">
              <div className="size-24 shrink-0 md:size-32 [&_text]:hidden" aria-hidden>
                {fatias.length ? <Roda fatias={fatias} destaque={null} borrado={false} /> : <MarcaGiro className="size-full" />}
              </div>
              <div className="min-w-0">
                <h2 id="rodada-titulo" className={ROTULO}>
                  Rodada de hoje
                </h2>
                <p className="mt-1 font-display text-[28px] leading-tight font-extrabold tabular-nums" data-rodadas={`${feitas}/${meta}`}>
                  {feitas} de {meta}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
                  {Array.from({ length: meta }, (_, i) => (
                    <span key={i} className={`h-2 w-5 rounded-full ${i < feitas ? "bg-gold" : "bg-sf2"}`} />
                  ))}
                </div>
                <p className="mt-2 text-ink2">
                  {feitas >= meta ? "Meta do dia batida. Mais uma?" : `Faltam ${plural(meta - feitas, "rodada", "rodadas")} para a meta.`}
                </p>
              </div>
            </div>
            <div className="mt-5 border-t border-line pt-5">
              {passo ? (
                <div data-primeiro-passo={passo}>
                  <p className="font-display text-[22px] leading-tight font-extrabold">{TEXTO_PRIMEIRO_PASSO[passo].titulo}</p>
                  <p className="mt-1 text-ink2">{TEXTO_PRIMEIRO_PASSO[passo].texto}</p>
                  <Button asChild variant="destaque" className="mt-4 w-full sm:w-auto">
                    <Link href="/disciplinas">
                      {TEXTO_PRIMEIRO_PASSO[passo].acao}
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </div>
              ) : aberta ? (
                <div className="flex flex-col gap-3">
                  <ContinuarRodada rodada={aberta} destaque />
                  <Button asChild variant="ghost" className="w-full sm:w-auto sm:self-start">
                    <Link href="/roleta">
                      <RotateCw aria-hidden />
                      Girar outra roleta
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button asChild variant="destaque" className="w-full sm:w-auto">
                  <Link href="/roleta">
                    <RotateCw aria-hidden />
                    Girar a roleta
                  </Link>
                </Button>
              )}
            </div>
          </section>

          <section aria-labelledby="revisao-titulo" className={CARD} data-revisao-total={vencidas}>
            <h2 id="revisao-titulo" className={ROTULO}>
              Revisão do dia
            </h2>
            {vencidas ? (
              <>
                <p className="mt-2 font-display text-[44px] leading-none font-extrabold tabular-nums">{vencidas}</p>
                <p className="mt-1 text-ink2">{vencidas === 1 ? "item venceu hoje" : "itens venceram hoje"}, de todas as disciplinas.</p>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Por disciplina">
                  {revisao.map((d) => (
                    <li key={d.disciplina}>
                      <Chip cor={d.cor}>
                        {d.disciplina} · <span className="tabular-nums">{d.questoes + d.procedimentos}</span>
                      </Chip>
                    </li>
                  ))}
                </ul>
                <RevisarAgora minutos={minutos} />
              </>
            ) : (
              <p className="mt-2 text-ink2">Nada vencido hoje. Cada resposta agenda a próxima revisão daquela questão.</p>
            )}
            <div className="mt-4 border-t border-line pt-4">
              <Button asChild variant="secondary" className="w-full sm:w-auto" data-erros={erros.length}>
                <Link href="/erros">
                  <NotebookPen aria-hidden />
                  Caderno de erros · <span className="tabular-nums">{erros.length}</span>
                </Link>
              </Button>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          {prova && (
            <section aria-labelledby="prova-titulo" className={CARD} data-prova-dias={diasAte(prova.data, hoje)}>
              <h2 id="prova-titulo" className={ROTULO}>
                Próxima prova
              </h2>
              <p className="mt-2 font-display text-[24px] leading-tight font-extrabold wrap-break-word">{prova.titulo}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Chip cor={prova.cor}>{prova.disciplina}</Chip>
                <span className="flex items-center gap-1.5 font-bold">
                  <CalendarDays className="size-4 text-ink3" aria-hidden />
                  {contagemRegressiva(diasAte(prova.data, hoje))}
                </span>
              </div>
              {prova.topicos.length ? (
                <ul className="mt-4 flex flex-col gap-3" aria-label="Tópicos da prova e domínio">
                  {prova.topicos.map((t) => (
                    <Dominio key={t.id} nome={t.nome} dominio={t.dominio} cor={prova.cor} novo={t.novo} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-ink3">Sem tópicos marcados nesta prova.</p>
              )}
              <Button asChild variant="ghost" className="mt-3 -ml-3">
                <Link href="/provas">
                  Ver provas
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </section>
          )}

          <section aria-labelledby="fracos-titulo" className={CARD}>
            <h2 id="fracos-titulo" className={ROTULO}>
              Pontos fracos
            </h2>
            {fracos.length ? (
              <ul className="mt-4 flex flex-col gap-3" data-fracos={fracos.map((f) => f.id).join(",")}>
                {fracos.map((t) => (
                  <Dominio key={t.id} nome={t.nome} dominio={t.dominio} cor={t.cor} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-ink2">Aparecem aqui os 3 tópicos de menor domínio, depois das primeiras respostas.</p>
            )}
          </section>
        </div>

        <section aria-labelledby="atividade-titulo" className={`${CARD} lg:col-span-2`}>
          <h2 id="atividade-titulo" className={`${ROTULO} mb-4`}>
            Atividade · 14 semanas
          </h2>
          <MapaCalor semanas={mapaDeCalor(porDia, hoje)} />
        </section>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}
