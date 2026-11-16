import { Check, Lock, Trophy } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { DiscoMedalha } from "@/components/recompensas/medalha";
import { dono } from "@/lib/auth/require-user";
import { medalhasDaConta, verificarConquistas } from "@/lib/db/conquistas";
import { resumoSessoes } from "@/lib/db/inicio";
import { MEDALHAS } from "@/lib/domain/conquistas";
import { nivel, TITULOS, xpParaNivel } from "@/lib/domain/nivel";
import { xpTotal } from "@/lib/domain/stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Recompensas · Giro" };

const CARD = "rounded-3xl border border-line bg-sf p-5 md:p-6";
const ROTULO = "text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase";
const numero = new Intl.NumberFormat("pt-BR");
const dataCurta = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "2-digit" });

// Sem nenhuma medalha gravada, confere o histórico (quem já estudava antes das medalhas ganha as dela aqui,
// sem comemoração). Com alguma, quem grava é o fim de cada sessão.
async function medalhas(conta: string) {
  const gravadas = await medalhasDaConta(conta);
  if (gravadas.length) return gravadas;
  return (await verificarConquistas(conta, null)).length ? medalhasDaConta(conta) : [];
}

// auth() e banco são da requisição: tudo dentro de <Suspense> (Cache Components).
async function Conteudo() {
  const conta = await dono();
  await connection();
  const [sessoes, gravadas] = await Promise.all([resumoSessoes(conta), medalhas(conta)]);
  const xp = xpTotal(sessoes);
  const ganhas = new Map(gravadas.map((g) => [g.medalha, g.em]));
  const n = nivel(xp);
  const pct = (100 * n.xpNoNivel) / n.xpDoNivel;

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <section aria-labelledby="nivel-titulo" className={CARD} data-nivel={n.nivel} data-xp={xp}>
        <h2 id="nivel-titulo" className={ROTULO}>
          Seu nível
        </h2>
        <p className="mt-2 flex items-center gap-3 font-display text-[40px] leading-none font-extrabold md:text-[48px]">
          <Trophy className="size-9 shrink-0 text-gold" aria-hidden />
          <span className="tabular-nums">{n.nivel}</span>
        </p>
        <p className="mt-2 font-display text-[22px] font-extrabold">{n.titulo}</p>
        <div className="mt-4 h-3.5 overflow-hidden rounded-full bg-sf2" aria-hidden>
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-ink2">
          <span className="tabular-nums">{numero.format(n.xpNoNivel)}</span> de{" "}
          <span className="tabular-nums">{numero.format(n.xpDoNivel)}</span> XP · faltam{" "}
          <span className="tabular-nums">{numero.format(n.xpDoNivel - n.xpNoNivel)}</span> para o nível {n.nivel + 1}.
        </p>
        <p className="mt-4 text-ink2">
          Todo XP de sessão finalizada conta (<span className="tabular-nums">{numero.format(xp)}</span> no total). Cada nível pede
          um pouco mais que o anterior.
        </p>
      </section>

      <section aria-labelledby="titulos-titulo" className={CARD}>
        <h2 id="titulos-titulo" className={ROTULO}>
          Títulos
        </h2>
        <ol className="mt-3 flex flex-col divide-y divide-line">
          {TITULOS.map((t) => {
            const tem = n.nivel >= t.nivel;
            const atual = n.titulo === t.titulo;
            return (
              <li key={t.titulo} className="flex items-center gap-3 py-3" data-alcancado={tem}>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    tem ? "bg-gold/20 text-ink" : "bg-sf2 text-ink3",
                  )}
                >
                  {tem ? <Check className="size-5" aria-hidden /> : <Lock className="size-4" aria-hidden />}
                  <span className="sr-only">{tem ? "Alcançado" : "Bloqueado"}</span>
                </span>
                <span className={cn("min-w-0 flex-1 font-bold wrap-break-word", !tem && "text-ink2")}>
                  {t.titulo}
                  {atual && <span className="ml-2 text-[14px] font-bold text-ink2">· atual</span>}
                </span>
                <span className="shrink-0 text-right text-[14px] text-ink2 tabular-nums">
                  nível {t.nivel}
                  <span className="block text-ink3">{numero.format(xpParaNivel(t.nivel))} XP</span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="medalhas-titulo" className={cn(CARD, "lg:col-span-2")} data-medalhas={ganhas.size}>
        <h2 id="medalhas-titulo" className={ROTULO}>
          Medalhas · <span className="tabular-nums">{ganhas.size}</span> de <span className="tabular-nums">{MEDALHAS.length}</span>
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MEDALHAS.map((m) => {
            const em = ganhas.get(m.id);
            return (
              <li key={m.id} className="flex items-center gap-3" data-medalha={m.id} data-ganha={Boolean(em)}>
                <DiscoMedalha id={m.id} ganha={Boolean(em)} />
                <span className="min-w-0">
                  <span className={cn("block font-bold wrap-break-word", !em && "text-ink2")}>
                    {m.nome}
                    <span className="sr-only">{em ? " (ganha)" : " (bloqueada)"}</span>
                  </span>
                  <span className="block text-[14px] text-ink2">{em ? `Ganha em ${dataCurta.format(em)}` : m.comoGanhar}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <h1 className="mb-6 font-display text-[28px] leading-tight font-extrabold md:text-[34px]">Recompensas</h1>
      <Suspense fallback={<div className="h-[60vh] animate-pulse rounded-3xl border border-line bg-sf" aria-busy="true" />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}
