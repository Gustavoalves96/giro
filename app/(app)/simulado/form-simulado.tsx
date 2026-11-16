"use client";

import { Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { comecarSimulado } from "@/app/(app)/simulado/actions";
import { Button } from "@/components/ui/button";
import { MAX_QUESTOES, QUESTOES_PADRAO, SEGUNDOS_POR_QUESTAO } from "@/lib/domain/simulado";
import { cn } from "@/lib/utils";

type Disciplina = { id: string; nome: string; cor: string; questoes: number };

const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const CAMPO =
  "h-12 w-28 rounded-[14px] border border-line bg-sf px-4 text-base font-bold text-ink tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring";
const inteiro = (v: string) => (v === "" ? NaN : Math.trunc(Number(v)));

export function FormSimulado({ disciplinas }: { disciplinas: Disciplina[] }) {
  const router = useRouter();
  const [desligadas, setDesligadas] = useState<string[]>([]);
  const [questoes, setQuestoes] = useState(String(QUESTOES_PADRAO));
  const [minutos, setMinutos] = useState<string | null>(null); // null = segue o padrão (1 min por questão)
  const [indo, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const ligadas = disciplinas.filter((d) => !desligadas.includes(d.id));
  const disponiveis = ligadas.reduce((t, d) => t + d.questoes, 0);
  const n = inteiro(questoes);
  const vao = Number.isFinite(n) ? Math.min(Math.max(n, 0), disponiveis) : 0;
  const minutosValor = minutos ?? String(Math.max(1, Math.ceil(((Number.isFinite(n) ? n : 0) * SEGUNDOS_POR_QUESTAO) / 60)));

  function comecar(e: React.FormEvent) {
    e.preventDefault();
    const m = inteiro(minutosValor);
    if (!ligadas.length) return setErro("Escolha pelo menos uma disciplina.");
    if (!Number.isFinite(n) || n < 1 || n > MAX_QUESTOES) return setErro(`O número de questões vai de 1 a ${MAX_QUESTOES}.`);
    if (!Number.isFinite(m) || m < 1 || m > 300) return setErro("O tempo vai de 1 a 300 minutos.");
    setErro(null);
    iniciar(async () => {
      try {
        const r = await comecarSimulado({ disciplinaIds: ligadas.map((d) => d.id), questoes: n, minutos: m });
        if (r.ok) router.push(r.url);
        else setErro(r.mensagem);
      } catch {
        setErro("Não foi possível começar o simulado. Confira a conexão e tente de novo.");
      }
    });
  }

  return (
    <form onSubmit={comecar} className="flex flex-col gap-6 rounded-3xl border border-line bg-sf p-5 md:p-6">
      <fieldset>
        <legend className={ROTULO}>Disciplinas</legend>
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {disciplinas.map((d) => {
            const ligada = !desligadas.includes(d.id);
            return (
              <li key={d.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={ligada}
                  onClick={() => setDesligadas((ds) => (ligada ? [...ds, d.id] : ds.filter((x) => x !== d.id)))}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-[14px] border px-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                    ligada ? "border-line bg-sf" : "border-dashed border-ink3/60 text-ink3",
                  )}
                >
                  <span
                    className="size-4 shrink-0 rounded-[5px] border-2"
                    style={{ borderColor: d.cor, backgroundColor: ligada ? d.cor : "transparent" }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate font-bold">{d.nome}</span>
                  <span className="text-[13px] text-ink3 tabular-nums" aria-label={`${d.questoes} questões`}>
                    {d.questoes}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="sim-questoes" className={ROTULO}>
            Questões
          </label>
          <input
            id="sim-questoes"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QUESTOES}
            value={questoes}
            onChange={(e) => setQuestoes(e.target.value)}
            aria-describedby="sim-disponiveis"
            className={CAMPO}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="sim-minutos" className={ROTULO}>
            Tempo total (min)
          </label>
          <input
            id="sim-minutos"
            type="number"
            inputMode="numeric"
            min={1}
            max={300}
            value={minutosValor}
            onChange={(e) => setMinutos(e.target.value)}
            aria-describedby="sim-tempo-dica"
            className={CAMPO}
          />
        </div>
      </div>
      <div className="-mt-2 flex flex-col gap-1 text-ink2">
        <p id="sim-disponiveis">
          {disponiveis === 1 ? "1 questão disponível" : `${disponiveis} questões disponíveis`} nas disciplinas marcadas
          {Number.isFinite(n) && n > disponiveis && disponiveis > 0 ? `: vão todas as ${disponiveis}.` : "."} Procedimentos ficam fora.
        </p>
        <p id="sim-tempo-dica" className="text-[13px] text-ink3">
          Padrão: 1 minuto por questão. Acabou o tempo, a prova é entregue sozinha.
        </p>
      </div>

      {erro && (
        <p role="status" className="rounded-2xl border border-warn/40 p-3 text-warn">
          {erro}
        </p>
      )}

      <Button type="submit" variant="destaque" disabled={indo || !vao} className="w-full sm:w-auto sm:self-start">
        <Timer aria-hidden />
        {indo ? "Sorteando…" : `Começar · ${vao} ${vao === 1 ? "questão" : "questões"}`}
      </Button>
    </form>
  );
}
