import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { BarraDominio } from "@/components/barra-dominio";
import { estudoPorHora, passosEsquecidos, praticouProcedimento, topSessoes } from "@/lib/db/estatisticas";
import { pontosFracos, respostasPorHora, resumoSessoes } from "@/lib/db/inicio";
import { hojeEmSP } from "@/lib/domain/provas";
import { acertosInicioFim, agregarPorDia, agregarPorSemana, maiorSequencia, streak, xpTotal } from "@/lib/domain/stats";
import { SerieSemanal } from "./serie-semanal";

export const metadata: Metadata = { title: "Estatísticas · Giro" };

const SEMANAS = 8;
const CARD = "rounded-3xl border border-line bg-sf p-5 md:p-6";
const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const numero = new Intl.NumberFormat("pt-BR");
const dataSessao = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit" });
const ddmm = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const plural = (n: number, um: string, varios: string) => `${numero.format(n)} ${n === 1 ? um : varios}`;

function Numero({ rotulo, valor, detalhe, dado, largo }: { rotulo: string; valor: string; detalhe?: string; dado: string; largo?: boolean }) {
  // largo: ocupa a linha inteira no celular. "33% → 53%" não quebra: encolhe se o card for estreito
  // (14cqi cabe até "100% → 100%")
  const seta = valor.includes("→");
  return (
    <div className={largo ? `${CARD} @container max-sm:col-span-2` : CARD} data-numero={dado}>
      <h2 className={ROTULO}>{rotulo}</h2>
      <p
        className={`mt-2 font-display leading-tight font-extrabold tabular-nums ${seta ? "text-[length:min(30px,14cqi)] whitespace-nowrap md:text-[length:min(36px,14cqi)]" : "text-[30px] md:text-[36px]"}`}
      >
        {valor}
      </p>
      {detalhe && <p className="mt-1 text-ink2">{detalhe}</p>}
    </div>
  );
}

// auth(), banco e "agora" são da requisição: tudo dentro de <Suspense> (Cache Components).
async function Conteudo() {
  await connection();
  const hoje = hojeEmSP(new Date());
  const [horas, estudo, sessoes, ranking, top, praticou, passos] = await Promise.all([
    respostasPorHora(),
    estudoPorHora(),
    resumoSessoes(),
    pontosFracos(null),
    topSessoes(),
    praticouProcedimento(),
    passosEsquecidos(),
  ]);

  const diasLista = [...agregarPorDia(horas).keys()];
  const atual = streak(diasLista, hoje);
  const maior = maiorSequencia(diasLista);
  const semanas = agregarPorSemana(
    [...horas.map((h) => ({ em: h.em, respostas: h.n, acertos: h.acertos })), ...estudo.map((e) => ({ em: e.em, segundos: e.segundos }))],
    hoje,
    SEMANAS,
  );
  const respondidas = semanas.reduce((t, s) => t + s.respostas, 0);
  const acertos = acertosInicioFim(semanas);
  const rotulos = semanas.map((s) => `semana de ${ddmm(s.inicio)}`);
  const pct = semanas.map((s) => (s.respostas ? Math.round((100 * s.acertos) / s.respostas) : null));
  const minutos = semanas.map((s) => Math.round(s.segundos / 60));
  const totalMin = minutos.reduce((t, m) => t + m, 0);
  const comResposta = semanas.filter((s) => s.respostas);

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-[28px] leading-tight font-extrabold md:text-[34px]">Estatísticas</h1>
        <p className="mt-1 text-ink2">Você contra você mesma. Período: últimas {SEMANAS} semanas.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Numero rotulo="XP total" valor={numero.format(xpTotal(sessoes))} detalhe="de todas as sessões finalizadas" dado={String(xpTotal(sessoes))} />
        <Numero rotulo="Maior sequência" valor={plural(maior, "dia", "dias")} detalhe={`atual: ${plural(atual, "dia", "dias")}`} dado={`${maior}/${atual}`} />
        <Numero
          rotulo="Acertos"
          largo
          valor={acertos ? (acertos.fim === null ? `${acertos.inicio}%` : `${acertos.inicio}% → ${acertos.fim}%`) : "–"}
          detalhe={acertos ? (acertos.fim === null ? "numa semana com respostas" : "1ª × última semana com respostas") : "sem respostas no período"}
          dado={acertos ? `${acertos.inicio}/${acertos.fim ?? ""}` : ""}
        />
        <Numero largo rotulo="Questões respondidas" valor={numero.format(respondidas)} detalhe={`nas ${SEMANAS} semanas`} dado={String(respondidas)} />
      </div>

      <section aria-labelledby="evolucao-titulo" className={`${CARD} mt-4 md:mt-6`}>
        <h2 id="evolucao-titulo" className={`${ROTULO} mb-4`}>
          Evolução semanal
        </h2>
        {respondidas || totalMin ? (
          <>
            <div className="flex flex-col gap-6">
              <SerieSemanal
                id="g-questoes"
                titulo="Questões respondidas"
                descricao={
                  respondidas
                    ? `${plural(respondidas, "questão", "questões")} em ${plural(comResposta.length, "semana", "semanas")} com atividade.`
                    : "Nenhuma questão respondida no período."
                }
                semanas={rotulos}
                valores={semanas.map((s) => s.respostas)}
                texto={(v) => numero.format(v ?? 0)}
                tipo="barras"
              />
              <SerieSemanal
                id="g-acertos"
                titulo="% de acertos"
                descricao={
                  acertos
                    ? `De ${acertos.inicio}% na primeira semana com respostas` + (acertos.fim === null ? "." : ` a ${acertos.fim}% na última.`)
                    : "Sem respostas no período."
                }
                semanas={rotulos}
                valores={pct}
                texto={(v) => (v === null ? "–" : `${v}%`)}
                tipo="linha"
                max={100}
              />
              <SerieSemanal
                id="g-minutos"
                titulo="Minutos estudados"
                descricao={totalMin ? `${plural(totalMin, "minuto", "minutos")} de estudo no período.` : "Nenhum tempo de estudo gravado no período."}
                semanas={rotulos}
                valores={minutos}
                texto={(v) => numero.format(v ?? 0)}
                tipo="barras"
              />
              <ol
                aria-hidden
                className="-mt-3 grid border-t border-line pt-2 text-center text-[12px] text-ink3 tabular-nums"
                style={{ gridTemplateColumns: `repeat(${SEMANAS}, minmax(0, 1fr))` }}
              >
                {semanas.map((s) => (
                  <li key={s.inicio}>{ddmm(s.inicio)}</li>
                ))}
              </ol>
            </div>
            <p className="mt-3 text-[13px] text-ink3">Cada coluna é uma semana, de segunda a domingo; a data é a segunda-feira.</p>
          </>
        ) : (
          <p className="text-ink2">Os gráficos aparecem depois das primeiras respostas ou do primeiro tempo de estudo.</p>
        )}
      </section>

      <div className="mt-4 grid gap-4 md:mt-6 md:gap-6 lg:grid-cols-2">
        <section aria-labelledby="ranking-titulo" className={CARD}>
          <h2 id="ranking-titulo" className={ROTULO}>
            Tópicos, do pior ao melhor
          </h2>
          {ranking.length ? (
            <ol className="mt-4 flex flex-col gap-1" data-ranking={ranking.map((t) => t.id).join(",")}>
              {ranking.map((t) => (
                <li key={t.id}>
                  <Link href={`/topicos/${t.id}`} className="-mx-2 flex min-h-11 flex-col justify-center gap-1.5 rounded-xl px-2 py-1.5 hover:bg-sf2">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 wrap-break-word">
                        <span className="font-bold">{t.nome}</span> <span className="text-[13px] text-ink3">· {t.disciplina}</span>
                      </span>
                      <span className="shrink-0 text-ink2 tabular-nums">{Math.round(t.dominio)}%</span>
                    </span>
                    <BarraDominio valor={Math.round(t.dominio)} cor={t.cor} />
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-ink2">O ranking aparece depois da primeira rodada finalizada.</p>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-4 md:gap-6">
          <section aria-labelledby="top-titulo" className={CARD}>
            <h2 id="top-titulo" className={ROTULO}>
              Melhores rodadas
            </h2>
            {top.length ? (
              <ol className="mt-3 flex flex-col" data-top={top.map((s) => s.pontuacao).join(",")}>
                {top.map((s, i) => (
                  <li key={s.id} className="flex min-h-11 items-center gap-3 border-b border-line py-2 last:border-0">
                    <span className="w-6 shrink-0 text-right font-bold text-ink3 tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1 wrap-break-word">
                      {s.topicoId ? (
                        <Link href={`/topicos/${s.topicoId}`} className="font-bold hover:underline">
                          {s.topico}
                        </Link>
                      ) : (
                        <span className="text-ink3">tópico apagado</span>
                      )}
                      <span className="block text-[13px] text-ink3 tabular-nums">{dataSessao.format(s.finalizadaEm!)}</span>
                    </span>
                    <span className="shrink-0 font-display text-[20px] font-extrabold tabular-nums">{numero.format(s.pontuacao)}</span>
                    <span className="sr-only">pontos</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-ink2">Suas rodadas finalizadas de maior pontuação aparecem aqui.</p>
            )}
          </section>

          {praticou && (
            <section aria-labelledby="passos-titulo" className={CARD}>
              <h2 id="passos-titulo" className={ROTULO}>
                Passos que você mais esquece
              </h2>
              {passos.length ? (
                <ol className="mt-3 flex flex-col" data-passos={passos.map((p) => p.n).join(",")}>
                  {passos.map((p) => (
                    <li key={`${p.questao_id}-${p.passo}`} className="flex min-h-11 items-center gap-3 border-b border-line py-2 last:border-0">
                      <span className="min-w-0 flex-1 wrap-break-word">
                        {p.passo}
                        <Link href={`/topicos/${p.topico_id}`} className="block text-[13px] text-ink3 hover:underline">
                          {p.procedimento}
                        </Link>
                      </span>
                      <span className="shrink-0 font-bold tabular-nums">{p.n}×</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-ink2">Nenhum passo esquecido ou feito com erro até agora.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}
