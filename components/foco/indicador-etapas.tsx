"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { cn } from "@/lib/utils";

export const ETAPAS = [
  { id: "estudo", rotulo: "Estudo" },
  { id: "questoes", rotulo: "Questões" },
  { id: "resultado", rotulo: "Resultado" },
] as const;
export type Etapa = (typeof ETAPAS)[number]["id"];

/** Estudo · Questões · Resultado, com a etapa atual em destaque. */
export function IndicadorEtapas({ atual }: { atual: Etapa | null }) {
  const iAtual = ETAPAS.findIndex((e) => e.id === atual);
  return (
    <ol aria-label="Etapas da sessão" className="flex items-center gap-2 text-[13px] font-bold tracking-[0.06em] uppercase">
      {ETAPAS.map((e, i) => (
        <li key={e.id} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-ink3">·</span>}
          <span
            aria-current={i === iAtual ? "step" : undefined}
            className={cn(i === iAtual ? "text-acink" : i < iAtual ? "text-ink2" : "text-ink3")}
          >
            {e.rotulo}
          </span>
        </li>
      ))}
    </ol>
  );
}

// Convenção: a rota de foco termina em /estudo, /questoes ou /resultado.
export function IndicadorEtapasAtual() {
  const atual = useSelectedLayoutSegments().findLast((s): s is Etapa => ETAPAS.some((e) => e.id === s));
  return <IndicadorEtapas atual={atual ?? null} />;
}
