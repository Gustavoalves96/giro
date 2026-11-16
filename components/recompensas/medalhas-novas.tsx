"use client";

import { motion } from "motion/react";
import { useMovimentoReduzido } from "@/components/movimento-reduzido";
import { medalhaPorId } from "@/lib/domain/conquistas";
import { DiscoMedalha } from "./medalha";

/** Medalhas ganhas nesta sessão: entram uma a uma depois do selo de nível. Com movimento reduzido só aparecem. */
export function MedalhasNovas({ ids }: { ids: string[] }) {
  const reduzir = useMovimentoReduzido();
  const medalhas = ids.flatMap((id) => medalhaPorId(id) ?? []);
  if (!medalhas.length) return null;
  return (
    <section aria-labelledby="medalhas-titulo" className="rounded-3xl border border-gold/60 bg-sf p-5 md:p-6" data-medalhas-novas={medalhas.length}>
      <h2 id="medalhas-titulo" className="text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase">
        {medalhas.length === 1 ? "Nova medalha!" : `${medalhas.length} novas medalhas!`}
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {medalhas.map((m, i) => (
          <motion.li
            key={`${m.id}-${reduzir}`}
            className="flex items-center gap-3"
            initial={reduzir ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduzir ? { duration: 0 } : { delay: 1.6 + 0.25 * i, type: "spring", stiffness: 260, damping: 14 }}
          >
            <DiscoMedalha id={m.id} ganha />
            <span className="min-w-0">
              <span className="block font-display text-[19px] font-extrabold">{m.nome}</span>
              <span className="block text-[14px] text-ink2">{m.comoGanhar}</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
