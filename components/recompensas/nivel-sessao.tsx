import { xpAte } from "@/lib/db/inicio";
import { CardNivel } from "./nivel";

/** Card do nível de uma sessão finalizada: o antes é o total até ela menos os pontos dela. */
export async function NivelDaSessao({ conta, pontuacao, finalizadaEm }: { conta: string; pontuacao: number; finalizadaEm: Date }) {
  const depois = await xpAte(conta, finalizadaEm);
  return <CardNivel antes={depois - pontuacao} depois={depois} />;
}
