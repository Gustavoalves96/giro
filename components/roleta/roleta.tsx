"use client";

import { ExternalLink, Play, RotateCw, SlidersHorizontal } from "lucide-react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { girar, type ResultadoGiro } from "@/app/(app)/roleta/actions";
import { BarraDominio } from "@/components/barra-dominio";
import { CHAVE_REDUZIR, lerReduzirPainel } from "@/components/movimento-reduzido";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { anguloFinal, fatiaSobPonteiro, montarFatias, motivoVazio, type Candidato, type Fatia, type Modo } from "@/lib/domain/roleta";
import { cn } from "@/lib/utils";
import { Roda } from "./roda";

type Estado = "antes" | "girando" | "sorteado";

const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Roleta({ candidatos }: { candidatos: Candidato[] }) {
  const disciplinas = useMemo(() => {
    const m = new Map<string, { id: string; nome: string; cor: string; topicos: number }>();
    for (const c of candidatos) {
      const d = m.get(c.disciplinaId) ?? { id: c.disciplinaId, nome: c.disciplina, cor: c.cor, topicos: 0 };
      d.topicos++;
      m.set(d.id, d);
    }
    return [...m.values()];
  }, [candidatos]);

  const [modo, setModo] = useState<Modo>("inteligente");
  const [desligadas, setDesligadas] = useState<string[]>([]);
  const [estado, setEstado] = useState<Estado>("antes");
  const [giro, setGiro] = useState<ResultadoGiro | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [destaque, setDestaque] = useState<number | null>(null);
  const [sob, setSob] = useState(0);

  // Interruptor do painel, guardado neste navegador; soma com o prefers-reduced-motion.
  const [reduzirPainel, setReduzirPainel] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no cliente
    setReduzirPainel(lerReduzirPainel());
  }, []);
  const reduzir = useReducedMotion() === true || reduzirPainel;
  function trocarReduzir() {
    const v = !reduzirPainel;
    setReduzirPainel(v);
    try {
      localStorage.setItem(CHAVE_REDUZIR, v ? "1" : "0");
    } catch {}
  }

  const ligadas = disciplinas.filter((d) => !desligadas.includes(d.id)).map((d) => d.id);
  const locais = montarFatias(candidatos, modo, { disciplinaIds: ligadas });
  const fatias = giro?.fatias.length ? giro.fatias : locais;

  const rot = useMotionValue(0);
  const ponteiro = useMotionValue(0);
  const fatiasGirando = useRef<Fatia[] | null>(null);
  const ultimaSob = useRef(-1);
  const ultimoTic = useRef(0);

  useMotionValueEvent(rot, "change", (v) => {
    const fs = fatiasGirando.current;
    if (!fs) return;
    const i = fatiaSobPonteiro(v, fs);
    if (i === ultimaSob.current) return;
    ultimaSob.current = i;
    setSob(i);
    const agora = performance.now();
    if (!reduzir && agora - ultimoTic.current >= 50) {
      // tic: no máximo 20 por segundo
      ultimoTic.current = agora;
      ponteiro.set(-18);
      animate(ponteiro, 0, { type: "spring", stiffness: 700, damping: 18 });
    }
  });

  function voltarAosFiltros() {
    setGiro(null);
    setDestaque(null);
    setEstado("antes");
  }

  async function girarRoleta() {
    if (estado === "girando" || !locais.length) return;
    setErro(null);
    setDestaque(null);
    setEstado("girando");
    let r: ResultadoGiro;
    try {
      r = await girar({ modo, disciplinaIds: ligadas });
    } catch {
      setErro("Não foi possível girar agora. Tente de novo.");
      setEstado(giro ? "sorteado" : "antes");
      return;
    }
    if (!r.sorteadoId) {
      setErro(r.motivo);
      voltarAosFiltros();
      return;
    }
    const idx = r.fatias.findIndex((f) => f.topicoId === r.sorteadoId);
    const alvo = anguloFinal(rot.get(), r.fatias, idx);
    fatiasGirando.current = r.fatias;
    ultimaSob.current = fatiaSobPonteiro(rot.get(), r.fatias);
    setSob(ultimaSob.current);
    setGiro(r);

    if (reduzir) {
      // sem giro: as fatias acendem em 6 passos de 80 ms e a roda já aparece parada no sorteado
      for (let p = 0; p < 6; p++) {
        setDestaque(p === 5 ? idx : Math.floor(Math.random() * r.fatias.length));
        await esperar(80);
      }
      rot.set(alvo);
    } else {
      // antecipação −8°, desaceleração longa, passa 2° e volta em mola (~4,6 s no total)
      await animate(rot, rot.get() - 8, { duration: 0.12, ease: "easeOut" });
      await animate(rot, alvo + 2, { duration: 4.2, ease: [0.15, 0.75, 0.18, 1] });
      await animate(rot, alvo, { type: "spring", stiffness: 260, damping: 20 });
    }
    fatiasGirando.current = null;
    setDestaque(idx);
    setEstado("sorteado");
  }

  const girando = estado === "girando";
  const visor = fatias[girando ? sob : fatiaSobPonteiro(rot.get(), fatias)];
  const sorteado = estado === "sorteado" ? giro?.fatias.find((f) => f.topicoId === giro.sorteadoId) : undefined;
  const vazia = !fatias.length;

  return (
    <div className="flex flex-col items-center gap-8 lg:grid lg:grid-cols-[500px_340px] lg:items-start lg:justify-center lg:gap-10 xl:grid-cols-[580px_400px] xl:gap-12">
      <div className="flex w-[300px] flex-col items-center gap-4 md:w-[540px] lg:w-[500px] xl:w-[580px]">
        {/* Visor: o tópico sob o ponteiro (resolve a leitura com muitas fatias e no celular) */}
        <div
          aria-live="polite"
          aria-busy={girando}
          data-topico-id={vazia ? undefined : visor?.topicoId}
          className="flex h-[68px] w-full items-center gap-3 rounded-[18px] border border-line bg-sf px-4"
        >
          {vazia || !visor ? (
            <p className="text-ink3">Sem fatias para girar.</p>
          ) : (
            <>
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: visor.cor }} aria-hidden />
              <div className="min-w-0">
                <p className="truncate font-display text-[20px] leading-tight font-extrabold">{visor.nome}</p>
                <p className="truncate text-[13px] text-ink3">{visor.disciplina}</p>
              </div>
            </>
          )}
        </div>

        <div className="relative size-[300px] md:size-[540px] lg:size-[500px] xl:size-[580px]" data-sorteado={sorteado?.topicoId}>
          {vazia ? (
            <div className="flex size-full flex-col items-center justify-center gap-4 rounded-full border-2 border-dashed border-line p-10 text-center">
              <p className="max-w-xs text-ink2">{motivoVazio(candidatos.length)}</p>
              {candidatos.length === 0 && (
                <Button asChild>
                  <Link href="/disciplinas">Criar questões</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <motion.div className="size-full" style={{ rotate: rot }} data-roda>
                <Roda fatias={fatias} destaque={destaque} borrado={girando && !reduzir} />
              </motion.div>
              {/* ponteiro dourado no topo */}
              <motion.div
                className="absolute -top-2 left-1/2 -ml-3.5 h-7 w-7 origin-top"
                style={{ rotate: ponteiro }}
                aria-hidden
              >
                <svg viewBox="0 0 28 28" className="size-full drop-shadow">
                  <path d="M3 2 H25 L14 26 Z" fill="var(--gold)" stroke="var(--sf)" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </motion.div>
              <motion.button
                type="button"
                onClick={girarRoleta}
                disabled={girando}
                aria-label="Girar a roleta"
                className="absolute top-1/2 left-1/2 -mt-8 -ml-8 flex size-16 items-center justify-center rounded-full border-4 border-sf bg-ac text-on-ac shadow-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-90 md:-mt-11 md:-ml-11 md:size-22"
                animate={sorteado && !reduzir ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={{ duration: 0.45 }}
              >
                <RotateCw className="size-7 md:size-9" aria-hidden />
              </motion.button>
              {sorteado && !reduzir && <Confete cores={[...new Set(fatias.map((f) => f.cor))]} chave={giro!.sorteadoId!} />}
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-[540px] lg:max-w-none">
        {sorteado && giro ? (
          <motion.section
            key={giro.sorteadoId}
            aria-labelledby="sorteado-titulo"
            className="rounded-3xl border border-line bg-sf p-5 shadow-sm md:p-6"
            initial={reduzir ? { opacity: 0 } : { opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduzir ? { duration: 0.2 } : { type: "spring", duration: 0.5, bounce: 0.3 }}
          >
            <p className={ROTULO}>Sorteado</p>
            <h2 id="sorteado-titulo" className="mt-1 font-display text-[28px] leading-tight font-extrabold wrap-break-word">
              {sorteado.nome}
            </h2>
            <Badge variant="chip" className="mt-2" style={{ backgroundColor: tintaClara(sorteado.cor), color: TEXTO_SOBRE_TINTA, borderColor: "transparent" }}>
              <span className="size-2.5 rounded-full" style={{ backgroundColor: sorteado.cor }} aria-hidden />
              {sorteado.disciplina}
            </Badge>
            <div className="mt-4">
              <p className="text-ink3">
                Domínio{" "}
                <span className="font-bold text-ink2 tabular-nums">{sorteado.novo ? "novo" : `${Math.round(sorteado.dominio)}%`}</span>
              </p>
              {!sorteado.novo && <BarraDominio valor={Math.round(sorteado.dominio)} cor={sorteado.cor} className="mt-2" />}
            </div>
            <div className="mt-4 rounded-2xl bg-sf2 p-4">
              <p className="font-bold">Por que ele?</p>
              <p className="mt-1 text-ink2">{giro.motivo}</p>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Button asChild variant="destaque">
                <Link href={`/roleta/estudar/${sorteado.topicoId}`}>
                  <Play aria-hidden />
                  Começar estudo · 10 min
                </Link>
              </Button>
              <Button variant="secondary" onClick={girarRoleta} disabled={girando}>
                <RotateCw aria-hidden />
                Girar de novo
              </Button>
              {sorteado.notebooklmUrl && (
                <Button asChild variant="ghost">
                  <a href={sorteado.notebooklmUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink aria-hidden />
                    Abrir no NotebookLM
                  </a>
                </Button>
              )}
              <Button variant="ghost" onClick={voltarAosFiltros}>
                <SlidersHorizontal aria-hidden />
                Ajustar filtros
              </Button>
            </div>
          </motion.section>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <p className={ROTULO} id="modo-rotulo">
                Modo
              </p>
              <div role="group" aria-labelledby="modo-rotulo" className="mt-2 grid grid-cols-2 gap-1 rounded-[14px] bg-sf2 p-1">
                {(
                  [
                    ["inteligente", "Inteligente"],
                    ["sorte", "Sorte pura"],
                  ] as const
                ).map(([m, rotulo]) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={modo === m}
                    disabled={girando}
                    onClick={() => setModo(m)}
                    className={cn(
                      "h-11 rounded-[10px] font-bold text-ink2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      modo === m && "bg-sf text-ink shadow-sm",
                    )}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-ink3">
                {modo === "inteligente"
                  ? "Pontos fracos e tópicos nunca estudados ganham fatias maiores."
                  : "Todos os tópicos com a mesma chance."}
              </p>
            </div>

            {disciplinas.length > 0 && (
              // celular: filtros de disciplina ocultos
              <div className="max-md:hidden">
                <p className={ROTULO} id="disc-rotulo">
                  Disciplinas
                </p>
                <ul aria-labelledby="disc-rotulo" className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-1">
                  {disciplinas.map((d) => {
                    const ligada = !desligadas.includes(d.id);
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={ligada}
                          disabled={girando}
                          onClick={() => setDesligadas((ds) => (ligada ? [...ds, d.id] : ds.filter((x) => x !== d.id)))}
                          className={cn(
                            "flex min-h-11 w-full items-center gap-3 rounded-[14px] border px-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            ligada ? "border-line bg-sf" : "border-dashed border-ink3/60 text-ink3",
                          )}
                        >
                          <span
                            className="size-4 shrink-0 rounded-[5px] border-2"
                            style={{ borderColor: d.cor, backgroundColor: ligada ? d.cor : "transparent" }}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate font-bold">{d.nome}</span>
                          <span className="text-[13px] text-ink3 tabular-nums" aria-label={`${d.topicos} tópicos`}>
                            {d.topicos}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <button
              type="button"
              role="switch"
              aria-checked={reduzirPainel}
              onClick={trocarReduzir}
              className="flex min-h-11 items-center justify-between gap-4 rounded-[14px] text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span>
                <span className="block font-bold">Movimento reduzido</span>
                <span className="block text-[13px] text-ink3">Sem giro: as fatias acendem e o resultado aparece.</span>
              </span>
              <span
                className={cn("flex h-7 w-[46px] shrink-0 items-center rounded-full p-0.5 transition-colors", reduzirPainel ? "bg-ink" : "bg-sf2 ring-1 ring-line")}
                aria-hidden
              >
                <span className={cn("size-6 rounded-full bg-sf shadow transition-transform", reduzirPainel && "translate-x-[18px]")} />
              </span>
            </button>

            {erro && (
              <p role="status" className="rounded-2xl border border-warn/40 p-3 text-warn">
                {erro}
              </p>
            )}

            <Button variant="destaque" onClick={girarRoleta} disabled={girando || vazia} className="w-full">
              <RotateCw aria-hidden />
              {girando ? "Girando…" : "Girar a roleta"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** 16 confetes saindo do aro em 900 ms. */
function Confete({ cores, chave }: { cores: string[]; chave: string }) {
  const paleta = ["var(--ac)", "var(--gold)", ...cores];
  return (
    <div key={chave} className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * 2 * Math.PI;
        const [x, y] = [Math.sin(a), -Math.cos(a)];
        return (
          <motion.span
            key={i}
            className="absolute size-2.5 rounded-[3px]"
            style={{ backgroundColor: paleta[i % paleta.length], marginLeft: -5, marginTop: -5 }}
            initial={{ left: `${50 + 48 * x}%`, top: `${50 + 48 * y}%`, opacity: 1, rotate: 0 }}
            animate={{ left: `${50 + 62 * x}%`, top: `${50 + 62 * y + 6}%`, opacity: 0, rotate: 200 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
