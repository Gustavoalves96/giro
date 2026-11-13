"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Interruptor do painel da roleta, guardado neste navegador; soma com o prefers-reduced-motion.
export const CHAVE_REDUZIR = "giro:movimento-reduzido";

export function lerReduzirPainel() {
  try {
    return localStorage.getItem(CHAVE_REDUZIR) === "1";
  } catch {
    return false;
  }
}

/** true se o sistema pede menos movimento ou se o interruptor do Giro está ligado. */
export function useMovimentoReduzido() {
  const sistema = useReducedMotion() === true;
  const [painel, setPainel] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no cliente
    setPainel(lerReduzirPainel());
  }, []);
  return sistema || painel;
}
