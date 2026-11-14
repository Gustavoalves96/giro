"use client";

import { ArrowLeft, ArrowRight, Clock, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { entregarSimulado } from "@/app/(app)/simulado/actions";
import { Kbd, Questao, type QuestaoExibida } from "@/components/quiz/Questao";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Opcao } from "@/lib/domain/selecao-questoes";
import { relogio } from "@/lib/domain/simulado";
import { cn } from "@/lib/utils";

type Props = { sessaoId: string; questoes: QuestaoExibida[]; restanteMs: number; resultado: string };
type Respostas = Record<string, Opcao["valor"]>;

const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const chave = (id: string) => `giro:simulado:${id}`;
const agoraMs = () => Date.now(); // fora do componente (react-hooks/purity)

// Respostas em andamento ficam no sessionStorage: recarregar a aba no iPad não perde a prova.
// O fim da prova vem do servidor (iniciada_em + limite), então o tempo também não zera.
function lerRespostas(id: string): Respostas {
  try {
    return JSON.parse(sessionStorage.getItem(chave(id)) ?? "{}");
  } catch {
    return {};
  }
}
export function esquecerProva(id: string) {
  try {
    sessionStorage.removeItem(chave(id));
  } catch {}
}

export function ProvaSimulado({ sessaoId, questoes, restanteMs, resultado }: Props) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [respostas, setRespostas] = useState<Respostas | null>(null); // null até ler o sessionStorage
  const [fim, setFim] = useState<number | null>(null);
  const [agora, setAgora] = useState(0);
  const [confirmar, setConfirmar] = useState(false);
  const [entregando, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const entregue = useRef(false);

  useEffect(() => {
    const t = agoraMs();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage e relógio só existem no cliente
    setRespostas(lerRespostas(sessaoId));
    setFim(t + restanteMs);
    setAgora(t);
  }, [sessaoId, restanteMs]);

  useEffect(() => {
    if (!respostas) return;
    try {
      sessionStorage.setItem(chave(sessaoId), JSON.stringify(respostas));
    } catch {}
  }, [sessaoId, respostas]);

  const entregar = useCallback(() => {
    if (!respostas || entregue.current) return;
    entregue.current = true;
    setConfirmar(false);
    setErro(null);
    iniciar(async () => {
      try {
        await entregarSimulado({ sessaoId, respostas });
        esquecerProva(sessaoId);
        router.push(resultado);
      } catch {
        entregue.current = false;
        setErro("Não foi possível entregar. Confira a conexão e tente de novo: suas respostas continuam guardadas.");
      }
    });
  }, [respostas, sessaoId, router, resultado]);

  // Relógio por horário (não por ticks): com a tela bloqueada o setInterval para, e na volta o tempo está certo.
  useEffect(() => {
    if (fim === null) return;
    const tick = () => setAgora(agoraMs());
    const id = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [fim]);

  const restante = fim === null ? Math.ceil(restanteMs / 1000) : Math.max(0, Math.ceil((fim - agora) / 1000));
  const esgotado = fim !== null && restante === 0;

  // Tempo esgotado → entrega automática (uma vez; se falhar, o botão de tentar de novo fica na tela).
  useEffect(() => {
    if (esgotado && !erro) entregar();
  }, [esgotado, erro, entregar]);

  const n = questoes.length;
  const atual = questoes[i];
  const respondidas = respostas ? questoes.filter((q) => respostas[q.id]).length : 0;
  const emBranco = n - respondidas;
  const ultimoMinuto = restante <= 60;
  const bloqueada = esgotado || entregando;

  const ir = (j: number) => setI(Math.max(0, Math.min(n - 1, j)));

  const painel = (
    <div className="flex flex-col gap-4 lg:rounded-3xl lg:border lg:border-line lg:bg-sf lg:p-5">
      <p className="text-[13px] text-ink3 max-md:hidden [@media(hover:none)]:hidden" data-dica-teclado>
        <Kbd>A</Kbd>–<Kbd>E</Kbd> ou <Kbd>V</Kbd>/<Kbd>F</Kbd> para marcar · <Kbd>Enter</Kbd> próxima
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => ir(i - 1)} disabled={i === 0 || bloqueada}>
          <ArrowLeft aria-hidden />
          Anterior
        </Button>
        <Button variant="secondary" onClick={() => ir(i + 1)} disabled={i === n - 1 || bloqueada}>
          Próxima
          <ArrowRight aria-hidden />
        </Button>
      </div>
      <nav aria-labelledby="mapa-titulo">
        <h2 id="mapa-titulo" className={ROTULO}>
          Questões · <span className="tabular-nums">{respondidas}</span> de <span className="tabular-nums">{n}</span> marcadas
        </h2>
        <ol className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5">
          {questoes.map((q, j) => {
            const marcada = !!respostas?.[q.id];
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => ir(j)}
                  disabled={bloqueada}
                  aria-current={j === i ? "step" : undefined}
                  aria-label={`Questão ${j + 1}, ${marcada ? "marcada" : "em branco"}`}
                  data-marcada={marcada}
                  className={cn(
                    "flex size-11 w-full items-center justify-center rounded-xl border-2 font-display font-extrabold tabular-nums outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                    marcada ? "border-ink bg-ink text-bg" : "border-line bg-sf text-ink2 hover:bg-sf2",
                    j === i && !marcada && "border-ink text-ink",
                    j === i && "ring-2 ring-ink ring-offset-2 ring-offset-bg",
                  )}
                >
                  {j + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <Button variant="destaque" onClick={() => setConfirmar(true)} disabled={bloqueada}>
        <Send aria-hidden />
        Entregar
      </Button>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-6 px-4 pb-8 md:px-8">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-bg px-4 py-3 md:-mx-8 md:px-8">
        <p className="min-w-0 flex-1 text-[13px] font-bold tracking-[0.06em] text-ink2 uppercase">
          Simulado · Questão <span className="tabular-nums">{i + 1}</span> de <span className="tabular-nums">{n}</span>
        </p>
        <p
          role="timer"
          aria-label={`Tempo restante: ${relogio(restante)}`}
          data-restante={restante}
          className={cn(
            "flex items-center gap-1.5 rounded-full border-2 px-3 py-1 font-display text-[20px] font-extrabold tabular-nums",
            ultimoMinuto ? "border-warn text-warn" : "border-line text-ink",
          )}
        >
          <Clock className="size-5" aria-hidden />
          {relogio(restante)}
        </p>
      </div>

      {/* anúncio só nos marcos, para o leitor de tela não ler o relógio a cada segundo */}
      <p role="status" className="sr-only">
        {esgotado ? "Tempo esgotado. Entregando o simulado." : restante === 60 ? "Falta 1 minuto." : restante === 300 ? "Faltam 5 minutos." : ""}
      </p>

      {entregando || esgotado ? (
        <section className="max-w-xl rounded-3xl border border-line bg-sf p-6" data-entregando>
          <h1 className="font-display text-[28px] font-extrabold">{esgotado ? "Tempo esgotado" : "Entregando…"}</h1>
          <p className="mt-2 text-ink2">{entregando ? "Corrigindo suas respostas." : "As questões em branco contam como erro."}</p>
        </section>
      ) : respostas && atual ? (
        <Questao
          key={atual.id}
          questao={atual}
          feedback="final"
          escolhida={respostas[atual.id] ?? null}
          onEscolher={(v) => setRespostas((r) => ({ ...r, [atual.id]: v }))}
          onProxima={() => ir(i + 1)}
          painel={painel}
        />
      ) : (
        <div className="h-96 animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />
      )}

      {erro && (
        <p role="alert" className="text-warn">
          {erro}{" "}
          <button type="button" className="font-bold underline" onClick={entregar}>
            Tentar de novo
          </button>
        </p>
      )}

      <Dialog open={confirmar} onOpenChange={setConfirmar}>
        <DialogContent className="rounded-3xl border-line bg-sf p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-extrabold">Entregar o simulado?</DialogTitle>
            <DialogDescription className="text-base text-ink2">
              {emBranco
                ? `${emBranco === 1 ? "1 questão está em branco e conta" : `${emBranco} questões estão em branco e contam`} como erro na nota.`
                : "Todas as questões estão marcadas."}{" "}
              Depois de entregar não dá para trocar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={entregar}>
              Entregar
            </Button>
            <DialogClose asChild>
              <Button autoFocus>Voltar à prova</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
