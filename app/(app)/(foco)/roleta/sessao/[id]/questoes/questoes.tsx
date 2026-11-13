"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { finalizar } from "@/app/(app)/roleta/actions";
import { BarraProgresso } from "@/components/quiz/BarraProgresso";
import { Procedimento } from "@/components/quiz/Procedimento";
import { Questao, type QuestaoExibida } from "@/components/quiz/Questao";
import { Button } from "@/components/ui/button";
import { resumoSessao, type RespostaPontuada } from "@/lib/domain/pontuacao";

type Props = { sessaoId: string; feitas: RespostaPontuada[]; questoes: QuestaoExibida[] };

export function QuestoesSessao({ sessaoId, feitas, questoes }: Props) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState(feitas);
  const [finalizando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const resumo = resumoSessao(respostas);
  const total = feitas.length + questoes.length;
  const atual = questoes[i];
  const Item = atual?.tipo === "procedimento" ? Procedimento : Questao;

  // A pontuação que vale é a que o servidor calcula das respostas gravadas; a do topo é só o placar.
  function verResultado() {
    if (finalizando) return;
    setErro(null);
    iniciar(async () => {
      try {
        await finalizar(sessaoId);
        router.push(`/roleta/sessao/${sessaoId}/resultado`);
      } catch {
        setErro("Não foi possível fechar a rodada. Confira a conexão e tente de novo.");
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-6 px-4 py-5 md:px-8 md:py-8">
      {total > 0 && (
        <BarraProgresso
          atual={Math.min(feitas.length + i, total - 1)}
          total={total}
          resultados={respostas.map((r) => r.acertou)}
          sequencia={resumo.sequencia}
          pontos={resumo.total}
        />
      )}
      {atual && !finalizando ? (
        <Item
          key={atual.id}
          questao={atual}
          feedback="imediato"
          sessaoId={sessaoId}
          sequenciaAntes={resumo.sequencia}
          onRespondida={(r) => setRespostas((rs) => [...rs, r])}
          onProxima={() => (i === questoes.length - 1 ? verResultado() : setI((n) => n + 1))}
          ultima={i === questoes.length - 1}
        />
      ) : (
        <section className="max-w-xl rounded-3xl border border-line bg-sf p-6">
          <h1 className="font-display text-[28px] font-extrabold">
            {finalizando ? "Fechando a rodada…" : total ? "Questões respondidas" : "Sem questões ativas"}
          </h1>
          {!total && <p className="mt-2 text-ink2">Este tópico ficou sem questões ativas. A rodada fecha só com o estudo.</p>}
          <Button className="mt-4" onClick={verResultado} disabled={finalizando}>
            Ver resultado
            <ArrowRight aria-hidden />
          </Button>
        </section>
      )}
      {erro && (
        <p role="alert" className="text-warn">
          {erro}{" "}
          <button type="button" className="font-bold underline" onClick={verResultado}>
            Tentar de novo
          </button>
        </p>
      )}
    </div>
  );
}
