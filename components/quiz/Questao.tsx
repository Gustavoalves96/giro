"use client";

import { ArrowRight, Check, CircleCheck, Flag, FlagOff, Flame, Lightbulb, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { type Conferencia, responder, sinalizarErro } from "@/app/(app)/questoes/actions";
import { useMovimentoReduzido } from "@/components/movimento-reduzido";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import type { Questao as QuestaoDb } from "@/lib/db/schema";
import { pontosQuestao, type RespostaPontuada } from "@/lib/domain/pontuacao";
import type { Opcao } from "@/lib/domain/selecao-questoes";
import { ROTULO_TIPO } from "@/lib/questoes/rotulos";
import { cn } from "@/lib/utils";

/** O que vai para o cliente antes da resposta: sem gabarito, explicação nem fonte. */
export type QuestaoExibida = {
  id: string;
  tipo: QuestaoDb["tipo"];
  enunciado: string;
  disciplina: string;
  cor: string;
  sinalizadaComErro: boolean;
  opcoes: Opcao[]; // já embaralhadas
};

type Props = {
  questao: QuestaoExibida;
  /** imediato: certo/errado + explicação a cada questão · final (simulado): só registra. */
  feedback: "imediato" | "final";
  sessaoId: string | null;
  /** Acertos seguidos antes desta questão (para "+N XP" e o selo). */
  sequenciaAntes: number;
  onRespondida: (r: RespostaPontuada) => void;
  onProxima: () => void;
  ultima?: boolean;
};

type Fase = "respondendo" | "enviando" | "respondida";
type Estado = "normal" | "selecionada" | "correta" | "sua" | "esmaecida";

const ROTULO = "text-[13px] font-bold tracking-[0.06em] uppercase";
const ATRASO_ERRO = 0.35; // fade âmbar 200 ms; 150 ms depois a correta e a explicação

export function Questao({ questao, feedback, sessaoId, sequenciaAntes, onRespondida, onProxima, ultima }: Props) {
  const reduzir = useMovimentoReduzido();
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [fase, setFase] = useState<Fase>("respondendo");
  const [conf, setConf] = useState<(Conferencia & { pontos: number; sequencia: number; naoSei: boolean }) | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sinalizada, setSinalizada] = useState(questao.sinalizadaComErro);
  const [sinalizando, setSinalizando] = useState(false);
  const inicio = useRef(0);
  const grupo = useRef<HTMLDivElement>(null);
  const proxima = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    inicio.current = Date.now();
  }, []);

  useEffect(() => {
    if (fase === "respondida") proxima.current?.focus({ preventScroll: true });
  }, [fase]);

  async function confirmar(naoSei: boolean) {
    if (fase !== "respondendo" || (!naoSei && !selecionada)) return;
    const valor = naoSei ? null : (questao.opcoes.find((o) => o.letra === selecionada)?.valor ?? null);
    const tempoMs = Math.min(30 * 60_000, Date.now() - inicio.current);
    setErro(null);
    setFase("enviando");
    try {
      const c = await responder({ questaoId: questao.id, sessaoId, respostaDada: valor, tempoMs });
      const sequencia = c.acertou ? sequenciaAntes + 1 : 0;
      if (naoSei) setSelecionada(null);
      setConf({ ...c, naoSei, sequencia, pontos: pontosQuestao({ acertou: c.acertou, tempoMs, sequenciaAtual: sequencia }) });
      setFase("respondida");
      onRespondida({ acertou: c.acertou, tempoMs });
    } catch {
      setErro("Não foi possível enviar a resposta. Confira a conexão e tente de novo.");
      setFase("respondendo");
    }
  }

  async function trocarSinal() {
    setSinalizando(true);
    try {
      await sinalizarErro(questao.id, !sinalizada);
      setSinalizada(!sinalizada);
    } catch {
      setErro("Não foi possível sinalizar agora. Tente de novo.");
    }
    setSinalizando(false);
  }

  // A–E (ou V/F) escolhem; Enter confirma / avança. Num botão em foco, Enter fica com o botão.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const alvo = e.target instanceof HTMLElement ? e.target : null;
      if (alvo?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === "Enter") {
        if (alvo?.closest("button, a") && !alvo.closest("[role=radio]")) return;
        e.preventDefault();
        if (fase === "respondida") onProxima();
        else void confirmar(false);
        return;
      }
      if (fase !== "respondendo" || e.key.length !== 1) return;
      const k = e.key.toUpperCase();
      const porLetra = questao.opcoes.find((o) => o.letra === k);
      const porPosicao = questao.opcoes["ABCDE".indexOf(k)];
      const opcao = porLetra ?? ("ABCDE".includes(k) ? porPosicao : undefined);
      if (!opcao) return;
      e.preventDefault();
      setSelecionada(opcao.letra);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // setas movem a seleção dentro do grupo de rádio
  function onSetas(e: React.KeyboardEvent) {
    const passo = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!passo || fase !== "respondendo") return;
    e.preventDefault();
    const n = questao.opcoes.length;
    const i = questao.opcoes.findIndex((o) => o.letra === selecionada);
    const j = i < 0 ? (passo > 0 ? 0 : n - 1) : (i + passo + n) % n;
    setSelecionada(questao.opcoes[j].letra);
    grupo.current?.querySelectorAll<HTMLElement>("[role=radio]")[j]?.focus();
  }

  const respondida = fase === "respondida" && conf;
  const mostrar = respondida && feedback === "imediato";
  const correta = conf ? questao.opcoes.find((o) => o.valor === conf.gabarito) : undefined;
  const errou = mostrar && !conf.acertou;

  function estado(letra: string): Estado {
    if (!mostrar) return letra === selecionada ? "selecionada" : respondida ? "esmaecida" : "normal";
    if (letra === correta?.letra) return "correta";
    if (letra === selecionada) return "sua";
    return "esmaecida";
  }

  const vf = questao.tipo === "verdadeiro_falso";
  const nomeCorreta = correta ? (vf ? `“${correta.texto}”` : `a ${correta.letra}`) : "";
  const indiceFoco = Math.max(0, questao.opcoes.findIndex((o) => o.letra === selecionada));

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_480px]">
      <section aria-label="Questão" className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge
            variant="chip"
            style={{ backgroundColor: tintaClara(questao.cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: questao.cor }} aria-hidden />
            {questao.disciplina}
          </Badge>
          <span className={cn(ROTULO, "text-ink3")}>{ROTULO_TIPO[questao.tipo]}</span>
        </div>
        <p id={`enunciado-${questao.id}`} className="text-base leading-[1.6] whitespace-pre-line md:text-[18px] xl:text-[19px]">
          {questao.enunciado}
        </p>

        <div
          ref={grupo}
          role="radiogroup"
          aria-labelledby={`enunciado-${questao.id}`}
          aria-disabled={fase !== "respondendo" || undefined}
          onKeyDown={onSetas}
          className="mt-6 flex flex-col gap-2.5"
        >
          {questao.opcoes.map((o, i) => {
            const e = estado(o.letra);
            const atraso = errou && e === "correta" ? ATRASO_ERRO : 0;
            return (
              <button
                key={o.letra}
                type="button"
                role="radio"
                aria-checked={o.letra === selecionada}
                aria-disabled={fase !== "respondendo" || undefined}
                tabIndex={i === indiceFoco ? 0 : -1}
                data-letra={o.letra}
                data-valor={o.valor}
                data-estado={e}
                onClick={() => fase === "respondendo" && setSelecionada(o.letra)}
                style={{ transitionDelay: `${atraso}s` }}
                className={cn(
                  "flex min-h-[50px] w-full items-center gap-3 rounded-2xl border-2 bg-sf px-2.5 py-2 text-left outline-none md:min-h-14 md:px-3",
                  "transition-[background-color,border-color,opacity] duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  e === "normal" && "border-line hover:bg-sf2",
                  e === "selecionada" && "border-ink",
                  e === "correta" && "border-ok bg-ok/10",
                  e === "sua" && "border-warn bg-warn/10",
                  e === "esmaecida" && "border-line opacity-55",
                )}
              >
                <span
                  style={{ transitionDelay: `${atraso}s` }}
                  className={cn(
                    "flex size-[34px] shrink-0 items-center justify-center rounded-[10px] font-display text-[17px] font-extrabold transition-colors duration-200",
                    e === "selecionada" ? "bg-ink text-bg" : e === "correta" ? "bg-ok text-sf" : e === "sua" ? "bg-warn text-sf" : "bg-sf2 text-ink",
                  )}
                  aria-hidden
                >
                  {o.letra}
                </span>
                <span className="min-w-0 flex-1 leading-snug">
                  {vf ? <span className="sr-only">{o.letra}: </span> : <span className="sr-only">{o.letra}) </span>}
                  {o.texto}
                </span>
                {e === "correta" && (
                  <motion.span
                    className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-ok"
                    initial={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={reduzir ? { duration: 0.2, delay: atraso } : { type: "spring", stiffness: 500, damping: 18, delay: atraso }}
                  >
                    <Check className="size-5" aria-hidden />
                    Correta
                  </motion.span>
                )}
                {e === "sua" && (
                  <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-warn">
                    <X className="size-5" aria-hidden />
                    Sua resposta
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <aside aria-label="Resposta" className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        {/* sempre no DOM: o leitor de tela anuncia quando o conteúdo muda */}
        <div role="status">
          {mostrar && (
            <motion.div
              data-feedback={conf.acertou ? "acerto" : conf.naoSei ? "nao-sei" : "erro"}
              className={cn(
                "rounded-3xl border-2 p-5",
                conf.acertou ? "border-ok bg-ok/10" : "border-warn bg-warn/10",
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {conf.acertou ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <CircleCheck className="size-8 text-ok" aria-hidden />
                    <p className="font-display text-[28px] leading-none font-extrabold text-ok">Isso!</p>
                    <motion.span
                      className="font-display text-[20px] font-extrabold tabular-nums"
                      initial={{ opacity: 0, y: reduzir ? 0 : 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduzir ? 0 : 0.12, duration: 0.25 }}
                    >
                      +{conf.pontos} XP
                    </motion.span>
                  </div>
                  {conf.sequencia >= 3 && <SeloSequencia n={conf.sequencia} reduzir={reduzir} />}
                </>
              ) : (
                <div className="flex items-start gap-3">
                  <Lightbulb className="mt-0.5 size-7 shrink-0 text-warn" aria-hidden />
                  <div>
                    <p className="font-display text-[22px] leading-tight font-extrabold text-warn">
                      {conf.naoSei ? `Tudo bem! A correta é ${nomeCorreta}.` : `Quase! A correta é ${nomeCorreta}.`}
                    </p>
                    <p className="mt-1 text-ink2">Essa questão volta na sua revisão.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {respondida && feedback === "final" && (
            <p className="rounded-3xl border border-line bg-sf p-5 font-bold">Resposta registrada. O resultado sai no fim.</p>
          )}
        </div>

        {mostrar && (
          <motion.div
            className="rounded-3xl border border-line bg-sf p-5"
            initial={{ opacity: 0, y: reduzir ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ATRASO_ERRO, duration: 0.3 }}
          >
            <p className={cn(ROTULO, "text-ink3")}>Por quê</p>
            <p className="mt-2 leading-[1.6]">{conf.explicacao}</p>
            <p className="mt-3 text-[13px] text-ink3">
              Fonte: <span className="text-ink2">{conf.fonte ?? "não informada"}</span>
            </p>
          </motion.div>
        )}

        {fase === "respondida" ? (
          <div className="flex flex-col gap-2">
            <Button ref={proxima} onClick={onProxima}>
              {ultima ? "Ver resultado" : "Próxima questão"}
              <ArrowRight aria-hidden />
            </Button>
            {mostrar && (
              <Button variant="ghost" onClick={trocarSinal} disabled={sinalizando} aria-pressed={sinalizada}>
                {sinalizada ? <FlagOff aria-hidden /> : <Flag aria-hidden />}
                {sinalizada ? "Sinalizada · desfazer" : "Sinalizar erro"}
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 lg:rounded-3xl lg:border lg:border-line lg:bg-sf lg:p-5">
            <p className="font-display text-[22px] font-extrabold max-md:hidden">Sua vez</p>
            <p className="text-[13px] text-ink3 max-md:hidden [@media(hover:none)]:hidden" data-dica-teclado>
              <Kbd>{vf ? "V" : "A"}</Kbd>–<Kbd>{vf ? "F" : questao.opcoes.at(-1)?.letra}</Kbd> para escolher ·{" "}
              <Kbd>Enter</Kbd> para confirmar
            </p>
            <Button onClick={() => confirmar(false)} disabled={!selecionada || fase === "enviando"} className="md:mt-2">
              {fase === "enviando" ? "Conferindo…" : "Confirmar resposta"}
            </Button>
            <Button variant="ghost" onClick={() => confirmar(true)} disabled={fase === "enviando"}>
              Não sei — mostrar resposta
            </Button>
          </div>
        )}
        {erro && <p className="text-warn">{erro}</p>}
      </aside>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded-md border border-line bg-sf2 px-1.5 py-0.5 font-sans text-[12px] font-bold text-ink2">{children}</kbd>;
}

/** "sequência x3!": escala 0,6 → 1,12 → 1 aos 150 ms; na 5ª seguida, mini confete só no selo. */
export function SeloSequencia({ n, reduzir }: { n: number; reduzir: boolean }) {
  return (
    <motion.div
      className="relative mt-3 w-fit"
      initial={reduzir ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
      animate={reduzir ? { opacity: 1 } : { opacity: 1, scale: [0.6, 1.12, 1] }}
      transition={{ delay: reduzir ? 0 : 0.15, duration: reduzir ? 0.2 : 0.4 }}
    >
      {n >= 5 &&
        !reduzir &&
        Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * 2 * Math.PI;
          return (
            <motion.span
              key={i}
              aria-hidden
              className="absolute top-1/2 left-1/2 -mt-1 -ml-1 size-2 rounded-[2px]"
              style={{ backgroundColor: i % 2 ? "var(--gold)" : "var(--ac)" }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos(a) * 110, y: Math.sin(a) * 42, opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
            />
          );
        })}
      {/* relative + depois do confete: o selo fica por cima */}
      <Badge variant="chip" className="relative border-gold/60 bg-sf">
        <span className="absolute inset-0 rounded-full bg-gold/20" aria-hidden />
        <Flame className="relative text-gold" aria-hidden />
        <span className="relative">sequência x{n}!</span>
      </Badge>
    </motion.div>
  );
}
