import type { Metadata } from "next";
import { EmBreve } from "@/components/em-breve";

export const metadata: Metadata = { title: "Provas · Giro" };

export default function Page() {
  return <EmBreve titulo="Provas" sessao="16" />;
}
