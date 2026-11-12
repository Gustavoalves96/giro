import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Disciplinas · Giro" };

export default function Page() {
  return <EmBreve titulo="Disciplinas" sessao="04" />;
}
