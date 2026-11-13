"use client";

import { Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useMovimentoReduzido } from "@/components/movimento-reduzido";

// key={reduzir}: o interruptor do Giro é lido do localStorage depois da montagem; se ligar, remonta já no final.

/** Domínio antes → depois: cresce em 1,2 s com atraso de 0,4 s; com movimento reduzido já aparece no valor final. */
export function BarraAntesDepois({ antes, depois, cor }: { antes: number; depois: number; cor: string }) {
  const reduzir = useMovimentoReduzido();
  return (
    <div className="mt-3 h-3.5 overflow-hidden rounded-full bg-sf2" aria-hidden>
      <motion.div
        key={String(reduzir)}
        className="h-full rounded-full"
        style={{ backgroundColor: cor }}
        initial={{ width: `${reduzir ? depois : antes}%` }}
        animate={{ width: `${depois}%` }}
        transition={reduzir ? { duration: 0 } : { duration: 1.2, delay: 0.4, ease: "easeOut" }}
        data-barra-depois={Math.round(depois)}
      />
    </div>
  );
}

/** "Novo recorde!": gira para dentro aos 0,8 s; com movimento reduzido só aparece. */
export function SeloRecorde() {
  const reduzir = useMovimentoReduzido();
  return (
    <motion.p
      key={String(reduzir)}
      className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/20 px-4 py-2 font-display text-[19px] font-extrabold"
      initial={reduzir ? { opacity: 1 } : { opacity: 0, rotate: -180, scale: 0.4 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={reduzir ? { duration: 0 } : { delay: 0.8, type: "spring", stiffness: 260, damping: 16 }}
      data-selo-recorde
    >
      <Trophy className="size-5 text-gold" aria-hidden />
      Novo recorde!
    </motion.p>
  );
}
