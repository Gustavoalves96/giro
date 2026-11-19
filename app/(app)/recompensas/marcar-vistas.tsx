"use client";

import { useEffect } from "react";
import { marcarRecompensasVistas } from "./actions";

// Só renderiza quando há novidade: ao abrir a página, marca como visto (some a bolinha da navegação).
export function MarcarVistas() {
  useEffect(() => {
    marcarRecompensasVistas().catch(() => {}); // falhou: a bolinha fica até a próxima visita
  }, []);
  return null;
}
