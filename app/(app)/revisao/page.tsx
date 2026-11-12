import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Revisão do dia · Giro" };

export default function Page() {
  return <EmBreve titulo="Revisão do dia" sessao="10" />;
}
