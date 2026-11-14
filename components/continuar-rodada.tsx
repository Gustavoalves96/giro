import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { rota } from "@/app/(app)/(foco)/roleta/sessao/[id]/carregar";
import { Button } from "@/components/ui/button";
import { etapaParaContinuar } from "@/lib/domain/inicio";

export type RodadaAberta = { id: string; topico: string | null; respostas: number };

/** Rodada da roleta aberta hoje: tópico, etapa em que parou e o link de volta (Início e Roleta). */
export function ContinuarRodada({ rodada, destaque = false }: { rodada: RodadaAberta; destaque?: boolean }) {
  const etapa = etapaParaContinuar(rodada.respostas);
  return (
    <div data-continuar={rodada.id} data-etapa={etapa}>
      <p className="text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase">Rodada em andamento</p>
      <p className="mt-1 font-display text-[22px] leading-tight font-extrabold wrap-break-word">{rodada.topico ?? "Tópico excluído"}</p>
      <p className="mt-1 text-ink2">
        {etapa === "estudo"
          ? "Parou no estudo; o tempo já estudado continua contando."
          : `Parou nas questões · ${rodada.respostas} ${rodada.respostas === 1 ? "respondida" : "respondidas"}.`}
      </p>
      <Button asChild variant={destaque ? "destaque" : "default"} className="mt-4 w-full sm:w-auto">
        <Link href={rota(rodada.id, etapa)}>
          Continuar rodada
          <ArrowRight aria-hidden />
        </Link>
      </Button>
    </div>
  );
}
