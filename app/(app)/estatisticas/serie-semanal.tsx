// Gráfico de uma série por semana, em SVG à mão. Uma série por gráfico (nada de dois eixos): a evolução
// semanal empilha três destes alinhados pelas mesmas colunas. Os valores ficam em texto embaixo.

const L = 640;
const A = 120;
const TOPO = 8;

type Props = {
  id: string;
  titulo: string;
  descricao: string;
  semanas: string[]; // rótulo de cada coluna, para o <title> de cada marca
  valores: (number | null)[]; // null = sem dado (linha interrompe, barra some)
  texto: (v: number | null) => string;
  tipo: "barras" | "linha";
  max?: number;
};

export function SerieSemanal({ id, titulo, descricao, semanas, valores, texto, tipo, max }: Props) {
  const topo = max ?? Math.max(1, ...valores.map((v) => v ?? 0));
  const col = L / valores.length;
  const x = (i: number) => col * i + col / 2;
  const y = (v: number) => A - (v / topo) * (A - TOPO);
  // trechos contínuos da linha (semana sem resposta interrompe)
  const trechos: { i: number; v: number }[][] = [];
  valores.forEach((v, i) => {
    if (v === null) return;
    const ultimo = trechos.at(-1);
    if (ultimo && ultimo.at(-1)!.i === i - 1) ultimo.push({ i, v });
    else trechos.push([{ i, v }]);
  });

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-bold">{titulo}</span>
        <span className="text-[13px] text-ink3 tabular-nums">{max ? `escala 0–${max}` : `máx. ${topo}`}</span>
      </figcaption>
      {/* altura fixa e escala esticada (none): traços com non-scaling-stroke, pontos como traço de comprimento zero */}
      <svg
        viewBox={`0 0 ${L} ${A}`}
        preserveAspectRatio="none"
        className="block h-24 w-full overflow-visible md:h-28"
        role="img"
        aria-labelledby={`${id}-t ${id}-d`}
      >
        <title id={`${id}-t`}>{titulo}</title>
        <desc id={`${id}-d`}>{descricao}</desc>
        {max && <line x1={0} x2={L} y1={y(max / 2)} y2={y(max / 2)} stroke="var(--line)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
        <line x1={0} x2={L} y1={A} y2={A} stroke="var(--line)" vectorEffect="non-scaling-stroke" />
        {tipo === "barras" &&
          valores.map((v, i) => {
            if (!v) return null;
            const h = A - y(v);
            const r = Math.min(4, h);
            const x0 = x(i) - 18;
            return (
              <path
                key={i}
                d={`M${x0},${A} V${A - h + r} q0,-${r} ${r},-${r} H${x0 + 36 - r} q${r},0 ${r},${r} V${A} Z`}
                fill="var(--ac)"
              >
                <title>{`${semanas[i]}: ${texto(v)}`}</title>
              </path>
            );
          })}
        {tipo === "linha" &&
          trechos.map((t) => (
            <g key={t[0].i}>
              {t.length > 1 && (
                <polyline
                  points={t.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
                  fill="none"
                  stroke="var(--ac)"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {t.map((p) => (
                <g key={p.i}>
                  <path d={`M${x(p.i)},${y(p.v)} h0`} stroke="var(--sf)" strokeWidth={14} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <path d={`M${x(p.i)},${y(p.v)} h0`} stroke="var(--ac)" strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke">
                    <title>{`${semanas[p.i]}: ${texto(p.v)}`}</title>
                  </path>
                </g>
              ))}
            </g>
          ))}
      </svg>
      <ol className="grid text-center text-[12px] text-ink2 tabular-nums" style={{ gridTemplateColumns: `repeat(${valores.length}, minmax(0, 1fr))` }}>
        {valores.map((v, i) => (
          <li key={i}>
            <span className="sr-only">{semanas[i]}: </span>
            {v === null ? "–" : texto(v)}
          </li>
        ))}
      </ol>
    </figure>
  );
}
