"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { type EstadoNome, salvarMeta } from "./actions";

const OPCOES = Array.from({ length: 20 }, (_, i) => i + 1);

export function FormMeta({ atual }: { atual: number }) {
  const [estado, acao, salvando] = useActionState<EstadoNome, FormData>(salvarMeta, {});
  const [valor, setValor] = useState(String(atual));
  return (
    <form action={acao} className="space-y-3">
      <label htmlFor="metaRodadas" className="block font-bold">
        Meta de rodadas por dia
      </label>
      <p className="text-ink3">Aparece no Início como “Rodada de hoje · x de {valor}”.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* nativo, como o tempo de estudo: no iPad abre o seletor do sistema */}
        <select
          id="metaRodadas"
          name="metaRodadas"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          aria-describedby="meta-status"
          className="h-12 rounded-[14px] border border-line bg-sf px-4 text-base font-bold text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-40"
        >
          {OPCOES.map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "rodada" : "rodadas"}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
      <p id="meta-status" role="status" className={estado.erro ? "text-warn" : "text-ok"}>
        {estado.erro ?? (estado.salvo && !salvando ? "Meta salva." : "")}
      </p>
    </form>
  );
}
