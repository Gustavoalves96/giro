import { Check, Home, RotateCw, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { acertosRecentesTopico, recordeAnterior, respostasDaSessao } from "@/lib/db/sessoes";
import { calcularDominio } from "@/lib/domain/dominio";
import { passosEsquecidos } from "@/lib/domain/erros";
import { pontosQuestao } from "@/lib/domain/pontuacao";
import { cn } from "@/lib/utils";
import { carregarSessao, rota } from "../carregar";
import { BarraAntesDepois, SeloRecorde } from "./animacoes";

export const metadata: Metadata = { title: "Resultado · Giro" };

const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const CARD = "rounded-3xl border border-line bg-sf p-5 md:p-6";

function mmss(segundos: number) {
  const s = Math.round(segundos);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Pontos de cada questão, com a sequência correndo (mesma regra do resumoSessao).
function comPontos<T extends { acertou: boolean; tempoMs: number }>(rs: T[]) {
  let seq = 0;
  return rs.map((r) => {
    seq = r.acertou ? seq + 1 : 0;
    return { ...r, pontos: pontosQuestao({ ...r, sequenciaAtual: seq }) };
  });
}

// Passos esquecidos (até 3), na ordem do checklist atual.
function esquecidos(r: Awaited<ReturnType<typeof respostasDaSessao>>[number]) {
  return passosEsquecidos(r.checklist?.passos ?? [], r.notas ?? []).slice(0, 3);
}

type Props = PageProps<"/roleta/sessao/[id]/resultado">;

// Tudo vem do banco: o resultado é o mesmo se recarregar ou abrir depois.
async function Conteudo({ params }: Props) {
  const { id } = await params;
  const s = await carregarSessao(id, "roleta");
  if (!s.finalizadaEm) redirect(rota(id, "questoes"));
  const [rs, recorde, antes, depois] = await Promise.all([
    respostasDaSessao(s.id),
    recordeAnterior(s.id, s.finalizadaEm),
    s.topicoId ? acertosRecentesTopico(s.topicoId, s.iniciadaEm, false) : null,
    s.topicoId ? acertosRecentesTopico(s.topicoId, s.finalizadaEm, true) : null,
  ]);
  const novoRecorde = s.pontuacao > 0 && s.pontuacao > recorde;
  const erros = s.totalQuestoes - s.acertos;
  const questoesSeg = rs.reduce((t, r) => t + r.tempoMs, 0) / 1000;

  const linhas = comPontos(rs);

  const numeros = [
    { rotulo: "Acertos", valor: `${s.acertos}/${s.totalQuestoes}` },
    { rotulo: "Maior sequência", valor: `x${s.maiorSequencia}` },
    { rotulo: "Tempo", valor: mmss(s.estudoSegundos + questoesSeg), nota: `estudo ${mmss(s.estudoSegundos)} · questões ${mmss(questoesSeg)}` },
  ];

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-6 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="resultado-titulo" className={CARD}>
          {novoRecorde && <SeloRecorde />}
          <p className={ROTULO}>Rodada concluída</p>
          <h1 id="resultado-titulo" className="mt-1 font-display text-[28px] leading-tight font-extrabold wrap-break-word md:text-[32px]">
            {s.topico ?? "Tópico excluído"}
          </h1>
          {s.disciplina && s.cor && (
            <Badge variant="chip" className="mt-2" style={{ backgroundColor: tintaClara(s.cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: s.cor }} aria-hidden />
              {s.disciplina}
            </Badge>
          )}
          <p className="mt-5 font-display text-[56px] leading-none font-extrabold tracking-[-0.02em] tabular-nums md:text-[72px]" data-pontuacao={s.pontuacao}>
            {s.pontuacao.toLocaleString("pt-BR")}
            <span className="ml-2 text-[24px] text-ink3">XP</span>
          </p>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {numeros.map((n) => (
              <div key={n.rotulo} className="rounded-2xl bg-sf2 p-3">
                <dt className="text-[13px] text-ink3">{n.rotulo}</dt>
                <dd className="font-display text-[24px] font-extrabold tabular-nums md:text-[28px]">{n.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[13px] text-ink3">Tempo: {numeros[2].nota}</p>
        </section>

        {antes && depois && s.cor && (
          <section aria-labelledby="dominio-titulo" className={CARD}>
            <h2 id="dominio-titulo" className={ROTULO}>
              Domínio do tópico
            </h2>
            <p className="mt-2 font-display text-[24px] font-extrabold tabular-nums" data-dominio-antes={Math.round(calcularDominio(antes))} data-dominio-depois={Math.round(calcularDominio(depois))}>
              {antes.length ? `${Math.round(calcularDominio(antes))}%` : "novo"} <span className="text-ink3">→</span>{" "}
              {Math.round(calcularDominio(depois))}%
            </p>
            <BarraAntesDepois antes={calcularDominio(antes)} depois={calcularDominio(depois)} cor={s.cor} />
          </section>
        )}

        <nav aria-label="Próximos passos" className="flex flex-col gap-2">
          <Button asChild variant="destaque">
            <Link href="/roleta">
              <RotateCw aria-hidden />
              Girar de novo
            </Link>
          </Button>
          {erros > 0 && (
            <Button asChild variant="secondary">
              <Link href={s.topicoId ? `/erros?topico=${s.topicoId}` : "/erros"}>Revisar {erros === 1 ? "1 erro" : `${erros} erros`}</Link>
            </Button>
          )}
          <Button asChild variant="ghost">
            <Link href="/">
              <Home aria-hidden />
              Voltar ao início
            </Link>
          </Button>
        </nav>
      </div>

      <section aria-labelledby="respostas-titulo" className={CARD}>
        <h2 id="respostas-titulo" className={ROTULO}>
          Resposta por questão
        </h2>
        {linhas.length ? (
          <ol className="mt-3 flex flex-col divide-y divide-line">
            {linhas.map((l, i) => (
              <li key={l.questaoId} className="flex items-start gap-3 py-3" data-acertou={l.acertou}>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    l.acertou ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn",
                  )}
                >
                  {l.acertou ? <Check className="size-5" aria-hidden /> : <X className="size-5" aria-hidden />}
                  <span className="sr-only">{l.acertou ? "Acertou" : "Errou"}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-snug">
                    <span className="text-ink3 tabular-nums">{i + 1}. </span>
                    {l.enunciado}
                  </p>
                  {l.fracao != null && (
                    <>
                      <p className="mt-1 text-[14px] text-ink2" data-fracao={l.fracao}>
                        Procedimento · <span className="font-bold tabular-nums">{Math.round(l.fracao * 100)}% lembrado</span>
                      </p>
                      {esquecidos(l).length > 0 && (
                        <ul className="mt-1 text-[14px] text-ink2">
                          {esquecidos(l).map((t, k) => (
                            <li key={k} className="line-clamp-1">
                              <span className="font-bold text-warn">Esqueceu:</span> {t}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
                <span className={cn("shrink-0 font-bold tabular-nums", l.acertou ? "text-ink" : "text-ink3")}>+{l.pontos} XP</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-ink2">Nenhuma questão respondida nesta rodada.</p>
        )}
      </section>
    </div>
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<div className="m-8 h-96 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
