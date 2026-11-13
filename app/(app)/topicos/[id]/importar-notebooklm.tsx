"use client";

import { AlertTriangle, Check, Copy, ExternalLink, Upload } from "lucide-react";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { CAMPO, EditorResponsivo } from "@/components/editor-responsivo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Leitura, lerResposta } from "@/lib/import/parse-json";
import { montarPrompt } from "@/lib/prompts/notebooklm";
import { ROTULO_TIPO } from "@/lib/questoes/rotulos";
import { cn } from "@/lib/utils";
import { importarQuestoes } from "./actions";

type Props = {
  topicoId: string;
  topico: string;
  disciplina: string;
  notebooklmUrl: string | null;
  /** enunciados já no tópico, para marcar duplicatas na prévia */
  enunciados: string[];
};

export function ImportarNotebookLM(props: Props) {
  return (
    <EditorResponsivo
      titulo="Gerar com NotebookLM"
      descricao="O NotebookLM cria as questões a partir dos seus arquivos; o Giro só lê a resposta."
      larguraDialog="sm:max-w-2xl"
      conteudo={() => <Painel {...props} />}
    >
      <Upload aria-hidden />
      Gerar com NotebookLM
    </EditorResponsivo>
  );
}

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink font-display font-bold text-bg"
        aria-hidden
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <h3 className="font-bold">
          <span className="sr-only">Passo {n}: </span>
          {titulo}
        </h3>
        {children}
      </div>
    </li>
  );
}

function Painel({ topicoId, topico, disciplina, notebooklmUrl, enunciados }: Props) {
  const id = useId();
  const [quantidade, setQuantidade] = useState(10);
  const [copia, setCopia] = useState<"ok" | "falhou" | null>(null);
  const [texto, setTexto] = useState("");
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [resultado, setResultado] = useState<Awaited<ReturnType<typeof importarQuestoes>> | null>(null);
  const [importando, iniciar] = useTransition();
  const prompt = montarPrompt({ quantidade, topico, disciplina });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopia("ok");
    } catch {
      setCopia("falhou"); // sem permissão: mostra o texto para copiar à mão
    }
  }

  function importar() {
    iniciar(async () => {
      const r = await importarQuestoes(topicoId, texto);
      setResultado(r);
      if ("importadas" in r) {
        setTexto("");
        setLeitura(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <ol className="space-y-5">
        <Passo n={1} titulo="Copie o prompt">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`${id}-qtd`} className="text-ink2">
              Quantas questões
            </label>
            <input
              id={`${id}-qtd`}
              type="number"
              inputMode="numeric"
              min={1}
              max={30}
              value={quantidade}
              onChange={(e) => {
                setQuantidade(Math.min(30, Math.max(1, Number(e.target.value) || 1)));
                setCopia(null);
              }}
              className={cn(CAMPO, "w-24 text-center tabular-nums")}
            />
            <Button variant="secondary" onClick={copiar}>
              {copia === "ok" ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copia === "ok" ? "Prompt copiado" : "Copiar prompt"}
            </Button>
          </div>
          <p role="status" className="text-[13px] text-ink3 empty:hidden">
            {copia === "ok" && "Pronto. Agora cole no caderno da disciplina."}
          </p>
          {copia === "falhou" && (
            <div className="space-y-1">
              <p className="text-warn">Não consegui copiar sozinho. Selecione o texto abaixo e copie.</p>
              <textarea
                readOnly
                value={prompt}
                rows={6}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Prompt para o NotebookLM"
                className={cn(CAMPO, "h-auto py-3 text-sm")}
              />
            </div>
          )}
        </Passo>

        <Passo n={2} titulo="Abra o caderno e cole o prompt">
          {notebooklmUrl ? (
            <Button variant="secondary" asChild>
              <a href={notebooklmUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden />
                Abrir caderno de {disciplina}
              </a>
            </Button>
          ) : (
            <>
              <p className="text-ink2">{disciplina} ainda não tem o link do caderno.</p>
              <Button variant="secondary" asChild>
                <Link href="/disciplinas">Cadastrar o link em Disciplinas</Link>
              </Button>
              <p className="text-[13px] text-ink3">Ou abra o caderno pelo NotebookLM e siga daqui.</p>
            </>
          )}
        </Passo>

        <Passo n={3} titulo="Cole a resposta aqui">
          <textarea
            id={`${id}-resposta`}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setLeitura(null);
              setResultado(null);
            }}
            rows={6}
            placeholder="Cole tudo o que o NotebookLM respondeu, mesmo com texto antes ou depois."
            aria-label="Resposta do NotebookLM"
            className={cn(CAMPO, "h-auto py-3 text-sm")}
          />
          <Button variant="secondary" onClick={() => setLeitura(lerResposta(texto, enunciados))}>
            Ler resposta
          </Button>
        </Passo>
      </ol>

      <div aria-live="polite">
        {resultado && "importadas" in resultado && (
          <p className="flex items-center gap-2 rounded-2xl border border-ok p-4 font-bold text-ok">
            <Check aria-hidden />
            {resultado.importadas === 0
              ? "Nada novo: essas questões já estão no tópico."
              : resultado.importadas === 1
                ? "1 questão importada."
                : `${resultado.importadas} questões importadas.`}
          </p>
        )}
        {resultado && "erro" in resultado && <p className="text-warn">{resultado.erro}</p>}
        {leitura && !leitura.ok && (
          <div className="rounded-2xl border border-warn p-4">
            <p className="flex items-center gap-2 font-bold text-warn">
              <AlertTriangle aria-hidden />
              Não consegui ler essa resposta
            </p>
            <p className="mt-1">{leitura.erro.causa}</p>
            <p className="mt-1 text-ink2">{leitura.erro.oQueFazer}</p>
          </div>
        )}
        {leitura?.ok && <Previa leitura={leitura} importando={importando} aoImportar={importar} />}
      </div>
    </div>
  );
}

function Previa({
  leitura,
  importando,
  aoImportar,
}: {
  leitura: Extract<Leitura, { ok: true }>;
  importando: boolean;
  aoImportar: () => void;
}) {
  const { validas, invalidas, duplicadas } = leitura;
  const n = validas.length;
  return (
    <section aria-label="Pré-visualização" className="space-y-4 border-t border-line pt-5">
      <h3 className="font-display text-xl font-extrabold">
        {n} {n === 1 ? "válida" : "válidas"}
        {invalidas.length > 0 && ` · ${invalidas.length} com problema`}
        {duplicadas.length > 0 && ` · ${duplicadas.length} ${duplicadas.length === 1 ? "repetida" : "repetidas"}`}
      </h3>

      {n > 0 && (
        <ul className="space-y-2">
          {validas.map((q, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-line p-3">
              <Check className="mt-0.5 size-5 shrink-0 text-ok" aria-label="Válida" />
              <div className="min-w-0">
                <p className="line-clamp-2">{q.enunciado}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-ink3">
                  <Badge variant="chip" className="h-6 px-2 text-[12px]">
                    {ROTULO_TIPO[q.tipo]}
                  </Badge>
                  <span>resposta {q.gabarito}</span>
                  {q.fonte && <span>· {q.fonte}</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {invalidas.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold">Com problema (não serão importadas)</h4>
          <ul className="space-y-2">
            {invalidas.map((p) => (
              <li key={p.indice} className="flex gap-3 rounded-2xl border border-warn/60 p-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
                <p>
                  <span className="font-bold">{p.indice + 1}ª questão:</span> {p.motivo}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {duplicadas.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold">Repetidas (ignoradas)</h4>
          <ul className="space-y-2">
            {duplicadas.map((d) => (
              <li key={d.indice} className="rounded-2xl border border-dashed border-line p-3 text-ink3">
                <span className="font-bold text-ink2">{d.indice + 1}ª questão:</span> {d.motivo}{" "}
                <span className="line-clamp-1">{d.enunciado}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {n > 0 ? (
        <Button onClick={aoImportar} disabled={importando} className="w-full sm:w-auto">
          {importando ? "Importando…" : n === 1 ? "Importar 1 questão" : `Importar ${n} questões`}
        </Button>
      ) : (
        <p className="text-ink2">Nenhuma questão nova para importar.</p>
      )}
    </section>
  );
}
