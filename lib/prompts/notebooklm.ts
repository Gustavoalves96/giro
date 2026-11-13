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

// Procedimentos (manobras e exames): checklist de passos, só das fontes dela (CLAUDE.md §5).
export const PROMPT_PROCEDIMENTOS = `Você é um professor de medicina preparando roteiros de habilidades clínicas (manobras e exames).
Com base EXCLUSIVAMENTE nas fontes deste caderno, descreva {{quantidade}} procedimentos do tópico
"{{topico}}" da disciplina "{{disciplina}}".

Regras:
- Use só procedimentos que aparecem nas fontes, com o nome usado nelas.
- Passos na ordem em que se executam, curtos, começando cada um por UM verbo
  (ex.: "Higienizar as mãos", "Posicionar a paciente em litotomia").
- Marque "critico": true SOMENTE no passo que, se esquecido, compromete o exame ou a segurança
  (ex.: identificação, consentimento, higiene, técnica estéril). Nos demais, "critico": false.
- Em "material", liste o que é preciso separar antes (lista vazia se não houver).
- Em "pontosDeAtencao", 2 a 4 frases com indicação, cuidados e erros comuns.
- Em "fonte", indique de qual material/slide/página veio o roteiro.
- Não invente nem complete passos que não estejam nas fontes.

Responda SOMENTE com JSON válido, sem texto antes ou depois, neste formato:
{"procedimentos":[{"nome":"...","material":["..."],"passos":[{"texto":"...","critico":true},
{"texto":"...","critico":false}],"pontosDeAtencao":"...","fonte":"..."}]}`;

type Dados = { quantidade: number; topico: string; disciplina: string };

const preencher = (modelo: string, { quantidade, topico, disciplina }: Dados) =>
  modelo.replace("{{quantidade}}", String(quantidade)).replace("{{topico}}", topico).replace("{{disciplina}}", disciplina);

export const montarPrompt = (dados: Dados) => preencher(PROMPT_NOTEBOOKLM, dados);
export const montarPromptProcedimentos = (dados: Dados) => preencher(PROMPT_PROCEDIMENTOS, dados);
