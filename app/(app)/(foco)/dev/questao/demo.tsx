"use client";

import { useState } from "react";
import { BarraProgresso } from "@/components/quiz/BarraProgresso";
import { Questao, type QuestaoExibida } from "@/components/quiz/Questao";
import { Button } from "@/components/ui/button";
import { resumoSessao, type RespostaPontuada } from "@/lib/domain/pontuacao";

// Só para conferir o componente; o fluxo de verdade (sessão no banco, resultado) é da sessão 09.
export function DemoQuestoes({ questoes, feedback }: { questoes: QuestaoExibida[]; feedback: "imediato" | "final" }) {
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<RespostaPontuada[]>([]);
  const resumo = resumoSessao(respostas);
  const imediato = feedback === "imediato";
  const atual = questoes[i];

  return (
    <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-6 px-4 py-5 md:px-8 md:py-8">
      <BarraProgresso
        atual={Math.min(i, questoes.length - 1)}
        total={questoes.length}
        resultados={respostas.map((r) => (imediato ? r.acertou : null))}
        sequencia={imediato ? resumo.sequencia : undefined}
        pontos={imediato ? resumo.total : undefined}
      />
      {atual ? (
        <Questao
          key={atual.id}
          questao={atual}
          feedback={feedback}
          sessaoId={null}
          sequenciaAntes={resumo.sequencia}
          onRespondida={(r) => setRespostas((rs) => [...rs, r])}
          onProxima={() => setI((n) => n + 1)}
          ultima={i === questoes.length - 1}
        />
      ) : (
        <section className="rounded-3xl border border-line bg-sf p-6">
          <h1 className="font-display text-[28px] font-extrabold">Fim da rodada de teste</h1>
          <p className="mt-2 text-ink2" data-resumo>
            {resumo.total} XP · {resumo.acertos} de {questoes.length} acertos · maior sequência x{resumo.maiorSequencia}
          </p>
          <Button asChild className="mt-4">
            <a href={imediato ? "/dev/questao" : "/dev/questao?final=1"}>Outra rodada</a>
          </Button>
        </section>
      )}
    </div>
  );
}
