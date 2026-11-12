"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const OPCOES = [
  { valor: "light", rotulo: "Claro", Icone: Sun },
  { valor: "dark", rotulo: "Escuro", Icone: Moon },
  { valor: "system", rotulo: "Sistema", Icone: Monitor },
] as const;

const nada = () => () => {};

/** Segmentado claro / escuro / sistema (o next-themes guarda em localStorage "theme"). */
export function SeletorTema() {
  const { theme, setTheme } = useTheme();
  // o tema só é conhecido no cliente; antes de montar, nenhuma opção marcada
  const montado = useSyncExternalStore(nada, () => true, () => false);
  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-[14px] bg-sf2 p-1 sm:inline-flex">
      {OPCOES.map(({ valor, rotulo, Icone }) => {
        const marcado = montado && theme === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => setTheme(valor)}
            className={cn(
              "flex h-14 flex-col items-center justify-center gap-0.5 rounded-[10px] px-2 text-[13px] font-bold sm:h-11 sm:flex-row sm:gap-2 sm:px-4 sm:text-base text-ink3 transition-colors hover:text-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              marcado && "bg-sf text-ink shadow-sm",
            )}
          >
            <Icone className="size-5" aria-hidden />
            {rotulo}
          </button>
        );
      })}
    </div>
  );
}
