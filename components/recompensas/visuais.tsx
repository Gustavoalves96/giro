import { Brain, Crown, Dna, Heart, HeartPulse, Microscope, Pill, RotateCw, Sparkles, Stethoscope, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { TEXTO_SOBRE_TINTA } from "@/lib/cores";
import type { EstiloRoleta, Moldura as IdMoldura } from "@/lib/domain/visuais";
import { cn } from "@/lib/utils";

// Fundo escuro fixo (nos dois temas) para o dourado brilhar: gold sobre ele passa de 9:1.
const NOITE: CSSProperties = { backgroundColor: TEXTO_SOBRE_TINTA, color: "var(--gold)", boxShadow: "0 0 18px var(--gold)" };

const PONTEIRO = {
  triangulo: "M3 2 H25 L14 26 Z",
  gota: "M14 26 C7 17 4 13 4 10 A10 10 0 0 1 24 10 C24 13 21 17 14 26 Z",
  losango: "M14 1 L24 12 L14 27 L4 12 Z",
};

/** Desenho de cada estilo da roleta: ponteiro (forma e cor) e botão central (cores e ícone). */
export const VISUAL_ROLETA: Record<
  EstiloRoleta,
  { Icone: LucideIcon; centro: string; centroStyle?: CSSProperties; ponteiro: keyof typeof PONTEIRO; corPonteiro: string }
> = {
  classico: { Icone: RotateCw, centro: "border-sf bg-ac text-on-ac", ponteiro: "triangulo", corPonteiro: "var(--gold)" },
  estetoscopio: { Icone: Stethoscope, centro: "border-sf bg-ink text-bg", ponteiro: "gota", corPonteiro: "var(--ink)" },
  plantao: { Icone: HeartPulse, centro: "border-gold bg-ac text-on-ac", ponteiro: "triangulo", corPonteiro: "var(--ac)" },
  "dupla-helice": { Icone: Dna, centro: "border-sf bg-ink text-bg", ponteiro: "losango", corPonteiro: "var(--gold)" },
  ouro: { Icone: Crown, centro: "border-ink bg-gold", centroStyle: { color: TEXTO_SOBRE_TINTA }, ponteiro: "triangulo", corPonteiro: "var(--ink)" },
  aura: { Icone: Sparkles, centro: "border-gold", centroStyle: NOITE, ponteiro: "losango", corPonteiro: "var(--gold)" },
};

export function PonteiroRoleta({ estilo, className }: { estilo: EstiloRoleta; className?: string }) {
  const v = VISUAL_ROLETA[estilo];
  return (
    <svg viewBox="0 0 28 28" className={cn("size-full drop-shadow", className)} aria-hidden>
      <path d={PONTEIRO[v.ponteiro]} fill={v.corPonteiro} stroke="var(--sf)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** Amostra para a página Recompensas: ponteiro sobre o botão central. */
export function AmostraRoleta({ estilo }: { estilo: EstiloRoleta }) {
  const v = VISUAL_ROLETA[estilo];
  return (
    <span className="relative flex size-16 shrink-0 items-end justify-center" aria-hidden>
      <span className="absolute top-0 left-1/2 -ml-2.5 size-5">
        <PonteiroRoleta estilo={estilo} />
      </span>
      <span className={cn("flex size-12 items-center justify-center rounded-full border-4 shadow-md", v.centro)} style={v.centroStyle}>
        <v.Icone className="size-6" />
      </span>
    </span>
  );
}

const VISUAL_MOLDURA: Record<Exclude<IdMoldura, "nenhuma">, { Icone: LucideIcon; classe: string; style?: CSSProperties }> = {
  estetoscopio: { Icone: Stethoscope, classe: "border-line bg-sf2 text-ink" },
  coracao: { Icone: Heart, classe: "border-ac bg-ac/12 text-acink" },
  microscopio: { Icone: Microscope, classe: "border-line bg-sf2 text-ink" },
  cerebro: { Icone: Brain, classe: "border-line bg-sf2 text-ink" },
  pilula: { Icone: Pill, classe: "border-line bg-sf2 text-ink" },
  coroa: { Icone: Crown, classe: "border-gold bg-gold/20 text-ink" },
  aura: { Icone: Sparkles, classe: "border-gold", style: NOITE },
};

/** Moldura do perfil (ao lado da saudação). "nenhuma" mostra um círculo tracejado só na amostra. */
export function Moldura({ id, className }: { id: IdMoldura; className?: string }) {
  if (id === "nenhuma") {
    return <span className={cn("block size-12 shrink-0 rounded-full border-2 border-dashed border-line", className)} aria-hidden />;
  }
  const v = VISUAL_MOLDURA[id];
  return (
    <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full border-[3px]", v.classe, className)} style={v.style} aria-hidden>
      <v.Icone className="size-[55%]" />
    </span>
  );
}
