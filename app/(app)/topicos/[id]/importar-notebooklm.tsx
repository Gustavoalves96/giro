"use client";

import { AlertTriangle, Check, Copy, ExternalLink, Upload } from "lucide-react";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { CAMPO, EditorResponsivo } from "@/components/editor-responsivo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Leitura, lerProcedimentos, lerResposta } from "@/lib/import/parse-json";
import { montarPrompt, montarPromptProcedimentos } from "@/lib/prompts/notebooklm";
import { ROTULO_TIPO } from "@/lib/questoes/rotulos";
import { cn } from "@/lib/utils";
import { type EstadoImportacao, importarProcedimentos, importarQuestoes } from "./actions";

type Tipo = "questoes" | "procedimentos";

type Props = {
  tipo: Tipo;
  topicoId: string;
  topico: string;
  disciplina: string;
  notebooklmUrl: string | null;
  /** enunciados (ou nomes de procedimento) já no tópico, para marcar duplicatas na prévia */
  enunciados: string[];
};

// O que a prévia mostra de cada item válido.
type ItemPrevia = { titulo: string; chips: string[]; detalhe: string };

function resumir<T>(leitura: Leitura<T>, item: (t: T) => ItemPrevia): Leitura<ItemPrevia> {
  return leitura.ok ? { ...leitura, validas: leitura.validas.map(item) } : leitura;
}

const plural = (n: number, um: string, varios: string) => (n === 1 ? `1 ${um}` : `${n} ${varios}`);

// Tudo o que muda entre os dois painéis (inclusive o gênero das palavras).
const TIPOS = {
  questoes: {
    descricao: "O NotebookLM cria as questões a partir dos seus arquivos; o Giro só lê a resposta.",
    // nome acessível: começa pelo texto visível (WCAG 2.5.3) e diz qual dos dois painéis
    rotuloBotao: "Gerar com NotebookLM: questões",
    quantidade: { rotulo: "Quantas questões", padrao: 10, max: 30 },
    prompt: montarPrompt,
    ler: (texto: string, existentes: string[]) =>
      resumir(lerResposta(texto, existentes), (q) => ({
        titulo: q.enunciado,
        chips: [ROTULO_TIPO[q.tipo]],
        detalhe: [`resposta ${q.gabarito}`, q.fonte].filter(Boolean).join(" · "),
      })),
    importar: importarQuestoes,
    itens: (n: number) => plural(n, "questão", "questões"),
    validas: (n: number) => (n === 1 ? "válida" : "válidas"),
    repetidas: (n: number) => (n === 1 ? "repetida" : "repetidas"),
    ordinal: (n: number) => `${n}ª questão`,
    importadas: (n: number) => (n === 1 ? "1 questão importada." : `${n} questões importadas.`),
    nadaNovo: "Nada novo: essas questões já estão no tópico.",
    comProblema: "Com problema (não serão importadas)",
    ignoradas: "Repetidas (ignoradas)",
    nenhuma: "Nenhuma questão nova para importar.",
  },
  procedimentos: {
    descricao:
      "O NotebookLM monta o passo a passo a partir dos seus roteiros; o Giro só lê a resposta. Confira a ordem e os passos críticos.",
    rotuloBotao: "Gerar com NotebookLM: procedimentos",
    quantidade: { rotulo: "Quantos procedimentos", padrao: 3, max: 10 },
    prompt: montarPromptProcedimentos,
    ler: (texto: string, existentes: string[]) =>
      resumir(lerProcedimentos(texto, existentes), (p) => {
        const criticos = p.passos.filter((x) => x.critico).length;
        return {
          titulo: p.nome,
          chips: [plural(p.passos.length, "passo", "passos"), plural(criticos, "crítico", "críticos")],
          detalhe: [p.material.length ? `Material: ${p.material.join(", ")}` : "Sem material", p.fonte]
            .filter(Boolean)
            .join(" · "),
        };
      }),
    importar: importarProcedimentos,
    itens: (n: number) => plural(n, "procedimento", "procedimentos"),
    validas: (n: number) => (n === 1 ? "válido" : "válidos"),
    repetidas: (n: number) => (n === 1 ? "repetido" : "repetidos"),
    ordinal: (n: number) => `${n}º procedimento`,
    importadas: (n: number) => (n === 1 ? "1 procedimento importado." : `${n} procedimentos importados.`),
    nadaNovo: "Nada novo: esses procedimentos já estão no tópico.",
    comProblema: "Com problema (não serão importados)",
    ignoradas: "Repetidos (ignorados)",
    nenhuma: "Nenhum procedimento novo para importar.",
  },
} satisfies Record<Tipo, unknown>;

type Textos = (typeof TIPOS)[Tipo];

export function ImportarNotebookLM(props: Props) {
  const t = TIPOS[props.tipo];
  return (
    <EditorResponsivo
      titulo="Gerar com NotebookLM"
      descricao={t.descricao}
      larguraDialog="sm:max-w-2xl"
      ariaLabel={t.rotuloBotao}
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

function Painel({ tipo, topicoId, topico, disciplina, notebooklmUrl, enunciados }: Props) {
  const t: Textos = TIPOS[tipo];
  const id = useId();
  const [quantidade, setQuantidade] = useState(t.quantidade.padrao);
  const [copia, setCopia] = useState<"ok" | "falhou" | null>(null);
  const [texto, setTexto] = useState("");
  const [leitura, setLeitura] = useState<Leitura<ItemPrevia> | null>(null);
  const [resultado, setResultado] = useState<EstadoImportacao | null>(null);
  const [importando, iniciar] = useTransition();
  const prompt = t.prompt({ quantidade, topico, disciplina });

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
      const r = await t.importar(topicoId, texto);
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
              {t.quantidade.rotulo}
            </label>
            <input
              id={`${id}-qtd`}
              type="number"
              inputMode="numeric"
              min={1}
              max={t.quantidade.max}
              value={quantidade}
              onChange={(e) => {
                setQuantidade(Math.min(t.quantidade.max, Math.max(1, Number(e.target.value) || 1)));
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
          <Button variant="secondary" onClick={() => setLeitura(t.ler(texto, enunciados))}>
            Ler resposta
          </Button>
        </Passo>
      </ol>

      <div aria-live="polite">
        {resultado && "importadas" in resultado && (
          <p className="flex items-center gap-2 rounded-2xl border border-ok p-4 font-bold text-ok">
            <Check aria-hidden />
            {resultado.importadas === 0 ? t.nadaNovo : t.importadas(resultado.importadas)}
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
        {leitura?.ok && <Previa t={t} leitura={leitura} importando={importando} aoImportar={importar} />}
      </div>
    </div>
  );
}

function Previa({
  t,
  leitura,
  importando,
  aoImportar,
}: {
  t: Textos;
  leitura: Extract<Leitura<ItemPrevia>, { ok: true }>;
  importando: boolean;
  aoImportar: () => void;
}) {
  const { validas, invalidas, duplicadas } = leitura;
  const n = validas.length;
  return (
    <section aria-label="Pré-visualização" className="space-y-4 border-t border-line pt-5">
      <h3 className="font-display text-xl font-extrabold">
        {n} {t.validas(n)}
        {invalidas.length > 0 && ` · ${invalidas.length} com problema`}
        {duplicadas.length > 0 && ` · ${duplicadas.length} ${t.repetidas(duplicadas.length)}`}
      </h3>

      {n > 0 && (
        <ul className="space-y-2">
          {validas.map((item, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-line p-3">
              <Check className="mt-0.5 size-5 shrink-0 text-ok" aria-label="Válido" />
              <div className="min-w-0">
                <p className="line-clamp-2">{item.titulo}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-ink3">
                  {item.chips.map((c) => (
                    <Badge key={c} variant="chip" className="h-6 px-2 text-[12px]">
                      {c}
                    </Badge>
                  ))}
                  <span>{item.detalhe}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {invalidas.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold">{t.comProblema}</h4>
          <ul className="space-y-2">
            {invalidas.map((p) => (
              <li key={p.indice} className="flex gap-3 rounded-2xl border border-warn/60 p-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
                <p>
                  <span className="font-bold">{t.ordinal(p.indice + 1)}:</span> {p.motivo}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {duplicadas.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-bold">{t.ignoradas}</h4>
          <ul className="space-y-2">
            {duplicadas.map((d) => (
              <li key={d.indice} className="rounded-2xl border border-dashed border-line p-3 text-ink3">
                <span className="font-bold text-ink2">{t.ordinal(d.indice + 1)}:</span> {d.motivo}{" "}
                <span className="line-clamp-1">{d.enunciado}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {n > 0 ? (
        <Button onClick={aoImportar} disabled={importando} className="w-full sm:w-auto">
          {importando ? "Importando…" : `Importar ${t.itens(n)}`}
        </Button>
      ) : (
        <p className="text-ink2">{t.nenhuma}</p>
      )}
    </section>
  );
}
