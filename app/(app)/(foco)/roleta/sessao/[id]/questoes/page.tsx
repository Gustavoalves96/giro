import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { QuestaoExibida } from "@/components/quiz/Questao";
import { iaDisponivel } from "@/lib/ai/provider";
import { listarCandidatasSessao, respostasDaSessao } from "@/lib/db/sessoes";
import {
  MAX_PROCEDIMENTOS_POR_RODADA,
  opcoesDaQuestao,
  PROCEDIMENTOS_POR_RODADA_SO,
  selecionarRodada,
} from "@/lib/domain/selecao-questoes";
import { carregarSessao, rota } from "../carregar";
import { QuestoesSessao } from "./questoes";
import { dono } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Questões · Giro" };

const POR_SESSAO = 5;

type Props = PageProps<"/roleta/sessao/[id]/questoes">;

// Recarregar no meio continua de onde parou: as já respondidas nesta sessão vêm do banco e saem das candidatas.
async function Conteudo({ params }: Props) {
  const conta = await dono();
  const { id } = await params;
  const s = await carregarSessao(id, "roleta");
  if (s.finalizadaEm) redirect(rota(id, "resultado"));
  const [feitas, candidatas] = await Promise.all([
    respostasDaSessao(conta, s.id),
    s.topicoId ? listarCandidatasSessao(conta, s.topicoId, s.id) : [],
  ]);
  const procsFeitos = feitas.filter((f) => f.tipo === "procedimento").length;
  // "Praticar: Procedimentos": só procedimentos, até PROCEDIMENTOS_POR_RODADA_SO
  const so = s.soProcedimentos;
  const total = so ? PROCEDIMENTOS_POR_RODADA_SO : POR_SESSAO;
  // procedimento vai só com o nome (opcoes vazias); o checklist sai na hora de conferir
  const questoes: QuestaoExibida[] = selecionarRodada(
    so ? candidatas.filter((c) => c.tipo === "procedimento") : candidatas,
    Math.max(0, total - feitas.length),
    new Date(),
    so ? total : MAX_PROCEDIMENTOS_POR_RODADA - procsFeitos,
  ).map((q) => ({
    id: q.id,
    tipo: q.tipo,
    enunciado: q.enunciado,
    disciplina: q.disciplina,
    cor: q.cor,
    sinalizadaComErro: q.sinalizadaComErro,
    opcoes: q.tipo === "procedimento" ? [] : opcoesDaQuestao(q.alternativas),
  }));
  return (
    <QuestoesSessao
      sessaoId={s.id}
      feitas={feitas.map(({ acertou, tempoMs, fracao }) => ({ acertou, tempoMs, fracao }))}
      questoes={questoes}
      resultado={rota(s.id, "resultado")}
      vazio={
        so
          ? "Este tópico ficou sem procedimentos ativos. A rodada fecha só com o estudo."
          : "Este tópico ficou sem questões ativas. A rodada fecha só com o estudo."
      }
      ia={iaDisponivel()}
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
