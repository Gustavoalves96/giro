import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Estudo · Giro" };

// Placeholder: a sessão 09 cria a sessão e leva para /roleta/sessao/[id]/estudo.
export default function Page() {
  return <EmBreve titulo="Sessão de estudo" sessao="09" />;
}
