"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { excluir } from "./actions";

// Excluir tópico apaga as questões dele (cascade): confirma dizendo quantas.
export function ExcluirTopico({
  id,
  disciplinaId,
  nome,
  totalQuestoes,
  className,
}: {
  id: string;
  disciplinaId: string;
  nome: string;
  totalQuestoes: number;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [excluindo, iniciar] = useTransition();
  const aviso =
    totalQuestoes === 0
      ? "Ele não tem questões."
      : `${totalQuestoes === 1 ? "A questão dele" : `As ${totalQuestoes} questões dele`} e o histórico de respostas também ${totalQuestoes === 1 ? "será apagada" : "serão apagadas"}. Não dá para desfazer.`;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button variant="ghost" className={className} aria-label={`Excluir ${nome}`} title="Excluir" onClick={() => setAberto(true)}>
        <Trash2 aria-hidden />
      </Button>
      <DialogContent className="rounded-3xl border-line bg-sf p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Excluir “{nome}”?</DialogTitle>
          <DialogDescription className="text-base text-ink2">{aviso}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button
            disabled={excluindo}
            className="bg-warn text-white hover:bg-warn/90 dark:text-[#1b0c08]"
            onClick={() =>
              iniciar(async () => {
                await excluir(id, disciplinaId);
                setAberto(false);
              })
            }
          >
            {excluindo
              ? "Excluindo…"
              : totalQuestoes === 0
                ? "Excluir tópico"
                : `Excluir tópico e ${totalQuestoes} ${totalQuestoes === 1 ? "questão" : "questões"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
