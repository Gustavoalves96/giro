"use client";

import { useActionState, useState } from "react";
import { SeletorEstudo } from "@/components/seletor-estudo";
import { Button } from "@/components/ui/button";
import { type EstadoNome, salvarEstudo } from "./actions";

export function FormEstudo({ atual }: { atual: number }) {
  const [estado, acao, salvando] = useActionState<EstadoNome, FormData>(salvarEstudo, {});
  const [valor, setValor] = useState(String(atual));
  return (
    <form action={acao} className="space-y-3">
      <label htmlFor="estudoSegundos" className="block font-bold">
        Tempo de estudo padrão
      </label>
      <p className="text-ink3">Na roleta dá para trocar só para aquela rodada.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <SeletorEstudo
          id="estudoSegundos"
          name="estudoSegundos"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          aria-describedby="estudo-status"
          className="sm:w-40"
        />
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
      <p id="estudo-status" role="status" className={estado.erro ? "text-warn" : "text-ok"}>
        {estado.erro ?? (estado.salvo && !salvando ? "Tempo salvo." : "")}
      </p>
    </form>
  );
}
