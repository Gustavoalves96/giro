import { Check, Circle, Home, RotateCcw, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RecompensasDaSessao } from "@/components/recompensas/da-sessao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import type { Alternativa } from "@/lib/db/schema";
import { questoesDoSimulado, respostasDoSimulado } from "@/lib/db/simulado";
import { corrigirSimulado, relogio, type Situacao } from "@/lib/domain/simulado";
import { cn } from "@/lib/utils";
import { carregarSimulado } from "../carregar";
import { dono } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Resultado do simulado · Giro" };

type Props = PageProps<"/simulado/sessao/[id]/resultado">;

const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const CARD = "rounded-3xl border border-line bg-sf p-5 md:p-6";
const SITUACAO: Record<Situacao, { rotulo: string; Icone: typeof Check; cor: string }> = {
  acertou: { rotulo: "Acertou", Icone: Check, cor: "bg-ok/15 text-ok" },
  errou: { rotulo: "Errou", Icone: X, cor: "bg-warn/15 text-warn" },
  branco: { rotulo: "Em branco", Icone: Circle, cor: "bg-sf2 text-ink2" },
};

// Texto da alternativa sem a letra: na prova ela viu as alternativas embaralhadas.
function textoDe(letra: string | null, alternativas: Alternativa[] | null) {
  if (letra === null) return "—";
  if (!alternativas?.length) return letra === "V" ? "Verdadeiro" : "Falso";
  return alternativas.find((a) => a.letra === letra)?.texto ?? letra;
}

// Tudo vem do banco: as questões sorteadas (com as em branco) e as respostas gravadas na entrega.
async function Conteudo({ params }: Props) {
  const conta = await dono();
  const { id } = await params;
  const s = await carregarSimulado(id);
  if (!s.finalizadaEm) redirect(`/simulado/sessao/${s.id}/questoes`);
  const [qs, dadas] = await Promise.all([questoesDoSimulado(conta, s.questaoIds ?? []), respostasDoSimulado(conta, s.id)]);
  const lote = corrigirSimulado(qs, dadas);
  const segundos = Math.round((s.finalizadaEm.getTime() - s.iniciadaEm.getTime()) / 1000);
  const numeros = [
    { rotulo: "Acertos", valor: `${s.acertos}/${s.totalQuestoes}` },
    { rotulo: "Tempo", valor: relogio(Math.min(segundos, s.limiteSegundos ?? segundos)) },
    { rotulo: "XP", valor: s.pontuacao.toLocaleString("pt-BR") },
  ];

  return (
    <div className="mx-auto grid w-full max-w-[1100px] grid-cols-1 gap-6 px-4 py-6 md:px-8 md:py-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-6 lg:sticky lg:top-6">
        <section aria-labelledby="resultado-titulo" className={CARD}>
          <p className={ROTULO}>Simulado entregue</p>
          <h1 id="resultado-titulo" className="mt-1 font-display text-[28px] leading-tight font-extrabold md:text-[32px]">
            Nota <span className="tabular-nums">{lote.nota.toLocaleString("pt-BR")}</span>
          </h1>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {numeros.map((n) => (
              <div key={n.rotulo} className="rounded-2xl bg-sf2 p-3">
                <dt className="text-[13px] text-ink3">{n.rotulo}</dt>
                <dd className="font-display text-[22px] font-extrabold tabular-nums md:text-[26px]">{n.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-ink2">
            {lote.emBranco
              ? `${lote.emBranco === 1 ? "1 questão ficou" : `${lote.emBranco} questões ficaram`} em branco e ${lote.emBranco === 1 ? "contou" : "contaram"} como erro. `
              : ""}
            Os erros voltam mais cedo na revisão.
          </p>
        </section>
        <RecompensasDaSessao conta={conta} id={s.id} pontuacao={s.pontuacao} finalizadaEm={s.finalizadaEm} />
        <nav aria-label="Próximos passos" className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/simulado">
              <RotateCcw aria-hidden />
              Fazer outro simulado
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <Home aria-hidden />
              Voltar ao início
            </Link>
          </Button>
        </nav>
      </div>

      <section aria-labelledby="gabarito-titulo" className={CARD}>
        <h2 id="gabarito-titulo" className={ROTULO}>
          Gabarito comentado
        </h2>
        <ol className="mt-3 flex flex-col divide-y divide-line">
          {qs.map((q, i) => {
            const p = lote.porQuestao[i];
            const { rotulo, Icone, cor } = SITUACAO[p.situacao];
            return (
              <li key={q.id} className="flex flex-col gap-3 py-5 first:pt-2" data-situacao={p.situacao}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", cor)}>
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <span className="font-bold">
                    <span className="tabular-nums">{i + 1}.</span> {rotulo}
                  </span>
                  <Badge
                    variant="chip"
                    style={{ backgroundColor: tintaClara(q.cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}
                  >
                    {q.topico}
                  </Badge>
                </div>
                <p className="leading-[1.6] whitespace-pre-line">{q.enunciado}</p>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-bg p-3">
                    <dt className="text-[13px] text-ink3">Sua resposta</dt>
                    <dd className="mt-0.5">{textoDe(p.resposta, q.alternativas)}</dd>
                  </div>
                  <div className="rounded-2xl border border-line bg-bg p-3">
                    <dt className="text-[13px] text-ink3">Correta</dt>
                    <dd className="mt-0.5 font-bold">{textoDe(q.gabarito, q.alternativas)}</dd>
                  </div>
                </dl>
                <p className="leading-[1.6] text-ink2">{q.explicacao}</p>
                <p className="text-[13px] text-ink3">
                  Fonte: <span className="text-ink2">{q.fonte ?? "não informada"}</span>
                </p>
              </li>
            );
          })}
        </ol>
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
