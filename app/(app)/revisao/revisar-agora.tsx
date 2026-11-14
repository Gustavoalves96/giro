"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { comecarRevisao } from "./actions";

export function RevisarAgora({ minutos }: { minutos: number }) {
  const router = useRouter();
  const [abrindo, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  return (
    <>
      <Button
        className="mt-5 w-full sm:w-auto"
        disabled={abrindo}
        onClick={() =>
          iniciar(async () => {
            setErro(null);
            try {
              router.push(await comecarRevisao());
            } catch {
              setErro("Não foi possível começar a revisão. Confira a conexão e tente de novo.");
            }
          })
        }
      >
        {abrindo ? "Abrindo…" : `Revisar agora · ~${minutos} min`}
        <ArrowRight aria-hidden />
      </Button>
      {erro && (
        <p role="alert" className="mt-2 text-warn">
          {erro}
        </p>
      )}
    </>
  );
}
