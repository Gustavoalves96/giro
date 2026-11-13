// Página temporária para conferir o componente de questão. Apagar na sessão 19.
import type { Metadata } from "next";
import { Suspense } from "react";
import type { QuestaoExibida } from "@/components/quiz/Questao";
import { listarQuestoesExibicao } from "@/lib/db/quiz";
import { opcoesDaQuestao } from "@/lib/domain/selecao-questoes";
import { DemoQuestoes } from "./demo";

export const metadata: Metadata = { title: "Questão (dev) · Giro" };

type Linha = Awaited<ReturnType<typeof listarQuestoesExibicao>>[number];

// Uma de cada tipo + duas quaisquer, em ordem aleatória (embaralhamento enviesado: basta para teste).
function escolher(linhas: Linha[]) {
  const todas = [...linhas].sort(() => Math.random() - 0.5);
  const uma = (["caso_clinico", "multipla_escolha", "verdadeiro_falso"] as const).flatMap((t) => todas.find((q) => q.tipo === t) ?? []);
  return [...uma, ...todas.filter((q) => !uma.includes(q)).slice(0, 5 - uma.length)].sort(() => Math.random() - 0.5);
}

// Responde sem sessão (sessao_id null).
async function Conteudo({ final }: { final: boolean }) {
  const questoes: QuestaoExibida[] = escolher(await listarQuestoesExibicao()).map((q) => ({
    id: q.id,
    tipo: q.tipo,
    enunciado: q.enunciado,
    disciplina: q.disciplina,
    cor: q.cor,
    sinalizadaComErro: q.sinalizadaComErro,
    opcoes: opcoesDaQuestao(q.alternativas),
  }));
  if (!questoes.length) return <p className="p-8 text-ink2">Nenhuma questão ativa no banco.</p>;
  return <DemoQuestoes questoes={questoes} feedback={final ? "final" : "imediato"} />;
}

export default function Page({ searchParams }: PageProps<"/dev/questao">) {
  return (
    <Suspense fallback={<div className="m-8 h-96 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
      {searchParams.then((sp) => (
        <Conteudo final={sp.final === "1"} />
      ))}
    </Suspense>
  );
}
