"use client";

import { useActionState, useId, useState } from "react";
import { CAMPO, EditorResponsivo } from "@/components/editor-responsivo";
import { Button } from "@/components/ui/button";
import type { Alternativa, Questao } from "@/lib/db/schema";
import { LETRAS } from "@/lib/import/schemas";
import { ROTULO_DIFICULDADE, ROTULO_ORIGEM, ROTULO_TIPO } from "@/lib/questoes/rotulos";
import { cn } from "@/lib/utils";
import { type EstadoQuestao, salvarQuestao } from "./actions";

type QuestaoEditavel = Pick<
  Questao,
  "id" | "tipo" | "enunciado" | "alternativas" | "gabarito" | "explicacao" | "fonte" | "dificuldade" | "origem"
>;
type Letra = Alternativa["letra"];

const TIPOS = ["multipla_escolha", "caso_clinico", "verdadeiro_falso"] as const;
const DIFICULDADES = ["facil", "media", "dificil"] as const;
const ORIGENS = ["manual", "prova_antiga"] as const;

// Pílula de rádio (input escondido dentro do label): marcada = tinta cheia.
const PILULA =
  "flex min-h-11 cursor-pointer items-center justify-center rounded-[14px] border border-line bg-sf px-4 text-center font-bold text-ink2 " +
  "has-checked:border-ink has-checked:bg-ink has-checked:text-bg has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50";

export function EditorQuestao({
  topicoId,
  questao,
  ...botao
}: {
  topicoId: string;
  questao?: QuestaoEditavel;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "ghost";
  ariaLabel?: string;
}) {
  return (
    <EditorResponsivo
      {...botao}
      titulo={questao ? "Editar questão" : "Nova questão"}
      descricao="Enunciado, alternativas, resposta correta e explicação."
      larguraDialog="sm:max-w-2xl"
      conteudo={(fechar) => <FormQuestao topicoId={topicoId} questao={questao} aoSalvar={fechar} />}
    />
  );
}

export function Opcoes<T extends string>({
  legenda,
  nome,
  opcoes,
  rotulos,
  valor,
  aoMudar,
  erro,
  colunas,
}: {
  legenda: string;
  nome: string;
  opcoes: readonly T[];
  rotulos: Record<T, string>;
  valor: string;
  aoMudar: (v: T) => void;
  erro?: string;
  colunas: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-bold">{legenda}</legend>
      <div className={cn("grid gap-2", colunas)}>
        {opcoes.map((o) => (
          <label key={o} className={PILULA}>
            <input
              type="radio"
              name={nome}
              value={o}
              checked={valor === o}
              onChange={() => aoMudar(o)}
              className="sr-only"
            />
            {rotulos[o]}
          </label>
        ))}
      </div>
      {erro && <p className="text-warn">{erro}</p>}
    </fieldset>
  );
}

function FormQuestao({
  topicoId,
  questao,
  aoSalvar,
}: {
  topicoId: string;
  questao?: QuestaoEditavel;
  aoSalvar: () => void;
}) {
  const [estado, acao, salvando] = useActionState<EstadoQuestao, FormData>(async (anterior, dados) => {
    const r = await salvarQuestao(anterior, dados);
    if (r.salvo) aoSalvar();
    return r;
  }, {});
  // controlados: o React limpa campos não controlados depois da action, inclusive quando dá erro
  const [tipo, setTipo] = useState<Questao["tipo"]>(questao?.tipo ?? "multipla_escolha");
  const [enunciado, setEnunciado] = useState(questao?.enunciado ?? "");
  // texto das alternativas fica guardado mesmo se trocar para V/F e voltar
  const [alternativas, setAlternativas] = useState<Record<Letra, string>>(() => {
    const inicial = { A: "", B: "", C: "", D: "", E: "" };
    for (const a of questao?.alternativas ?? []) inicial[a.letra] = a.texto;
    return inicial;
  });
  const [gabarito, setGabarito] = useState(questao?.gabarito ?? "");
  const [explicacao, setExplicacao] = useState(questao?.explicacao ?? "");
  const [fonte, setFonte] = useState(questao?.fonte ?? "");
  const [dif, setDif] = useState<string>(questao?.dificuldade ?? "media");
  const origemEditavel = !questao || questao.origem === "manual" || questao.origem === "prova_antiga";
  const [origem, setOrigem] = useState<string>(questao?.origem ?? "manual");
  const id = useId();
  const erro = (campo: keyof NonNullable<EstadoQuestao["erros"]>) => estado.erros?.[campo]?.[0];
  const vf = tipo === "verdadeiro_falso";

  return (
    <form action={acao} className="space-y-5">
      <input type="hidden" name="topicoId" value={topicoId} />
      {questao && <input type="hidden" name="id" value={questao.id} />}

      <Opcoes
        legenda="Tipo"
        nome="tipo"
        opcoes={TIPOS}
        rotulos={ROTULO_TIPO}
        valor={tipo}
        aoMudar={setTipo}
        erro={erro("tipo")}
        colunas="grid-cols-1 sm:grid-cols-3"
      />

      <div className="space-y-2">
        <label htmlFor={`${id}-enunciado`} className="block font-bold">
          {tipo === "caso_clinico" ? "Caso clínico e pergunta" : vf ? "Afirmação" : "Enunciado"}
        </label>
        <textarea
          id={`${id}-enunciado`}
          name="enunciado"
          value={enunciado}
          onChange={(e) => setEnunciado(e.target.value)}
          rows={tipo === "caso_clinico" ? 6 : 3}
          aria-invalid={erro("enunciado") ? true : undefined}
          aria-describedby={`${id}-enunciado-erro`}
          className={cn(CAMPO, "h-auto py-3")}
        />
        <p id={`${id}-enunciado-erro`} className="text-warn empty:hidden">
          {erro("enunciado")}
        </p>
      </div>

      {vf ? (
        <Opcoes
          legenda="Resposta correta"
          nome="gabarito"
          opcoes={["V", "F"] as const}
          rotulos={{ V: "Verdadeiro", F: "Falso" }}
          valor={gabarito}
          aoMudar={setGabarito}
          erro={erro("gabarito")}
          colunas="grid-cols-2"
        />
      ) : (
        <fieldset className="space-y-2" aria-describedby={`${id}-alt-ajuda`}>
          <legend className="mb-1 font-bold">Alternativas</legend>
          <p id={`${id}-alt-ajuda`} className="text-[13px] text-ink3">
            Toque na letra da alternativa correta. Deixe em branco as que não usar.
          </p>
          {LETRAS.map((letra) => (
            <div key={letra} className="flex items-center gap-2">
              <label
                className={
                  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-sf font-display text-lg font-bold text-ink2 " +
                  "has-checked:border-ok has-checked:bg-ok has-checked:text-bg has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
                }
              >
                <input
                  type="radio"
                  name="gabarito"
                  value={letra}
                  checked={gabarito === letra}
                  onChange={() => setGabarito(letra)}
                  aria-label={`${letra} é a correta`}
                  className="sr-only"
                />
                {letra}
              </label>
              <input
                name={`alternativa_${letra}`}
                value={alternativas[letra]}
                onChange={(e) => setAlternativas((a) => ({ ...a, [letra]: e.target.value }))}
                aria-label={`Alternativa ${letra}`}
                placeholder={`Alternativa ${letra}`}
                autoComplete="off"
                className={CAMPO}
              />
            </div>
          ))}
          {(erro("alternativas") || erro("gabarito")) && (
            <p className="text-warn">{erro("alternativas") ?? erro("gabarito")}</p>
          )}
        </fieldset>
      )}

      <div className="space-y-2">
        <label htmlFor={`${id}-explicacao`} className="block font-bold">
          Explicação
        </label>
        <textarea
          id={`${id}-explicacao`}
          name="explicacao"
          value={explicacao}
          onChange={(e) => setExplicacao(e.target.value)}
          rows={3}
          placeholder="Por que a correta está certa e as outras não."
          aria-invalid={erro("explicacao") ? true : undefined}
          aria-describedby={`${id}-explicacao-erro`}
          className={cn(CAMPO, "h-auto py-3")}
        />
        <p id={`${id}-explicacao-erro`} className="text-warn empty:hidden">
          {erro("explicacao")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${id}-fonte`} className="block font-bold">
          Fonte <span className="font-normal text-ink3">(opcional)</span>
        </label>
        <input
          id={`${id}-fonte`}
          name="fonte"
          value={fonte}
          onChange={(e) => setFonte(e.target.value)}
          placeholder="Slide 12 – Aula de IC"
          autoComplete="off"
          className={CAMPO}
        />
      </div>

      <Opcoes
        legenda="Dificuldade"
        nome="dificuldade"
        opcoes={DIFICULDADES}
        rotulos={ROTULO_DIFICULDADE}
        valor={dif}
        aoMudar={setDif}
        erro={erro("dificuldade")}
        colunas="grid-cols-3"
      />

      {origemEditavel ? (
        <Opcoes
          legenda="Origem"
          nome="origem"
          opcoes={ORIGENS}
          rotulos={ROTULO_ORIGEM}
          valor={origem}
          aoMudar={setOrigem}
          erro={erro("origem")}
          colunas="grid-cols-2"
        />
      ) : (
        <p className="text-ink3">Origem: {ROTULO_ORIGEM[questao.origem]} (não muda na edição).</p>
      )}

      <Button type="submit" disabled={salvando} className="w-full sm:w-auto">
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
