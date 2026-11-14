import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { questoesDoSimulado } from "@/lib/db/simulado";
import { carregarSimulado } from "../carregar";
import { opcoesDaQuestao } from "@/lib/domain/selecao-questoes";
import { rngDeSemente, segundosRestantes } from "@/lib/domain/simulado";
import { ProvaSimulado } from "./prova";

export const metadata: Metadata = { title: "Simulado · Giro" };

type Props = PageProps<"/simulado/sessao/[id]/questoes">;

// Sem gabarito no cliente: só enunciado e opções. A ordem das alternativas sai de uma semente (sessão + questão),
// então recarregar mostra a prova igual.
async function Conteudo({ params }: Props) {
  await connection();
  const { id } = await params;
  const s = await carregarSimulado(id);
  const resultado = `/simulado/sessao/${s.id}/resultado`;
  if (s.finalizadaEm) redirect(resultado);
  const qs = await questoesDoSimulado(s.questaoIds ?? []);
  const restante = segundosRestantes(s.iniciadaEm, s.limiteSegundos ?? 0, new Date());
  return (
    <ProvaSimulado
      sessaoId={s.id}
      restanteMs={restante * 1000}
      resultado={resultado}
      questoes={qs.map((q) => ({
        id: q.id,
        tipo: q.tipo,
        enunciado: q.enunciado,
        disciplina: q.disciplina,
        cor: q.cor,
        sinalizadaComErro: q.sinalizadaComErro,
        opcoes: opcoesDaQuestao(q.alternativas, rngDeSemente(`${s.id}:${q.id}`)),
      }))}
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
