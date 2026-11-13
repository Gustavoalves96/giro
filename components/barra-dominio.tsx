import { cn } from "@/lib/utils";

/** Barra de domínio 0–100 na cor cheia da disciplina (o número fica no texto ao lado). */
export function BarraDominio({ valor, cor, className }: { valor: number; cor: string; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-sf2", className)} aria-hidden>
      <div className="h-full rounded-full" style={{ width: `${valor}%`, backgroundColor: cor }} />
    </div>
  );
}
