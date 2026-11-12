import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Roleta · Giro" };

export default function Page() {
  return <EmBreve titulo="Roleta" sessao="07" />;
}
