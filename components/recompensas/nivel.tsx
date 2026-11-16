"use client";

import { ChevronsUp } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMovimentoReduzido } from "@/components/movimento-reduzido";
import { nivel } from "@/lib/domain/nivel";

const numero = new Intl.NumberFormat("pt-BR");
const pct = (n: ReturnType<typeof nivel>) => `${(100 * n.xpNoNivel) / n.xpDoNivel}%`;

/**
 * Nível no resultado: barra do antes ao depois e, se subiu, o selo. Subindo, a barra enche, volta a zero
 * e anda até o novo valor. Com movimento reduzido já aparece no final.
 */
export function CardNivel({ antes, depois }: { antes: number; depois: number }) {
  const reduzir = useMovimentoReduzido();
  const a = nivel(antes);
  const d = nivel(depois);
  const subiu = d.nivel > a.nivel;
  const width = reduzir ? pct(d) : subiu ? [pct(a), "100%", "0%", pct(d)] : [pct(a), pct(d)];

  return (
    <section aria-labelledby="nivel-titulo" className="rounded-3xl border border-line bg-sf p-5 md:p-6" data-nivel={d.nivel}>
      {subiu && (
        <motion.p
          key={`selo-${reduzir}`}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/20 px-4 py-2 font-display text-[19px] font-extrabold"
          initial={reduzir ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.6 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={reduzir ? { duration: 0 } : { delay: 1.2, type: "spring", stiffness: 260, damping: 14 }}
          data-selo-nivel
        >
          <ChevronsUp className="size-5 text-gold" aria-hidden />
          Subiu para o nível {d.nivel}!
        </motion.p>
      )}
      <h2 id="nivel-titulo" className="text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase">
        Nível
      </h2>
      <p className="mt-2 font-display text-[24px] font-extrabold">
        <span className="tabular-nums">{d.nivel}</span> · {d.titulo}
        {subiu && d.titulo !== a.titulo && <span className="ml-2 align-middle text-[15px] font-bold text-ink2">título novo</span>}
      </p>
      <div className="mt-3 h-3.5 overflow-hidden rounded-full bg-sf2" aria-hidden>
        <motion.div
          key={String(reduzir)}
          className="h-full rounded-full bg-gold"
          initial={{ width: reduzir ? pct(d) : pct(a) }}
          animate={{ width }}
          transition={reduzir ? { duration: 0 } : { duration: subiu ? 1.6 : 1.2, delay: 0.4, ease: "easeOut", times: subiu ? [0, 0.45, 0.46, 1] : undefined }}
        />
      </div>
      <p className="mt-2 text-[14px] text-ink2">
        <span className="tabular-nums">+{numero.format(depois - antes)}</span> XP nesta sessão · faltam{" "}
        <span className="tabular-nums">{numero.format(d.xpDoNivel - d.xpNoNivel)}</span> para o nível {d.nivel + 1}.{" "}
        <Link href="/recompensas" className="font-bold text-ink underline underline-offset-2">
          Ver recompensas
        </Link>
      </p>
    </section>
  );
}
