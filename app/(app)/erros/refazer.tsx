"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { FiltroErros } from "@/lib/db/erros";
import { cn } from "@/lib/utils";
import { refazerErros } from "./actions";

type Props = { filtro: FiltroErros; rotulo: string; ariaLabel?: string; variant?: "default" | "secondary"; className?: string };

export function Refazer({ filtro, rotulo, ariaLabel, variant = "default", className }: Props) {
  const router = useRouter();
  const [abrindo, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        variant={variant}
        disabled={abrindo}
        aria-label={ariaLabel}
        onClick={() =>
          iniciar(async () => {
            setErro(null);
            try {
              router.push(await refazerErros(filtro));
            } catch {
              setErro("Não foi possível abrir. Confira a conexão e tente de novo.");
            }
          })
        }
      >
        <RotateCcw aria-hidden />
        {abrindo ? "Abrindo…" : rotulo}
      </Button>
      {erro && (
        <p role="alert" className="text-warn">
          {erro}
        </p>
      )}
    </div>
  );
}
