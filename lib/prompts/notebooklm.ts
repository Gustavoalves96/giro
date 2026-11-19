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
- Não repita: cada questão cobre um ponto diferente do material; nada de reformular outra questão.
- Não invente nada que não esteja nas fontes.{{existentes}}

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
- Não repita procedimentos: cada um aparece uma vez só.
- Não invente nem complete passos que não estejam nas fontes.{{existentes}}

Responda SOMENTE com JSON válido, sem texto antes ou depois, neste formato:
{"procedimentos":[{"nome":"...","material":["..."],"passos":[{"texto":"...","critico":true},
{"texto":"...","critico":false}],"pontosDeAtencao":"...","fonte":"..."}]}`;

/** existentes = enunciados (ou nomes de procedimento) já no tópico, do mais antigo ao mais recente */
type Dados = { quantidade: number; topico: string; disciplina: string; existentes?: string[] };

// shortcut: só os 60 mais recentes, cortados em 120 caracteres, para o prompt caber na caixa do NotebookLM;
// aumentar se ainda vier repetida em tópico grande.
export const MAX_EXISTENTES = 60;
const MAX_CARACTERES = 120;

function listaExistentes(existentes: string[], cabecalho: string) {
  if (!existentes.length) return "";
  const linhas = existentes.slice(-MAX_EXISTENTES).map((e) => {
    const t = e.replace(/\s+/g, " ").trim();
    return `- ${t.length > MAX_CARACTERES ? `${t.slice(0, MAX_CARACTERES - 1)}…` : t}`;
  });
  return `\n\n${cabecalho}\n${linhas.join("\n")}`;
}

const preencher = (modelo: string, { quantidade, topico, disciplina }: Dados, existentes: string) =>
  modelo
    .replace("{{quantidade}}", String(quantidade))
    .replace("{{topico}}", topico)
    .replace("{{disciplina}}", disciplina)
    .replace("{{existentes}}", () => existentes); // função: "$" no texto dela não vira padrão de replace

export const montarPrompt = (dados: Dados) =>
  preencher(
    PROMPT_NOTEBOOKLM,
    dados,
    listaExistentes(dados.existentes ?? [], "Estas questões JÁ EXISTEM no tópico. NÃO crie questões iguais, parecidas ou reformuladas sobre o mesmo ponto:"),
  );
export const montarPromptProcedimentos = (dados: Dados) =>
  preencher(
    PROMPT_PROCEDIMENTOS,
    dados,
    listaExistentes(dados.existentes ?? [], "Estes procedimentos JÁ EXISTEM no tópico. NÃO repita nenhum deles:"),
  );
