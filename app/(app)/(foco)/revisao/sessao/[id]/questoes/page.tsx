import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { carregarSessao } from "@/app/(app)/(foco)/roleta/sessao/[id]/carregar";
import { QuestoesSessao } from "@/app/(app)/(foco)/roleta/sessao/[id]/questoes/questoes";
import { listarPendentesRevisao } from "@/lib/db/revisao";
import { respostasDaSessao } from "@/lib/db/sessoes";
import { opcoesDaQuestao } from "@/lib/domain/selecao-questoes";

export const metadata: Metadata = { title: "Revisão · Giro" };

type Props = PageProps<"/revisao/sessao/[id]/questoes">;

// Todos os itens vencidos, com feedback imediato. Recarregar continua: os respondidos nesta sessão saem da lista.
async function Conteudo({ params }: Props) {
  const { id } = await params;
  const s = await carregarSessao(id, "revisao");
  const resultado = `/revisao/sessao/${s.id}/resultado`;
  if (s.finalizadaEm) redirect(resultado);
  const [feitas, pendentes] = await Promise.all([respostasDaSessao(s.id), listarPendentesRevisao(s.id, new Date())]);
  return (
    <QuestoesSessao
      sessaoId={s.id}
      feitas={feitas.map(({ acertou, tempoMs, fracao }) => ({ acertou, tempoMs, fracao }))}
      // procedimento vai só com o nome (opcoes vazias); o checklist sai na hora de conferir
      questoes={pendentes.map(({ alternativas, ...q }) => ({ ...q, opcoes: q.tipo === "procedimento" ? [] : opcoesDaQuestao(alternativas) }))}
      resultado={resultado}
      vazio="Nada venceu para revisar agora."
    />
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={<div className="m-8 h-96 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
