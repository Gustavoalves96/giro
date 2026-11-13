import { useId } from "react";
import { TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { limitesFatias, type Fatia } from "@/lib/domain/roleta";

// Coordenadas: viewBox de −100 a 100, ângulo em graus no sentido horário a partir do topo.
const R_FATIA = 91;
const R_ARO = 95.5; // aro externo na cor cheia (traço de 7)

function ponto(a: number, r: number) {
  const rad = (a * Math.PI) / 180;
  return `${(r * Math.sin(rad)).toFixed(3)} ${(-r * Math.cos(rad)).toFixed(3)}`;
}

function arco(a0: number, a1: number, r: number) {
  return `A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${ponto(a1, r)}`;
}

const curto = (s: string) => (s.length > 20 ? s.slice(0, 19) + "…" : s);

/** Roda em SVG: fatias proporcionais ao peso, em tinta clara, e aro na cor cheia agrupando disciplinas. */
export function Roda({ fatias, destaque, borrado }: { fatias: Fatia[]; destaque: number | null; borrado: boolean }) {
  const filtro = useId();
  const lim = limitesFatias(fatias);

  // Grupos contíguos da mesma disciplina para o aro.
  const grupos: { cor: string; inicio: number; fim: number }[] = [];
  fatias.forEach((f, i) => {
    const ult = grupos.at(-1);
    if (ult && fatias[i - 1].disciplinaId === f.disciplinaId) ult.fim = lim[i].fim;
    else grupos.push({ cor: f.cor, inicio: lim[i].inicio, fim: lim[i].fim });
  });

  return (
    <svg viewBox="-100 -100 200 200" className="size-full" aria-hidden>
      <defs>
        <filter id={filtro}>
          <feGaussianBlur stdDeviation="1.3" />
        </filter>
      </defs>
      {fatias.map((f, i) => {
        const { inicio, fim } = lim[i];
        const estilo = {
          fill: tintaClara(f.cor),
          opacity: destaque === null || destaque === i ? 1 : 0.4,
          transition: "opacity 200ms",
        };
        return fatias.length === 1 ? (
          <circle key={f.topicoId} r={R_FATIA} style={estilo} />
        ) : (
          <path
            key={f.topicoId}
            d={`M 0 0 L ${ponto(inicio, R_FATIA)} ${arco(inicio, fim, R_FATIA)} Z`}
            style={estilo}
            stroke="var(--sf)"
            strokeWidth={0.6}
          />
        );
      })}
      {grupos.map((g, i) =>
        g.fim - g.inicio >= 359.999 ? (
          <circle key={i} r={R_ARO} fill="none" stroke={g.cor} strokeWidth={7} />
        ) : (
          <path key={i} d={`M ${ponto(g.inicio, R_ARO)} ${arco(g.inicio, g.fim, R_ARO)}`} fill="none" stroke={g.cor} strokeWidth={7} />
        ),
      )}
      {/* celular: sem nomes nas fatias, só o visor */}
      <g className="max-md:hidden" filter={borrado ? `url(#${filtro})` : undefined}>
        {fatias.map((f, i) => {
          const { inicio, fim } = lim[i];
          if (fim - inicio < 7) return null; // fatia fina demais para o nome
          const meio = (inicio + fim) / 2;
          const esquerda = meio > 180; // vira o texto para não ficar de cabeça para baixo
          return (
            <text
              key={f.topicoId}
              transform={`rotate(${esquerda ? meio + 90 : meio - 90})`}
              x={esquerda ? -86 : 86}
              y={2}
              textAnchor={esquerda ? "start" : "end"}
              fill={TEXTO_SOBRE_TINTA}
              opacity={destaque === null || destaque === i ? 1 : 0.4}
              className="font-display text-[6.2px] font-bold"
            >
              {curto(f.nome)}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
