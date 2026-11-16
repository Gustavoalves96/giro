import {
  CalendarCheck,
  ClipboardCheck,
  Crown,
  Disc3,
  Flame,
  GraduationCap,
  ListChecks,
  Lock,
  NotebookPen,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { medalhaPorId } from "@/lib/domain/conquistas";
import { cn } from "@/lib/utils";

const POR_GRUPO: Record<string, LucideIcon> = { ofensiva: Flame, xp: Sparkles, respostas: ListChecks };
const POR_ID: Record<string, LucideIcon> = {
  "primeiro-giro": Disc3,
  "rodada-perfeita": Target,
  "simulado-dez": GraduationCap,
  "procedimento-perfeito": ClipboardCheck,
  "topico-dominado": Crown,
  "revisao-em-dia": CalendarCheck,
  "caderno-vazio": NotebookPen,
};

/** Disco da medalha: dourado se ganha, cinza com cadeado se não. Decorativo (o nome vem ao lado). */
export function DiscoMedalha({ id, ganha, className }: { id: string; ganha: boolean; className?: string }) {
  const grupo = medalhaPorId(id)?.grupo ?? "";
  const Icone = ganha ? (POR_ID[id] ?? POR_GRUPO[grupo] ?? Sparkles) : Lock;
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full border-2",
        ganha ? "border-gold bg-gold/20 text-ink" : "border-line bg-sf2 text-ink3",
        className,
      )}
      aria-hidden
    >
      <Icone className="size-6" />
    </span>
  );
}
