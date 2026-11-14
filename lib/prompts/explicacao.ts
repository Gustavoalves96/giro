import type { QuestaoParaIA } from "@/lib/ai/provider";

// "Explique melhor" (CLAUDE.md §6): só enunciado, alternativas, gabarito e explicação.
// Sem letras: ela viu as alternativas embaralhadas, então "a C" do banco não é a C da tela.
export function montarPromptExplicacao(q: QuestaoParaIA): string {
  const alternativas = q.alternativas?.length ? q.alternativas : [];
  const correta = alternativas.find((a) => a.letra === q.gabarito)?.texto ?? (q.gabarito === "V" ? "Verdadeiro" : "Falso");
  const lista = alternativas.length ? alternativas.map((a) => `- ${a.texto}`).join("\n") : "- Verdadeiro\n- Falso";
  return `Você é um professor de medicina explicando uma questão para quem errou.
Explique de forma didática e curta (até 150 palavras, em português do Brasil, texto corrido sem markdown)
por que a resposta correta está certa e qual raciocínio leva até ela. Use só o que está abaixo;
se algo não estiver aqui, não invente. Não cite letras de alternativas (refira-se a elas pelo conteúdo).
Sem saudação e sem despedida.

Questão:
${q.enunciado}

Alternativas:
${lista}

Resposta correta: ${correta}

Explicação original:
${q.explicacao}`;
}
