"use client";

import { useActionState, useId, useState } from "react";
import { CAMPO, EditorResponsivo } from "@/components/editor-responsivo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type EstadoTopico, salvarTopico } from "./actions";

type Topico = { id: string; nome: string; descricao: string | null };

export function EditorTopico({
  disciplinaId,
  topico,
  ...botao
}: {
  disciplinaId: string;
  topico?: Topico;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "ghost";
  ariaLabel?: string;
}) {
  return (
    <EditorResponsivo
      {...botao}
      titulo={topico ? "Editar tópico" : "Novo tópico"}
      descricao="Nome do tópico e o que focar no estudo."
      conteudo={(fechar) => <FormTopico disciplinaId={disciplinaId} topico={topico} aoSalvar={fechar} />}
    />
  );
}

function FormTopico({
  disciplinaId,
  topico,
  aoSalvar,
}: {
  disciplinaId: string;
  topico?: Topico;
  aoSalvar: () => void;
}) {
  const [estado, acao, salvando] = useActionState<EstadoTopico, FormData>(async (anterior, dados) => {
    const r = await salvarTopico(anterior, dados);
    if (r.salvo) aoSalvar();
    return r;
  }, {});
  // controlados: o React limpa campos não controlados depois da action, inclusive quando dá erro
  const [nome, setNome] = useState(topico?.nome ?? "");
  const [descricao, setDescricao] = useState(topico?.descricao ?? "");
  const id = useId();
  const erro = (campo: keyof NonNullable<EstadoTopico["erros"]>) => estado.erros?.[campo]?.[0];

  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="disciplinaId" value={disciplinaId} />
      {topico && <input type="hidden" name="id" value={topico.id} />}

      <div className="space-y-2">
        <label htmlFor={`${id}-nome`} className="block font-bold">
          Nome
        </label>
        <input
          id={`${id}-nome`}
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={80}
          autoComplete="off"
          aria-invalid={erro("nome") ? true : undefined}
          aria-describedby={`${id}-nome-erro`}
          className={CAMPO}
        />
        <p id={`${id}-nome-erro`} className="text-warn empty:hidden">
          {erro("nome")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${id}-desc`} className="block font-bold">
          Foque em <span className="font-normal text-ink3">(opcional)</span>
        </label>
        <p id={`${id}-desc-ajuda`} className="text-[13px] text-ink3">
          Cada linha vira um item de “Foque em” na hora de estudar.
        </p>
        <textarea
          id={`${id}-desc`}
          name="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder={"Classificação NYHA\nSinais de congestão\nPrimeira linha de tratamento"}
          aria-invalid={erro("descricao") ? true : undefined}
          aria-describedby={`${id}-desc-ajuda ${id}-desc-erro`}
          className={cn(CAMPO, "h-auto py-3")}
        />
        <p id={`${id}-desc-erro`} className="text-warn empty:hidden">
          {erro("descricao")}
        </p>
      </div>

      <Button type="submit" disabled={salvando} className="w-full sm:w-auto">
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
