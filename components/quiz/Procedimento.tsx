"use client";

import { ArrowRight, Check, CircleCheck, ClipboardList, Flag, FlagOff, Lightbulb, Minus, TriangleAlert, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { abrirChecklist, type ConferenciaProcedimento, conferirProcedimento, sinalizarErro } from "@/app/(app)/questoes/actions";
import { useMovimentoReduzido } from "@/components/movimento-reduzido";
import { Kbd, type QuestaoExibida, SeloSequencia } from "@/components/quiz/Questao";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import type { Checklist } from "@/lib/db/schema";
import { pontosQuestao, type RespostaPontuada } from "@/lib/domain/pontuacao";
import { NOTAS, type Nota, type Notas } from "@/lib/domain/procedimento";
import { cn } from "@/lib/utils";

// Mesmas props de Questao, para a página da rodada escolher pelo tipo. Sem timer visível: sem pressão.
type Props = {
  questao: QuestaoExibida;
  feedback: "imediato" | "final";
  sessaoId: string | null;
  sequenciaAntes: number;
  onRespondida: (r: RespostaPontuada) => void;
  onProxima: () => void;
  ultima?: boolean;
};

type Fase = "lembrando" | "abrindo" | "conferindo" | "enviando" | "conferido";
type Resultado = Extract<ConferenciaProcedimento, { ok: true }> & { pontos: number; sequencia: number };

const ROTULO = "text-[13px] font-bold tracking-[0.06em] uppercase";
const OPCAO: Record<Nota, { rotulo: string; curto: string; icone: typeof Check; marcada: string }> = {
  lembrei: { rotulo: "Lembrei", curto: "Lembrei", icone: Check, marcada: "border-ok bg-ok/15 text-ok" },
  com_erro: { rotulo: "Lembrei com erro", curto: "Com erro", icone: Minus, marcada: "border-warn/50 bg-warn/10 text-warn" },
  esqueci: { rotulo: "Esqueci", curto: "Esqueci", icone: X, marcada: "border-warn bg-warn/25 text-warn" },
};

const pct = (f: number) => `${Math.round(f * 100)}%`;

export function Procedimento({ questao, feedback, sessaoId, sequenciaAntes, onRespondida, onProxima, ultima }: Props) {
  const reduzir = useMovimentoReduzido();
  const [fase, setFase] = useState<Fase>("lembrando");
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [notas, setNotas] = useState<Notas>({});
  const [foco, setFoco] = useState(0);
  const [res, setRes] = useState<Resultado | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sinalizada, setSinalizada] = useState(questao.sinalizadaComErro);
  const [sinalizando, setSinalizando] = useState(false);
  const inicio = useRef(0);
  const lista = useRef<HTMLOListElement>(null);
  const proxima = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    inicio.current = Date.now();
  }, []);

  useEffect(() => {
    if (fase === "conferido") proxima.current?.focus({ preventScroll: true });
  }, [fase]);

  // checklist aberto (ou recarregado): foco no 1º passo, para o teclado já funcionar
  useEffect(() => {
    if (checklist) lista.current?.querySelector<HTMLElement>("[role=radio][tabindex='0']")?.focus();
  }, [checklist]);

  const passos = checklist?.passos ?? [];
  const marcados = passos.filter((p) => notas[p.id]).length;
  const completo = passos.length > 0 && marcados === passos.length;

  function focarPasso(i: number) {
    const grupo = lista.current?.querySelectorAll<HTMLElement>("[role=radiogroup]")[i];
    grupo?.querySelector<HTMLElement>("[tabindex='0']")?.focus();
  }

  async function mostrar() {
    if (fase !== "lembrando") return;
    setErro(null);
    setFase("abrindo");
    try {
      setChecklist(await abrirChecklist(questao.id));
      setFase("conferindo");
    } catch {
      setErro("Não foi possível abrir o checklist. Confira a conexão e tente de novo.");
      setFase("lembrando");
    }
  }

  function marcar(i: number, nota: Nota) {
    if (fase !== "conferindo" || !passos[i]) return;
    setNotas((n) => ({ ...n, [passos[i].id]: nota }));
    setFoco(i);
  }

  function marcarResto() {
    setNotas((n) => Object.fromEntries(passos.map((p) => [p.id, n[p.id] ?? "lembrei"])));
  }

  async function conferir() {
    if (fase !== "conferindo" || !completo) return;
    const tempoMs = Math.min(30 * 60_000, Date.now() - inicio.current);
    setErro(null);
    setAviso(null);
    setFase("enviando");
    try {
      const c = await conferirProcedimento({ questaoId: questao.id, sessaoId, notas, tempoMs });
      if (!c.ok) {
        // editado no meio: passos atuais, mantendo as notas dos passos que continuam
        setChecklist(c.checklist);
        setNotas((n) => Object.fromEntries(c.checklist.passos.flatMap((p) => (n[p.id] ? [[p.id, n[p.id]]] : []))));
        setFoco(0);
        setAviso(c.mensagem);
        setFase("conferindo");
        return;
      }
      const sequencia = c.acertou ? sequenciaAntes + 1 : 0;
      setRes({ ...c, sequencia, pontos: pontosQuestao({ acertou: c.acertou, tempoMs, fracao: c.fracao, sequenciaAtual: sequencia }) });
      setFase("conferido");
      onRespondida({ acertou: c.acertou, tempoMs, fracao: c.fracao });
    } catch {
      setErro("Não foi possível enviar a conferência. Confira a conexão e tente de novo.");
      setFase("conferindo");
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

  // Enter mostra / confere / avança; ↑/↓ mudam o passo; 1/2/3 marcam o passo e vão para o próximo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const alvo = e.target instanceof HTMLElement ? e.target : null;
      if (alvo?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === "Enter") {
        if (alvo?.closest("button, a") && !alvo.closest("[role=radio]")) return;
        e.preventDefault();
        if (fase === "lembrando") void mostrar();
        else if (fase === "conferindo") void conferir();
        else if (fase === "conferido") onProxima();
        return;
      }
      if (fase !== "conferindo") return;
      const mover = { ArrowDown: 1, ArrowUp: -1 }[e.key];
      if (mover) {
        e.preventDefault();
        const j = Math.min(passos.length - 1, Math.max(0, foco + mover));
        setFoco(j);
        focarPasso(j);
        return;
      }
      const nota = NOTAS[["1", "2", "3"].indexOf(e.key)];
      if (!nota) return;
      e.preventDefault();
      marcar(foco, nota);
      const j = Math.min(passos.length - 1, foco + 1);
      setFoco(j);
      focarPasso(j);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ←/→ trocam a opção dentro do passo (grupo de rádio)
  function onSetas(e: React.KeyboardEvent, i: number) {
    const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!passo || fase !== "conferindo") return;
    e.preventDefault();
    const atual = NOTAS.indexOf(notas[passos[i].id] ?? NOTAS[passo > 0 ? 2 : 0]);
    const k = (atual + passo + 3) % 3;
    marcar(i, NOTAS[k]);
    e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[k]?.focus();
  }

  const conferido = fase === "conferido" && res;
  const mostrarFeedback = conferido && feedback === "imediato";
  const esquecidosCriticos = new Set(res?.criticosEsquecidos);
  const travado = fase !== "conferindo";

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_480px]">
      <section aria-label="Procedimento" className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge
            variant="chip"
            style={{ backgroundColor: tintaClara(questao.cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: questao.cor }} aria-hidden />
            {questao.disciplina}
          </Badge>
          <Badge variant="chip">
            <ClipboardList aria-hidden />
            Procedimento
          </Badge>
        </div>
        <h2 id={`nome-${questao.id}`} className="font-display text-[26px] leading-tight font-extrabold wrap-break-word md:text-[32px]">
          {questao.enunciado}
        </h2>

        {!checklist ? (
          <p className="mt-4 max-w-prose text-base leading-[1.6] text-ink2 md:text-[18px]">
            Tente lembrar o passo a passo — fale em voz alta ou anote. Sem pressa.
          </p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {checklist.material.length > 0 && (
              <div className="mt-5">
                <p className={cn(ROTULO, "text-ink3")}>Material</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {checklist.material.map((m, i) => (
                    <li key={i} className="rounded-full bg-sf2 px-3 py-1 text-[14px]">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className={cn(ROTULO, "mt-6 text-ink3")}>Passos</p>
            <ol ref={lista} className="mt-2 flex flex-col gap-2.5">
              {passos.map((p, i) => {
                const nota = notas[p.id];
                const criticoEsquecido = esquecidosCriticos.has(p.id);
                return (
                  <li
                    key={p.id}
                    data-passo={p.id}
                    data-nota={nota ?? ""}
                    className={cn(
                      "flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl border-2 bg-sf p-3 transition-colors duration-200",
                      criticoEsquecido ? "border-warn bg-warn/10" : fase === "conferindo" && i === foco ? "border-ink" : "border-line",
                    )}
                  >
                    <div className="flex min-w-[220px] flex-1 items-start gap-3">
                      <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[10px] bg-sf2 font-display text-[15px] font-extrabold tabular-nums" aria-hidden>
                        {i + 1}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p id={`passo-${p.id}`} className="leading-snug">
                          <span className="sr-only">Passo {i + 1}: </span>
                          {p.texto}
                        </p>
                        {p.critico && (
                          <span className={cn("mt-1 inline-flex items-center gap-1 text-[13px] font-bold", criticoEsquecido ? "text-warn" : "text-ink2")}>
                            <TriangleAlert className="size-4" aria-hidden />
                            {criticoEsquecido ? "Crítico esquecido" : "Crítico"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      role="radiogroup"
                      aria-labelledby={`passo-${p.id}`}
                      aria-disabled={travado || undefined}
                      onKeyDown={(e) => onSetas(e, i)}
                      className="grid w-full grid-cols-3 gap-1.5 sm:w-auto"
                    >
                      {NOTAS.map((n) => {
                        const o = OPCAO[n];
                        const Icone = o.icone;
                        const marcada = nota === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={marcada}
                            aria-label={o.rotulo}
                            aria-disabled={travado || undefined}
                            tabIndex={marcada || (!nota && n === "lembrei") ? 0 : -1}
                            data-nota={n}
                            onClick={() => marcar(i, n)}
                            onFocus={() => fase === "conferindo" && setFoco(i)}
                            className={cn(
                              "flex min-h-11 items-center justify-center gap-1 rounded-xl border-2 px-2.5 text-[14px] font-bold whitespace-nowrap outline-none",
                              "transition-[background-color,border-color,color,opacity] duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                              marcada ? o.marcada : "border-line bg-sf text-ink2",
                              !marcada && !travado && "hover:bg-sf2",
                              !marcada && fase === "conferido" && "opacity-45",
                            )}
                          >
                            <Icone className="size-4" aria-hidden />
                            {o.curto}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </section>

      <aside aria-label="Conferência" className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
        <div role="status">
          {mostrarFeedback && (
            <motion.div
              data-feedback={res.acertou ? "acerto" : "erro"}
              data-fracao={res.fracao}
              className={cn("rounded-3xl border-2 p-5", res.acertou ? "border-ok bg-ok/10" : "border-warn bg-warn/10")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start gap-3">
                {res.acertou ? (
                  <CircleCheck className="mt-0.5 size-8 shrink-0 text-ok" aria-hidden />
                ) : (
                  <Lightbulb className="mt-0.5 size-7 shrink-0 text-warn" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className={cn("font-display text-[24px] leading-tight font-extrabold", res.acertou ? "text-ok" : "text-warn")}>
                    {res.acertou ? "Isso!" : res.criticosEsquecidos.length ? "Quase! Faltou um passo crítico." : "Quase!"}{" "}
                    <span className="whitespace-nowrap">{pct(res.fracao)} lembrado</span>
                  </p>
                  <p className="mt-1 font-display text-[20px] font-extrabold tabular-nums">+{res.pontos} XP</p>
                  {!res.acertou && <p className="mt-1 text-ink2">Passa com 80% e nenhum crítico esquecido. Ele volta na sua revisão.</p>}
                </div>
              </div>
              {res.criticosEsquecidos.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {passos
                    .filter((p) => esquecidosCriticos.has(p.id))
                    .map((p) => (
                      <li key={p.id} className="flex items-start gap-2 font-bold text-warn">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span className="text-ink">{p.texto}</span>
                      </li>
                    ))}
                </ul>
              )}
              {res.acertou && res.sequencia >= 3 && <SeloSequencia n={res.sequencia} reduzir={reduzir} />}
            </motion.div>
          )}
          {conferido && feedback === "final" && (
            <p className="rounded-3xl border border-line bg-sf p-5 font-bold">Conferência registrada. O resultado sai no fim.</p>
          )}
          {aviso && <p className="rounded-3xl border-2 border-warn bg-warn/10 p-4 font-bold text-warn">{aviso}</p>}
        </div>

        {mostrarFeedback && (
          <motion.div
            className="rounded-3xl border border-line bg-sf p-5"
            initial={{ opacity: 0, y: reduzir ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <p className={cn(ROTULO, "text-ink3")}>Pontos de atenção</p>
            <p className="mt-2 leading-[1.6] whitespace-pre-line">{res.pontosDeAtencao}</p>
            <p className="mt-3 text-[13px] text-ink3">
              Fonte: <span className="text-ink2">{res.fonte ?? "não informada"}</span>
            </p>
          </motion.div>
        )}

        {fase === "conferido" ? (
          <div className="flex flex-col gap-2">
            <Button ref={proxima} onClick={onProxima}>
              {ultima ? "Ver resultado" : "Próxima"}
              <ArrowRight aria-hidden />
            </Button>
            {mostrarFeedback && (
              <Button variant="ghost" onClick={trocarSinal} disabled={sinalizando} aria-pressed={sinalizada}>
                {sinalizada ? <FlagOff aria-hidden /> : <Flag aria-hidden />}
                {sinalizada ? "Sinalizado · desfazer" : "Sinalizar erro"}
              </Button>
            )}
          </div>
        ) : !checklist ? (
          <div className="flex flex-col gap-2 lg:rounded-3xl lg:border lg:border-line lg:bg-sf lg:p-5">
            <p className="font-display text-[22px] font-extrabold max-md:hidden">Sua vez</p>
            <p className="text-[13px] text-ink3 max-md:hidden [@media(hover:none)]:hidden" data-dica-teclado>
              Quando terminar de lembrar: <Kbd>Enter</Kbd>
            </p>
            <Button onClick={mostrar} disabled={fase === "abrindo"} className="md:mt-2">
              {fase === "abrindo" ? "Abrindo…" : "Mostrar checklist"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 lg:rounded-3xl lg:border lg:border-line lg:bg-sf lg:p-5">
            <p className="font-display text-[22px] font-extrabold max-md:hidden">Confira</p>
            <p className="text-ink2" aria-live="polite">
              <span className="tabular-nums">{marcados}</span> de <span className="tabular-nums">{passos.length}</span> passos marcados
            </p>
            <p className="text-[13px] text-ink3 max-md:hidden [@media(hover:none)]:hidden" data-dica-teclado>
              <Kbd>↑</Kbd>/<Kbd>↓</Kbd> passo · <Kbd>1</Kbd> lembrei · <Kbd>2</Kbd> com erro · <Kbd>3</Kbd> esqueci · <Kbd>Enter</Kbd> conferir
            </p>
            <Button onClick={conferir} disabled={!completo || fase === "enviando"} className="md:mt-2">
              {fase === "enviando" ? "Conferindo…" : "Conferir"}
            </Button>
            <Button variant="ghost" onClick={marcarResto} disabled={completo || fase === "enviando"}>
              Marcar o resto como lembrei
            </Button>
          </div>
        )}
        {erro && <p className="text-warn">{erro}</p>}
      </aside>
    </div>
  );
}
