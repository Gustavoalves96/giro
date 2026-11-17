"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Um tópico que pode entrar na roleta ou no simulado; `peso` é o que a contagem soma (1 por tópico ou nº de questões). */
export type ItemTopico = { id: string; nome: string; disciplinaId: string; disciplina: string; cor: string; peso: number };

const LINHA = "flex min-h-11 w-full items-center gap-3 rounded-[14px] border px-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring";

/**
 * Disciplinas com caixa de 3 estados (todos/alguns/nenhum tópico) e seta que abre os tópicos dela.
 * Guarda os tópicos DESLIGADOS: tudo começa marcado.
 */
export function SeletorTopicos({
  itens,
  desligados,
  aoMudar,
  unidade,
  disabled,
  className,
}: {
  itens: ItemTopico[];
  desligados: string[];
  aoMudar: (desligados: string[]) => void;
  /** Rótulo da contagem: [singular, plural], ex. ["questão", "questões"]. */
  unidade: [string, string];
  disabled?: boolean;
  className?: string;
}) {
  const [abertas, setAbertas] = useState<string[]>([]);
  const grupos = new Map<string, { id: string; nome: string; cor: string; topicos: ItemTopico[] }>();
  for (const t of itens) {
    const g = grupos.get(t.disciplinaId) ?? { id: t.disciplinaId, nome: t.disciplina, cor: t.cor, topicos: [] };
    g.topicos.push(t);
    grupos.set(g.id, g);
  }
  const fora = new Set(desligados);
  const conta = (n: number) => `${n} ${n === 1 ? unidade[0] : unidade[1]}`;

  return (
    <ul className={cn("mt-2 grid items-start gap-2", className)}>
      {[...grupos.values()].map((d) => {
        const ids = d.topicos.map((t) => t.id);
        const ligados = d.topicos.filter((t) => !fora.has(t.id));
        const estado = ligados.length === d.topicos.length ? true : ligados.length ? "mixed" : false;
        const total = d.topicos.reduce((s, t) => s + t.peso, 0);
        const marcado = ligados.reduce((s, t) => s + t.peso, 0);
        const aberta = abertas.includes(d.id);
        const listaId = `topicos-${d.id}`;
        return (
          // aberta ocupa a linha toda da grade: os tópicos ganham largura e não sobra buraco ao lado
          <li key={d.id} className={cn(aberta && "col-span-full")}>
            <div className="flex gap-1">
              <button
                type="button"
                role="checkbox"
                aria-checked={estado}
                disabled={disabled}
                // marcada (toda ou em parte) desmarca tudo; desmarcada marca tudo
                onClick={() => aoMudar(estado ? [...new Set([...desligados, ...ids])] : desligados.filter((x) => !ids.includes(x)))}
                className={cn(LINHA, estado ? "border-line bg-sf" : "border-dashed border-ink3/60 text-ink3")}
              >
                <Caixa cor={d.cor} estado={estado} />
                <span className="min-w-0 flex-1 truncate font-bold">{d.nome}</span>
                <span
                  className="text-[13px] whitespace-nowrap text-ink3 tabular-nums"
                  aria-label={estado === "mixed" ? `${conta(marcado)} de ${total}` : conta(total)}
                >
                  {estado === "mixed" ? `${marcado} de ${total}` : total}
                </span>
              </button>
              <button
                type="button"
                aria-expanded={aberta}
                aria-controls={listaId}
                aria-label={`${aberta ? "Esconder" : "Escolher"} tópicos de ${d.nome}`}
                disabled={disabled}
                onClick={() => setAbertas((as) => (aberta ? as.filter((x) => x !== d.id) : [...as, d.id]))}
                className="flex size-11 shrink-0 items-center justify-center rounded-[14px] text-ink2 outline-none hover:bg-sf2 focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <ChevronDown className={cn("size-5 transition-transform motion-reduce:transition-none", aberta && "rotate-180")} aria-hidden />
              </button>
            </div>
            {aberta && (
              <ul id={listaId} aria-label={`Tópicos de ${d.nome}`} className="mt-1 ml-4 flex flex-col gap-1 border-l-2 border-line pl-3">
                {d.topicos.map((t) => {
                  const ligado = !fora.has(t.id);
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={ligado}
                        disabled={disabled}
                        onClick={() => aoMudar(ligado ? [...desligados, t.id] : desligados.filter((x) => x !== t.id))}
                        className={cn(LINHA, "border-transparent", !ligado && "text-ink3")}
                      >
                        <Caixa cor={d.cor} estado={ligado} />
                        <span className="min-w-0 flex-1 py-2 wrap-break-word">{t.nome}</span>
                        {/* contando tópicos, cada um vale 1: o número ao lado não diz nada */}
                        {unidade[0] !== "tópico" && (
                          <span className="text-[13px] text-ink3 tabular-nums" aria-label={conta(t.peso)}>
                            {t.peso}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Caixa({ cor, estado }: { cor: string; estado: boolean | "mixed" }) {
  return (
    <span
      className="flex size-4 shrink-0 items-center justify-center rounded-[5px] border-2"
      style={{ borderColor: cor, backgroundColor: estado === true ? cor : "transparent" }}
      aria-hidden
    >
      {estado === "mixed" && <span className="h-0.5 w-2 rounded-full" style={{ backgroundColor: cor }} />}
    </span>
  );
}
