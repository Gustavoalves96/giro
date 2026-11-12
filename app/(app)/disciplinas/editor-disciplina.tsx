"use client";

import { Check } from "lucide-react";
import { useActionState, useId, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CORES_DISCIPLINA, TEXTO_SOBRE_TINTA, tintaClara } from "@/lib/cores";
import { cn } from "@/lib/utils";
import { type EstadoDisciplina, salvarDisciplina } from "./actions";

type Disciplina = { id: string; nome: string; cor: string; notebooklmUrl: string | null };

const CAMPO =
  "h-12 w-full rounded-[14px] border border-line bg-sf px-4 text-base text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-warn";
const HEX = /^#[0-9a-fA-F]{6}$/;

// md do Tailwind (48rem): iPad e notebook usam Dialog; celular usa Sheet.
const MD = "(min-width: 48rem)";
function assinarMd(aviso: () => void) {
  const mq = window.matchMedia(MD);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
}

export function EditorDisciplina({
  disciplina,
  children,
  className,
  variant = "secondary",
  ariaLabel,
}: {
  disciplina?: Disciplina;
  children: React.ReactNode;
  className?: string;
  variant?: "destaque" | "default" | "secondary" | "ghost";
  ariaLabel?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const telaLarga = useSyncExternalStore(assinarMd, () => window.matchMedia(MD).matches, () => true);
  const titulo = disciplina ? "Editar disciplina" : "Nova disciplina";
  const descricao = "Nome, cor e link do caderno no NotebookLM.";
  const form = <FormDisciplina disciplina={disciplina} aoSalvar={() => setAberto(false)} />;

  return (
    <>
      <Button variant={variant} className={className} aria-label={ariaLabel} onClick={() => setAberto(true)}>
        {children}
      </Button>
      {telaLarga ? (
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl border-line bg-sf p-6 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-extrabold">{titulo}</DialogTitle>
              <DialogDescription className="text-base text-ink3">{descricao}</DialogDescription>
            </DialogHeader>
            {form}
          </DialogContent>
        </Dialog>
      ) : (
        <Sheet open={aberto} onOpenChange={setAberto}>
          <SheetContent
            side="bottom"
            className="max-h-[92dvh] overflow-y-auto rounded-t-3xl border-line bg-sf px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
          >
            <SheetHeader className="px-0">
              <SheetTitle className="font-display text-2xl font-extrabold">{titulo}</SheetTitle>
              <SheetDescription className="text-base text-ink3">{descricao}</SheetDescription>
            </SheetHeader>
            {form}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

function FormDisciplina({ disciplina, aoSalvar }: { disciplina?: Disciplina; aoSalvar: () => void }) {
  const [estado, acao, salvando] = useActionState<EstadoDisciplina, FormData>(async (anterior, dados) => {
    const r = await salvarDisciplina(anterior, dados);
    if (r.salvo) aoSalvar();
    return r;
  }, {});
  // controlados: o React limpa campos não controlados depois da action, inclusive quando dá erro
  const [nome, setNome] = useState(disciplina?.nome ?? "");
  const [cor, setCor] = useState(disciplina?.cor ?? CORES_DISCIPLINA[0].hex);
  const [url, setUrl] = useState(disciplina?.notebooklmUrl ?? "");
  const id = useId();
  const corValida = HEX.test(cor);
  const erro = (campo: keyof NonNullable<EstadoDisciplina["erros"]>) => estado.erros?.[campo]?.[0];

  return (
    <form action={acao} className="space-y-5">
      {disciplina && <input type="hidden" name="id" value={disciplina.id} />}

      <div className="space-y-2">
        <label htmlFor={`${id}-nome`} className="block font-bold">
          Nome
        </label>
        <input
          id={`${id}-nome`}
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={60}
          autoComplete="off"
          aria-invalid={erro("nome") ? true : undefined}
          aria-describedby={`${id}-nome-erro`}
          className={CAMPO}
        />
        <p id={`${id}-nome-erro`} className="text-warn empty:hidden">
          {erro("nome")}
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-2 font-bold">Cor</legend>
        <div className="flex flex-wrap gap-2">
          {CORES_DISCIPLINA.map((c) => {
            const escolhida = cor.toUpperCase() === c.hex;
            return (
              <button
                key={c.hex}
                type="button"
                aria-label={c.nome}
                aria-pressed={escolhida}
                onClick={() => setCor(c.hex)}
                className="flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:ring-2 aria-pressed:ring-ink aria-pressed:ring-offset-2 aria-pressed:ring-offset-sf"
                style={{ backgroundColor: c.hex }}
              >
                {escolhida && <Check className="size-5 text-white" aria-hidden />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Escolher cor livre"
            value={corValida ? cor.toLowerCase() : "#000000"}
            onChange={(e) => setCor(e.target.value.toUpperCase())}
            className="size-11 shrink-0 cursor-pointer rounded-[14px] border border-line bg-sf p-1"
          />
          <label htmlFor={`${id}-cor`} className="sr-only">
            Cor em hexadecimal
          </label>
          <input
            id={`${id}-cor`}
            name="cor"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            placeholder="#RRGGBB"
            aria-invalid={erro("cor") ? true : undefined}
            aria-describedby={`${id}-cor-erro`}
            className={cn(CAMPO, "max-w-40 font-mono uppercase")}
          />
        </div>
        <p id={`${id}-cor-erro`} className="text-warn empty:hidden">
          {erro("cor")}
        </p>
        {/* prévia: como a fatia da roleta vai ficar (tinta clara + texto escuro) */}
        {corValida && (
          <p
            className="inline-flex h-9 items-center gap-2 rounded-full px-4 font-bold"
            style={{ backgroundColor: tintaClara(cor), color: TEXTO_SOBRE_TINTA }}
          >
            <span className="size-2.5 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
            {nome.trim() || "Prévia"}
          </p>
        )}
      </fieldset>

      <div className="space-y-2">
        <label htmlFor={`${id}-url`} className="block font-bold">
          Link do NotebookLM <span className="font-normal text-ink3">(opcional)</span>
        </label>
        <input
          id={`${id}-url`}
          name="notebooklmUrl"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://notebooklm.google.com/notebook/…"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={erro("notebooklmUrl") ? true : undefined}
          aria-describedby={`${id}-url-erro`}
          className={CAMPO}
        />
        <p id={`${id}-url-erro`} className="text-warn empty:hidden">
          {erro("notebooklmUrl")}
        </p>
      </div>

      <Button type="submit" disabled={salvando} className="w-full sm:w-auto">
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
