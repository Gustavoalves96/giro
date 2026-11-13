import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Estatísticas · Giro" };

export default function Page() {
  return <EmBreve titulo="Estatísticas" sessao="15" />;
}
