"use client";

import { ArrowRight, ExternalLink, Hourglass, Pause, Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { registrarEstudo } from "@/app/(app)/roleta/actions";
import { useMovimentoReduzido } from "@/components/movimento-reduzido";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { cn } from "@/lib/utils";

type Props = {
  sessaoId: string;
  segundos: number;
  topico: string;
  disciplina: string | null;
  cor: string | null;
  notebooklmUrl: string | null;
  focos: string[];
};

const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const MAIS = 120_000; // "+2 min"
const R = 46;
const CIRC = 2 * Math.PI * R;

// Fora do componente (react-hooks/purity). O timer é por relógio, não por contagem de ticks:
// com a aba em segundo plano o setInterval atrasa, mas o tempo mostrado continua certo.
const relogio = () => Date.now();

function mmss(ms: number) {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function Estudo({ sessaoId, segundos, topico, disciplina, cor, notebooklmUrl, focos }: Props) {
  const router = useRouter();
  const reduzir = useMovimentoReduzido();
  const [duracao, setDuracao] = useState(segundos * 1000);
  const [acumulado, setAcumulado] = useState(0); // ms já estudados nos trechos encerrados (pausas não contam)
  const [desde, setDesde] = useState<number | null>(null); // início do trecho rodando; null = parado
  const [agora, setAgora] = useState(0);
  const [indo, iniciarIda] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  // começa sozinho ao abrir a tela (só no cliente: Date.now não pode rodar na renderização)
  useEffect(() => {
    const t = relogio();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- relógio só existe no cliente
    setDesde(t);
    setAgora(t);
  }, []);

  useEffect(() => {
    if (desde === null) return;
    const i = setInterval(() => {
      const t = relogio();
      if (acumulado + t - desde >= duracao) {
        setAcumulado(duracao); // acabou: para no tempo planejado
        setDesde(null);
      }
      setAgora(t);
    }, 250);
    return () => clearInterval(i);
  }, [desde, acumulado, duracao]);

  const decorrido = Math.min(duracao, acumulado + (desde !== null ? Math.max(0, agora - desde) : 0));
  const restante = duracao - decorrido;
  const rodando = desde !== null || agora === 0; // agora === 0: ainda não começou (antes da hidratação)
  const acabou = restante <= 0;
  const ultimoMinuto = !acabou && restante <= 60_000;

  function pausar() {
    if (desde === null) return;
    const t = relogio();
    setAcumulado((a) => Math.min(duracao, a + t - desde));
    setDesde(null);
    setAgora(t);
  }

  function retomar() {
    const t = relogio();
    setDesde(t);
    setAgora(t);
  }

  function maisDois() {
    setDuracao((d) => d + MAIS);
    if (acabou) retomar(); // depois do fim, +2 min volta a contar
  }

  function irParaQuestoes() {
    const t = relogio();
    const total = Math.min(duracao, acumulado + (desde !== null ? t - desde : 0));
    pausar();
    setErro(null);
    iniciarIda(async () => {
      try {
        await registrarEstudo(sessaoId, Math.round(total / 1000));
        router.push(`/roleta/sessao/${sessaoId}/questoes`);
      } catch {
        setErro("Não foi possível salvar o tempo de estudo. Tente de novo.");
      }
    });
  }

  const corAnel = ultimoMinuto || acabou ? "var(--gold)" : (cor ?? "var(--ink)");

  return (
    // Uma coluna: tópico, anel, painel. Duas colunas (lg): anel à esquerda; tópico e painel à direita.
    <div className="mx-auto grid w-full max-w-[1100px] gap-6 px-4 py-6 md:px-8 md:py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[1fr_auto_auto_1fr] lg:gap-x-12 lg:gap-y-5">
      <div className="lg:col-start-2 lg:row-start-2">
        <p className={ROTULO}>Estudando</p>
        <h1 className="mt-1 font-display text-[28px] leading-tight font-extrabold wrap-break-word md:text-[32px]">{topico}</h1>
        {disciplina && cor && (
          <Badge variant="chip" className="mt-2" style={{ backgroundColor: tintaClara(cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}>
            <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
            {disciplina}
          </Badge>
        )}
      </div>
      <section aria-label="Tempo de estudo" className="flex flex-col items-center gap-5 lg:col-start-1 lg:row-span-4 lg:row-start-1 lg:self-center">
        <div className="relative size-[min(380px,82vw)]" data-estado={acabou ? "acabou" : ultimoMinuto ? "ultimo-minuto" : rodando ? "rodando" : "pausado"}>
          <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r={R} fill="none" strokeWidth="5" className="stroke-sf2" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              stroke={corAnel}
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - restante / duracao)}
              style={{ transition: reduzir ? "none" : "stroke-dashoffset 0.25s linear, stroke 0.4s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              className="font-display text-[64px] leading-none font-extrabold tracking-[-0.02em] tabular-nums md:text-[92px]"
              data-restante={Math.ceil(restante / 1000)}
            >
              {mmss(restante)}
            </p>
            <p className="mt-2 text-ink3">{acabou ? "Tempo!" : rodando ? "estudando" : "pausado"}</p>
          </div>
        </div>
        {/* sempre no DOM: o leitor de tela anuncia quando aparece */}
        <div role="status" className="min-h-12">
          {(ultimoMinuto || acabou) && (
            <p className="flex items-center gap-2 rounded-2xl border border-gold/60 bg-gold/15 px-4 py-3 font-bold">
              <Hourglass className="size-5 shrink-0 text-gold" aria-hidden />
              {acabou ? "Tempo! Quando quiser, vá para as questões." : "Falta 1 minuto — feche o raciocínio, sem pressa"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {rodando ? (
            <Button onClick={pausar} className="min-w-36">
              <Pause aria-hidden />
              Pausar
            </Button>
          ) : (
            <Button onClick={retomar} disabled={acabou} className="min-w-36">
              <Play aria-hidden />
              Retomar
            </Button>
          )}
          <Button variant="secondary" onClick={maisDois}>
            <Plus aria-hidden />2 min
          </Button>
        </div>
      </section>

      <aside className="flex flex-col gap-4 lg:col-start-2 lg:row-start-3 lg:self-start">
        {notebooklmUrl && (
          <Button asChild variant="secondary" className="justify-start">
            <a href={notebooklmUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink aria-hidden />
              Abrir no NotebookLM
              <span className="sr-only"> (nova aba; o tempo continua)</span>
            </a>
          </Button>
        )}
        {focos.length > 0 && (
          <section aria-labelledby="foque-em" className="rounded-3xl border border-line bg-sf p-5">
            <h2 id="foque-em" className={ROTULO}>
              Foque em
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {focos.map((f, i) => (
                <li key={i} className="flex gap-3 leading-snug">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink3" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        )}
        <Button variant={acabou ? "destaque" : "default"} onClick={irParaQuestoes} disabled={indo} className={cn(!acabou && "h-[60px]")}>
          {indo ? "Abrindo questões…" : "Já estou pronta"}
          <ArrowRight aria-hidden />
          {!indo && "questões"}
        </Button>
        {erro && <p className="text-warn">{erro}</p>}
      </aside>
    </div>
  );
}
