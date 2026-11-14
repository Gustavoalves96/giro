import { Check, RotateCcw, RotateCw, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { carregarSessao } from "@/app/(app)/(foco)/roleta/sessao/[id]/carregar";
import { Button } from "@/components/ui/button";
import { respostasDaSessao } from "@/lib/db/sessoes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Resultado da revisão · Giro" };

const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const CARD = "rounded-3xl border border-line bg-sf p-5 md:p-6";

type Props = PageProps<"/revisao/sessao/[id]/resultado">;

// Resultado simples: sem recorde (só da roleta) e sem domínio de um tópico só (a revisão mistura tópicos).
async function Conteudo({ params }: Props) {
  const { id } = await params;
  const s = await carregarSessao(id, "revisao");
  if (!s.finalizadaEm) redirect(`/revisao/sessao/${s.id}/questoes`);
  const rs = await respostasDaSessao(s.id);
  const numeros = [
    { rotulo: "Acertos", valor: `${s.acertos}/${s.totalQuestoes}` },
    { rotulo: "Maior sequência", valor: `x${s.maiorSequencia}` },
    { rotulo: "XP", valor: s.pontuacao.toLocaleString("pt-BR") },
  ];

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-6 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-6">
        <section aria-labelledby="resultado-titulo" className={CARD}>
          <p className={ROTULO}>Revisão concluída</p>
          <h1 id="resultado-titulo" className="mt-1 font-display text-[28px] leading-tight font-extrabold md:text-[32px]">
            {s.totalQuestoes === 1 ? "1 item revisado" : `${s.totalQuestoes} itens revisados`}
          </h1>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {numeros.map((n) => (
              <div key={n.rotulo} className="rounded-2xl bg-sf2 p-3">
                <dt className="text-[13px] text-ink3">{n.rotulo}</dt>
                <dd className="font-display text-[24px] font-extrabold tabular-nums md:text-[28px]">{n.valor}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-ink2">Os erros voltam mais cedo; os acertos, mais tarde.</p>
        </section>
        <nav aria-label="Próximos passos" className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/revisao">
              <RotateCcw aria-hidden />
              Voltar à revisão
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/roleta">
              <RotateCw aria-hidden />
              Girar a roleta
            </Link>
          </Button>
        </nav>
      </div>

      <section aria-labelledby="respostas-titulo" className={CARD}>
        <h2 id="respostas-titulo" className={ROTULO}>
          Resposta por item
        </h2>
        {rs.length ? (
          <ol className="mt-3 flex flex-col divide-y divide-line">
            {rs.map((l, i) => (
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
                <p className="min-w-0 flex-1 leading-snug">
                  <span className="line-clamp-2">
                    <span className="text-ink3 tabular-nums">{i + 1}. </span>
                    {l.enunciado}
                  </span>
                  {l.fracao != null && (
                    <span className="mt-1 block text-[14px] text-ink2">Procedimento · {Math.round(l.fracao * 100)}% lembrado</span>
                  )}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-ink2">Nenhum item respondido nesta revisão.</p>
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
