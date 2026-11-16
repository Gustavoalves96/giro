import { medalhasDaSessao } from "@/lib/db/conquistas";
import { xpAte } from "@/lib/db/inicio";
import { MedalhasNovas } from "./medalhas-novas";
import { CardNivel } from "./nivel";

/** Recompensas de uma sessão finalizada: o nível (antes = total até ela − pontos dela) e as medalhas que ela deu. */
export async function RecompensasDaSessao({ conta, id, pontuacao, finalizadaEm }: { conta: string; id: string; pontuacao: number; finalizadaEm: Date }) {
  const [depois, medalhas] = await Promise.all([xpAte(conta, finalizadaEm), medalhasDaSessao(conta, id)]);
  return (
    <>
      <MedalhasNovas ids={medalhas} />
      <CardNivel antes={depois - pontuacao} depois={depois} />
    </>
  );
}
