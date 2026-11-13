// Página temporária de referência visual. Apagar na sessão 19.
import { Flame, Play, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";

const tokens = [
  ["bg", "Fundo da tela", "bg-bg"],
  ["sf", "Superfície de cards", "bg-sf"],
  ["sf2", "Superfície secundária", "bg-sf2"],
  ["ink", "Texto principal", "bg-ink"],
  ["ink2", "Texto secundário", "bg-ink2"],
  ["ink3", "Legendas", "bg-ink3"],
  ["line", "Bordas", "bg-line"],
  ["ac", "Brasa", "bg-ac"],
  ["acink", "Links e destaque", "bg-acink"],
  ["ok", "Menta (acerto)", "bg-ok"],
  ["warn", "Âmbar (erro)", "bg-warn"],
  ["gold", "Ouro (XP)", "bg-gold"],
] as const;

const disciplinas = [
  ["Cardiologia", "#D93A49"],
  ["Pneumologia", "#2F7BD1"],
  ["Neurologia", "#7C4DD1"],
  ["Gastroenterologia", "#D4861A"],
  ["Nefrologia", "#0F9488"],
  ["Endocrinologia", "#C2408F"],
] as const;

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-[13px] font-bold tracking-[0.06em] text-ink3 uppercase">{titulo}</h2>
      {children}
    </section>
  );
}

export default function TokensPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-[34px] font-extrabold">Tokens do giro</h1>
        <ThemeToggle />
      </header>

      <Secao titulo="Cores">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tokens.map(([nome, uso, classe]) => (
            <li key={nome} className="overflow-hidden rounded-2xl border border-line bg-sf">
              <div className={`h-16 border-b border-line ${classe}`} />
              <div className="p-3">
                <p className="font-display font-bold">{nome}</p>
                <p className="text-[13px] text-ink3">{uso}</p>
              </div>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Tipografia">
        <div className="space-y-3 rounded-2xl border border-line bg-sf p-6">
          <p className="font-display text-[56px] leading-none font-extrabold tabular-nums">1.240 XP</p>
          <p className="font-display text-[34px] font-bold">Bricolage Grotesque — títulos e números</p>
          <p className="font-display text-xl">
            <span className="font-normal">400 </span>
            <span className="font-medium">500 </span>
            <span className="font-semibold">600 </span>
            <span className="font-bold">700 </span>
            <span className="font-extrabold">800</span>
          </p>
          <p className="text-base">
            Atkinson Hyperlegible — corpo e enunciados. Paciente de 58 anos, hipertenso, chega ao pronto-socorro
            com dispneia aos mínimos esforços.
          </p>
          <p className="text-base font-bold">Atkinson Hyperlegible 700 — negrito</p>
          <p className="text-[18px] leading-[1.6] text-ink2">Caso clínico em 18 px / 1,6 com texto secundário.</p>
          <p className="text-[13px] text-ink3">Legenda em 13 px</p>
          <a href="#" className="font-bold text-acink underline-offset-4 hover:underline">
            Link em acink
          </a>
        </div>
      </Secao>

      <Secao titulo="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="destaque">
            <Play aria-hidden /> Girar a roleta
          </Button>
          <Button>Confirmar resposta</Button>
          <Button variant="secondary">Abrir no NotebookLM</Button>
          <Button variant="ghost">Sinalizar erro</Button>
          <Button variant="destaque" disabled>
            Girando…
          </Button>
        </div>
      </Secao>

      <Secao titulo="Chips">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="chip" className="border-gold/40 bg-gold/15">
            <Flame className="text-gold" aria-hidden /> 12 dias
          </Badge>
          <Badge variant="chip">
            <Star className="text-gold" aria-hidden /> 1.240 XP
          </Badge>
          <Badge variant="chip" className="border-ok/40 text-ok">
            Correta
          </Badge>
          <Badge variant="chip" className="border-warn/40 text-warn">
            Sua resposta
          </Badge>
          {disciplinas.map(([nome, cor]) => (
            <Badge
              key={nome}
              variant="chip"
              className="border-transparent text-[#15141F]"
              style={{ backgroundColor: `color-mix(in srgb, ${cor} 20%, white)` }}
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
              {nome}
            </Badge>
          ))}
        </div>
      </Secao>
    </main>
  );
}
