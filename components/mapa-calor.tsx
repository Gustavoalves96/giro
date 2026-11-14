import type { DiaMapa } from "@/lib/domain/stats";

const dataCurta = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", day: "numeric", month: "short" });
const curta = (dia: string) => dataCurta.format(new Date(`${dia}T12:00:00Z`));
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Intensidade pela quantidade de questões no dia (Menta sobre o trilho).
const NIVEIS = [1, 5, 10, 20];
function fundo(n: number) {
  const nivel = NIVEIS.filter((l) => n >= l).length;
  return nivel ? `color-mix(in srgb, var(--ok) ${[0, 30, 55, 80, 100][nivel]}%, var(--sf2))` : "var(--sf2)";
}

/** Mapa de calor (colunas = semanas, domingo no topo) com a descrição em texto para quem não vê as cores. */
export function MapaCalor({ semanas }: { semanas: DiaMapa[][] }) {
  const dias = semanas.flat().filter((d) => !d.futuro);
  const total = dias.reduce((t, d) => t + d.n, 0);
  const ativos = dias.filter((d) => d.n > 0);
  const melhor = ativos.reduce<DiaMapa | null>((m, d) => (!m || d.n > m.n ? d : m), null);
  const descricao = total
    ? `${plural(total, "questão respondida", "questões respondidas")} em ${plural(ativos.length, "dia", "dias")} nas últimas ${semanas.length} semanas` +
      (melhor ? `; dia mais forte: ${curta(melhor.dia)}, com ${melhor.n}.` : ".")
    : `Nenhuma questão respondida nas últimas ${semanas.length} semanas.`;

  return (
    <figure>
      <div
        role="img"
        aria-label={descricao}
        data-mapa-total={total}
        className="grid max-w-[560px] grid-flow-col grid-rows-7 gap-1"
        style={{ gridTemplateColumns: `repeat(${semanas.length}, minmax(0, 1fr))` }}
      >
        {semanas.flat().map((d) => (
          <div
            key={d.dia}
            data-dia={d.dia}
            data-n={d.futuro ? undefined : d.n}
            title={d.futuro ? undefined : `${curta(d.dia)}: ${plural(d.n, "questão", "questões")}`}
            className="aspect-square rounded-[3px]"
            style={{ background: d.futuro ? "transparent" : fundo(d.n) }}
          />
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px] text-ink3">
        <span>{descricao}</span>
        <span className="flex items-center gap-1" aria-hidden>
          menos
          {[0, ...NIVEIS].map((n) => (
            <span key={n} className="size-3 rounded-[3px]" style={{ background: fundo(n) }} />
          ))}
          mais
        </span>
      </figcaption>
    </figure>
  );
}
