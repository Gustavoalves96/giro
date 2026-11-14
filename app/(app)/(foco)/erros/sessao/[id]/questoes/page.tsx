import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { carregarSessao } from "@/app/(app)/(foco)/roleta/sessao/[id]/carregar";
import { QuestoesSessao } from "@/app/(app)/(foco)/roleta/sessao/[id]/questoes/questoes";
import { filtrarErros, listarErros } from "@/lib/db/erros";
import { respostasDaSessao } from "@/lib/db/sessoes";
import { opcoesDaQuestao } from "@/lib/domain/selecao-questoes";
import { FiltroErrosSchema } from "@/lib/erros/schema";

export const metadata: Metadata = { title: "Caderno de erros · Giro" };

type Props = PageProps<"/erros/sessao/[id]/questoes">;

// Erros do filtro da URL ainda não respondidos nesta sessão, com feedback imediato. Recarregar continua:
// o que já foi respondido aqui sai da lista (acertou → nem é mais erro; errou → já foi refeito).
async function Conteudo({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const s = await carregarSessao(id, "erros");
  const resultado = `/erros/sessao/${s.id}/resultado`;
  if (s.finalizadaEm) redirect(resultado);
  const [feitas, erros] = await Promise.all([respostasDaSessao(s.id), listarErros()]);
  const respondidas = new Set(feitas.map((f) => f.questaoId));
  const pendentes = filtrarErros(erros, FiltroErrosSchema.parse(sp)).filter((e) => !respondidas.has(e.questaoId));
  return (
    <QuestoesSessao
      sessaoId={s.id}
      feitas={feitas.map(({ acertou, tempoMs, fracao }) => ({ acertou, tempoMs, fracao }))}
      // sem gabarito: só o que a questão exibe; procedimento vai só com o nome
      questoes={pendentes.map((e) => ({
        id: e.questaoId,
        tipo: e.tipo,
        enunciado: e.enunciado,
        disciplina: e.disciplina,
        cor: e.cor,
        sinalizadaComErro: e.sinalizadaComErro,
        opcoes: e.tipo === "procedimento" ? [] : opcoesDaQuestao(e.alternativas),
      }))}
      resultado={resultado}
      vazio="Nenhum erro para refazer neste filtro."
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
