"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
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
import { TOPICO_COM_HISTORICO } from "@/lib/topicos/schema";
import { excluir } from "./actions";

// Só tópico sem respostas (o histórico fica); apaga as questões dele (cascade): confirma dizendo quantas.
// Com respostas, o diálogo explica e leva ao tópico para desativar as questões.
export function ExcluirTopico({
  id,
  disciplinaId,
  nome,
  totalQuestoes,
  respondido,
  className,
}: {
  id: string;
  disciplinaId: string;
  nome: string;
  totalQuestoes: number;
  respondido: boolean;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [excluindo, iniciar] = useTransition();
  const [recusa, setRecusa] = useState<string | null>(null);
  const bloqueado = respondido || recusa !== null;
  const aviso = bloqueado
    ? (recusa ?? TOPICO_COM_HISTORICO)
    : totalQuestoes === 0
      ? "Ele não tem questões."
      : `${totalQuestoes === 1 ? "A questão dele também será apagada" : `As ${totalQuestoes} questões dele também serão apagadas`}. Não dá para desfazer.`;

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button variant="ghost" className={className} aria-label={`Excluir ${nome}`} title="Excluir" onClick={() => setAberto(true)}>
        <Trash2 aria-hidden />
      </Button>
      <DialogContent className="rounded-3xl border-line bg-sf p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">
            {bloqueado ? `Não dá para excluir “${nome}”` : `Excluir “${nome}”?`}
          </DialogTitle>
          <DialogDescription className="text-base text-ink2">{aviso}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="secondary">{bloqueado ? "Fechar" : "Cancelar"}</Button>
          </DialogClose>
          {bloqueado ? (
            <Button asChild>
              <Link href={`/topicos/${id}`}>Abrir o tópico</Link>
            </Button>
          ) : (
            <Button
              disabled={excluindo}
              className="bg-warn text-white hover:bg-warn/90 dark:text-[#1b0c08]"
              onClick={() =>
                iniciar(async () => {
                  const r = await excluir(id, disciplinaId);
                  if (r.ok) setAberto(false);
                  else setRecusa(r.mensagem);
                })
              }
            >
              {excluindo
                ? "Excluindo…"
                : totalQuestoes === 0
                  ? "Excluir tópico"
                  : `Excluir tópico e ${totalQuestoes} ${totalQuestoes === 1 ? "questão" : "questões"}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
