"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Botão "Usar" do formulário de um visual; mostra o envio enquanto salva. */
export function BotaoUsar({ nome }: { nome: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} aria-label={`Usar ${nome}`}>
      {pending ? "Salvando…" : "Usar"}
    </Button>
  );
}
