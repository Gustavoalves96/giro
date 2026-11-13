"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

// Campo de texto dos formulários dos editores.
export const CAMPO =
  "h-12 w-full rounded-[14px] border border-line bg-sf px-4 text-base text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-warn";

// md do Tailwind (48rem): iPad e notebook usam Dialog; celular usa Sheet.
const MD = "(min-width: 48rem)";
function assinarMd(aviso: () => void) {
  const mq = window.matchMedia(MD);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
}

/** Botão que abre um formulário: Dialog a partir de md, Sheet de baixo no celular. */
export function EditorResponsivo({
  titulo,
  descricao,
  children,
  conteudo,
  className,
  larguraDialog = "sm:max-w-lg",
  variant = "secondary",
  ariaLabel,
  title,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  /** recebe `fechar` para fechar depois de salvar */
  conteudo: (fechar: () => void) => React.ReactNode;
  className?: string;
  larguraDialog?: string;
  variant?: "destaque" | "default" | "secondary" | "ghost";
  ariaLabel?: string;
  title?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const telaLarga = useSyncExternalStore(assinarMd, () => window.matchMedia(MD).matches, () => true);
  const corpo = conteudo(() => setAberto(false));

  return (
    <>
      <Button variant={variant} className={className} aria-label={ariaLabel} title={title} onClick={() => setAberto(true)}>
        {children}
      </Button>
      {telaLarga ? (
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogContent className={cn("max-h-[90dvh] overflow-y-auto rounded-3xl border-line bg-sf p-6", larguraDialog)}>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-extrabold">{titulo}</DialogTitle>
              <DialogDescription className="text-base text-ink3">{descricao}</DialogDescription>
            </DialogHeader>
            {corpo}
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
            {corpo}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
