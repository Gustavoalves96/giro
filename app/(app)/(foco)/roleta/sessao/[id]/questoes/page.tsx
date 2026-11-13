import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { QuestaoExibida } from "@/components/quiz/Questao";
import { listarCandidatasSessao, respostasDaSessao } from "@/lib/db/sessoes";
import { opcoesDaQuestao, selecionarQuestoes } from "@/lib/domain/selecao-questoes";
import { carregarSessao, rota } from "../carregar";
import { QuestoesSessao } from "./questoes";

export const metadata: Metadata = { title: "Questões · Giro" };

const POR_SESSAO = 5;

type Props = PageProps<"/roleta/sessao/[id]/questoes">;

// Recarregar no meio continua de onde parou: as já respondidas nesta sessão vêm do banco e saem das candidatas.
async function Conteudo({ params }: Props) {
  const { id } = await params;
  const s = await carregarSessao(id);
  if (s.finalizadaEm) redirect(rota(id, "resultado"));
  const [feitas, candidatas] = await Promise.all([
    respostasDaSessao(s.id),
    s.topicoId ? listarCandidatasSessao(s.topicoId, s.id) : [],
  ]);
  const questoes: QuestaoExibida[] = selecionarQuestoes(candidatas, Math.max(0, POR_SESSAO - feitas.length), new Date()).map(
    (q) => ({
      id: q.id,
      tipo: q.tipo,
      enunciado: q.enunciado,
      disciplina: q.disciplina,
      cor: q.cor,
      sinalizadaComErro: q.sinalizadaComErro,
      opcoes: opcoesDaQuestao(q.alternativas),
    }),
  );
  return (
    <QuestoesSessao
      sessaoId={s.id}
      feitas={feitas.map(({ acertou, tempoMs }) => ({ acertou, tempoMs }))}
      questoes={questoes}
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
