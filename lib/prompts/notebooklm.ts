// Prompt-modelo do CLAUDE.md §5: ela cola no caderno da disciplina no NotebookLM.
export const PROMPT_NOTEBOOKLM = `Você é um professor de medicina elaborando questões de prova.
Com base EXCLUSIVAMENTE nas fontes deste caderno, crie {{quantidade}} questões sobre o tópico
"{{topico}}" da disciplina "{{disciplina}}".

Regras:
- Misture: ~60% múltipla escolha (5 alternativas, A–E), ~25% caso clínico curto
  (múltipla escolha com vinheta clínica), ~15% verdadeiro/falso.
- Apenas UMA alternativa correta. Distratores plausíveis.
- Explicação de 2 a 4 frases dizendo por que a correta está certa e por que as outras não.
- Em "fonte", indique de qual material/slide/página veio a informação.
- Varie a dificuldade (fácil, média, difícil).
- Não invente nada que não esteja nas fontes.

Responda SOMENTE com JSON válido, sem texto antes ou depois, neste formato:
{"questoes":[{"tipo":"multipla_escolha","enunciado":"...","alternativas":[{"letra":"A","texto":"..."}],
"gabarito":"A","explicacao":"...","fonte":"...","dificuldade":"media"}]}
Para verdadeiro/falso use "tipo":"verdadeiro_falso", omita "alternativas" e use "gabarito":"V" ou "F".`;

export function montarPrompt({ quantidade, topico, disciplina }: { quantidade: number; topico: string; disciplina: string }) {
  return PROMPT_NOTEBOOKLM.replace("{{quantidade}}", String(quantidade))
    .replace("{{topico}}", topico)
    .replace("{{disciplina}}", disciplina);
}
