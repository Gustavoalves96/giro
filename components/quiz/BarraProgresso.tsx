"use client";

import { Flame } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { useMovimentoReduzido } from "@/components/movimento-reduzido";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  atual: number; // índice da questão na tela (0..total-1)
  total: number;
  /** Um por questão respondida: acertou, ou null quando o resultado fica escondido (simulado). */
  resultados: (boolean | null)[];
  sequencia?: number;
  pontos?: number;
};

/** "Questão 3 de 5", segmentos coloridos pelo resultado, sequência e pontos. */
export function BarraProgresso({ atual, total, resultados, sequencia, pontos }: Props) {
  const acertos = resultados.filter((r) => r === true).length;
  const erros = resultados.filter((r) => r === false).length;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="min-w-[180px] flex-1">
        <p className="text-[13px] font-bold tracking-[0.06em] text-ink2 uppercase">
          Questão <span className="tabular-nums">{atual + 1}</span> de <span className="tabular-nums">{total}</span>
          <span className="sr-only">
            {" "}
            · {acertos} {acertos === 1 ? "acerto" : "acertos"}, {erros} {erros === 1 ? "erro" : "erros"}
          </span>
        </p>
        <ol className="mt-2 flex max-w-md gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <li
              key={i}
              data-resultado={i < resultados.length ? String(resultados[i]) : i === atual ? "atual" : "futura"}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-200",
                i < resultados.length
                  ? resultados[i] === true
                    ? "bg-ok"
                    : resultados[i] === false
                      ? "bg-warn"
                      : "bg-ink2"
                  : i === atual
                    ? "bg-ink"
                    : "bg-sf2 ring-1 ring-line ring-inset",
              )}
            />
          ))}
        </ol>
      </div>
      {sequencia !== undefined && (
        <Badge variant="chip" className={cn("border-gold/50 bg-gold/15", !sequencia && "opacity-60")}>
          <Flame className="text-gold" aria-hidden />
          <span className="tabular-nums" aria-hidden>
            x{sequencia}
          </span>
          <span className="sr-only">Sequência de {sequencia} acertos</span>
        </Badge>
      )}
      {pontos !== undefined && (
        <Badge variant="chip" data-pontos={pontos}>
          <Contador valor={pontos} />
          <span aria-hidden>XP</span>
          <span className="sr-only">{pontos} XP</span>
        </Badge>
      )}
    </div>
  );
}

// Conta até o valor novo 250 ms depois do acerto; com movimento reduzido, troca direto.
function Contador({ valor }: { valor: number }) {
  const reduzir = useMovimentoReduzido();
  const mv = useMotionValue(valor);
  const texto = useTransform(mv, (v) => Math.round(v).toLocaleString("pt-BR"));
  useEffect(() => {
    if (reduzir) {
      mv.set(valor);
      return;
    }
    const a = animate(mv, valor, { duration: 0.6, delay: 0.25, ease: "easeOut" });
    return () => a.stop();
  }, [valor, reduzir, mv]);
  return (
    <motion.span className="tabular-nums" aria-hidden>
      {texto}
    </motion.span>
  );
}
