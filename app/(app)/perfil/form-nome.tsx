"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { type EstadoNome, salvarNome } from "./actions";

export function FormNome({ nomeAtual }: { nomeAtual: string }) {
  const [estado, acao, salvando] = useActionState<EstadoNome, FormData>(salvarNome, {});
  // controlado: o React não limpa o campo depois da action (nem quando dá erro)
  const [nome, setNome] = useState(nomeAtual);
  return (
    <form action={acao} className="space-y-3">
      <label htmlFor="nome" className="block font-bold">
        Como você quer ser chamada?
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="nome"
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={40}
          autoComplete="given-name"
          aria-invalid={estado.erro ? true : undefined}
          aria-describedby="nome-status"
          className="h-12 w-full rounded-[14px] border border-line bg-sf px-4 text-base text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-warn sm:max-w-sm"
        />
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
      <p id="nome-status" role="status" className={estado.erro ? "text-warn" : "text-ok"}>
        {estado.erro ?? (estado.salvo && !salvando ? "Nome salvo." : "")}
      </p>
    </form>
  );
}
