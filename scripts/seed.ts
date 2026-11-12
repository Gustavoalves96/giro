// CONTEÚDO FICTÍCIO DE EXEMPLO — escrito para testar o app, não revisado por professor.
// Validar com ela antes de usar estas questões como material de estudo.
//
// Idempotente: IDs fixos + onConflictDoNothing. Rodar de novo não duplica nem sobrescreve
// (edições que ela fizer nessas linhas são preservadas).
import { db } from "../lib/db";
import { disciplinas, perfil, questoes, topicos, type NovaQuestao } from "../lib/db/schema";

const LETRAS = ["A", "B", "C", "D", "E"] as const;
type Letra = (typeof LETRAS)[number];
type Dif = "facil" | "media" | "dificil";
type QuestaoSeed = Omit<NovaQuestao, "id" | "topicoId" | "origem">;

const mc = (enunciado: string, alts: string[], gabarito: Letra, explicacao: string, dificuldade: Dif = "media"): QuestaoSeed => ({
  tipo: "multipla_escolha",
  enunciado,
  alternativas: alts.map((texto, i) => ({ letra: LETRAS[i], texto })),
  gabarito,
  explicacao,
  dificuldade,
  fonte: "Exemplo (seed)",
});
const cc = (...args: Parameters<typeof mc>): QuestaoSeed => ({ ...mc(...args), tipo: "caso_clinico" });
const vf = (enunciado: string, gabarito: "V" | "F", explicacao: string, dificuldade: Dif = "facil"): QuestaoSeed => ({
  tipo: "verdadeiro_falso",
  enunciado,
  alternativas: null,
  gabarito,
  explicacao,
  dificuldade,
  fonte: "Exemplo (seed)",
});

type TopicoSeed = { nome: string; descricao: string; questoes: QuestaoSeed[] };
type DisciplinaSeed = { nome: string; cor: string; topicos: TopicoSeed[] };

const DADOS: DisciplinaSeed[] = [
  {
    nome: "Cardiologia",
    cor: "#D93A49",
    topicos: [
      {
        nome: "Insuficiência cardíaca",
        descricao: "Classificação NYHA\nFração de ejeção\nTratamento que reduz mortalidade",
        questoes: [
          mc("Qual classe de fármaco NÃO reduz mortalidade na insuficiência cardíaca com fração de ejeção reduzida?", ["Betabloqueador (carvedilol)", "IECA (enalapril)", "Antagonista mineralocorticoide (espironolactona)", "Diurético de alça (furosemida)", "Inibidor de SGLT2 (dapagliflozina)"], "D", "A furosemida alivia a congestão e os sintomas, mas não mostrou redução de mortalidade. Betabloqueadores, IECA/BRA/INRA, antagonistas mineralocorticoides e iSGLT2 formam a base que reduz mortalidade.", "media"),
          mc("Paciente com IC que tem sintomas aos pequenos esforços, mas é assintomático em repouso, está em qual classe funcional da NYHA?", ["Classe I", "Classe II", "Classe III", "Classe IV", "Estágio A"], "C", "Classe III: limitação marcante, sintomas com atividades menores que as habituais, confortável em repouso. Classe II é com esforços habituais e IV é em repouso. Estágio A é da classificação da AHA, não da NYHA.", "facil"),
          mc("Qual valor de fração de ejeção define insuficiência cardíaca com fração de ejeção reduzida?", ["≤ 40%", "≤ 50%", "≤ 55%", "≤ 60%", "≤ 30%"], "A", "IC com FE reduzida é FE ≤ 40%. Entre 41% e 49% é levemente reduzida, e ≥ 50% é preservada.", "facil"),
          cc("Homem de 68 anos, com IAM prévio, chega com dispneia paroxística noturna, estertores bibasais, turgência jugular e edema de membros inferiores. Ecocardiograma: FE de 30%. Qual a conduta inicial mais adequada para a congestão?", ["Iniciar betabloqueador em dose plena", "Diurético de alça endovenoso", "Digoxina endovenosa", "Restrição hídrica isolada", "Anticoagulação plena"], "B", "Com congestão evidente, o primeiro passo é descongestionar com diurético de alça EV. Betabloqueador não deve ser iniciado em dose plena na descompensação congestiva. Digoxina e anticoagulação não tratam a congestão.", "media"),
          vf("Na insuficiência cardíaca descompensada, o BNP costuma estar elevado.", "V", "O BNP é liberado pelo estiramento ventricular e se eleva na IC descompensada. Valores baixos ajudam a afastar IC como causa da dispneia."),
        ],
      },
      {
        nome: "Hipertensão arterial",
        descricao: "Diagnóstico\nMetas pressóricas\nPrimeira linha de tratamento",
        questoes: [
          mc("Qual destas classes NÃO é considerada de primeira linha no tratamento da hipertensão arterial?", ["Diuréticos tiazídicos", "IECA", "BRA", "Bloqueadores de canal de cálcio", "Alfabloqueadores"], "E", "Tiazídicos, IECA, BRA e bloqueadores de canal de cálcio são as classes de primeira linha. Alfabloqueadores ficam para situações específicas.", "facil"),
          mc("Qual exame confirma melhor o diagnóstico de hipertensão em paciente com suspeita de hipertensão do avental branco?", ["Eletrocardiograma", "MAPA de 24 horas", "Ecocardiograma", "Fundo de olho", "Teste ergométrico"], "B", "A MAPA (ou a MRPA) mede a pressão fora do consultório e diferencia hipertensão verdadeira de efeito do avental branco. Os outros exames avaliam lesão de órgão-alvo.", "media"),
          mc("Qual efeito adverso é típico dos IECA e costuma levar à troca por BRA?", ["Edema maleolar", "Tosse seca", "Hipocalemia", "Bradicardia", "Hiperuricemia"], "B", "A tosse seca é causada pelo acúmulo de bradicinina. O BRA não tem esse efeito. Edema maleolar é típico de bloqueadores de canal de cálcio; hipocalemia e hiperuricemia, de tiazídicos.", "facil"),
          cc("Mulher de 32 anos, hipertensa desde os 28, com pressão de difícil controle com três fármacos e potássio sérico de 2,9 mEq/L sem uso de diuréticos. Qual a hipótese mais provável?", ["Hipertensão essencial", "Hiperaldosteronismo primário", "Feocromocitoma", "Coarctação da aorta", "Síndrome de Cushing"], "B", "Hipertensão resistente com hipocalemia espontânea sugere hiperaldosteronismo primário. O rastreio é feito com a relação aldosterona/renina.", "dificil"),
          vf("A meta pressórica geral para a maioria dos hipertensos é abaixo de 130/80 mmHg.", "V", "As diretrizes atuais recomendam meta < 130/80 mmHg para a maioria dos pacientes, se tolerada, individualizando em idosos frágeis.", "media"),
        ],
      },
      {
        nome: "Síndrome coronariana aguda",
        descricao: "Supra de ST\nMarcadores de necrose\nTerapia de reperfusão",
        questoes: [
          mc("Qual é o marcador de necrose miocárdica de escolha no diagnóstico de infarto?", ["CK total", "Mioglobina", "Troponina", "LDH", "TGO"], "C", "A troponina é o marcador mais sensível e específico de lesão miocárdica. CK total, mioglobina, LDH e TGO têm baixa especificidade.", "facil"),
          mc("Supradesnivelamento de ST em DII, DIII e aVF sugere infarto de qual parede?", ["Anterior", "Lateral", "Inferior", "Septal", "Posterior isolada"], "C", "DII, DIII e aVF olham a parede inferior, geralmente irrigada pela coronária direita.", "facil"),
          mc("No IAM com supra de ST, qual o tempo porta-balão ideal para a angioplastia primária?", ["Até 30 minutos", "Até 90 minutos", "Até 3 horas", "Até 6 horas", "Até 12 horas"], "B", "A meta é porta-balão ≤ 90 minutos. Se a angioplastia não for possível em tempo hábil, indica-se fibrinólise com porta-agulha ≤ 30 minutos.", "media"),
          cc("Homem de 55 anos, tabagista, com dor precordial em aperto há 2 horas, irradiada para o braço esquerdo. ECG com supra de ST de V1 a V4. Hospital sem hemodinâmica; transferência levaria 3 horas. Qual a conduta?", ["Aguardar troponina para decidir", "Transferir para angioplastia primária", "Fibrinólise imediata, se não houver contraindicação", "Apenas AAS e observação", "Teste ergométrico"], "C", "Com atraso previsto acima de 120 minutos para a angioplastia, a fibrinólise imediata é preferível. No IAM com supra, não se espera a troponina para reperfundir.", "dificil"),
          vf("O AAS deve ser administrado precocemente na suspeita de síndrome coronariana aguda, salvo contraindicação.", "V", "O AAS reduz a mortalidade na SCA e deve ser dado o quanto antes, mastigado, se não houver alergia ou sangramento ativo."),
        ],
      },
    ],
  },
  {
    nome: "Pneumologia",
    cor: "#2F7BD1",
    topicos: [
      {
        nome: "Asma",
        descricao: "Fisiopatologia\nEspirometria\nTratamento por etapas",
        questoes: [
          mc("Qual achado espirométrico é característico da asma?", ["Distúrbio restritivo sem resposta ao broncodilatador", "Obstrução com resposta significativa ao broncodilatador", "CVF reduzida com VEF1/CVF aumentado", "DLCO muito reduzida", "Espirometria sempre normal"], "B", "A asma é caracterizada por obstrução variável e reversível, com resposta significativa ao broncodilatador. A espirometria pode ser normal fora da crise, mas o achado característico é a reversibilidade.", "media"),
          mc("Qual a base do tratamento de manutenção da asma persistente?", ["Corticoide inalatório", "Antibiótico", "Anti-histamínico", "Mucolítico", "Corticoide oral contínuo"], "A", "O corticoide inalatório controla a inflamação das vias aéreas e é a base do tratamento de manutenção. Corticoide oral contínuo fica para casos graves e refratários.", "facil"),
          mc("Na crise asmática, qual sinal indica maior gravidade?", ["Sibilos expiratórios difusos", "Tosse seca", "Tórax silencioso à ausculta", "Frequência respiratória de 22 irpm", "Fala frases completas"], "C", "O tórax silencioso indica fluxo aéreo muito reduzido e risco de parada respiratória. Sibilos difusos e fala de frases completas sugerem crise menos grave.", "media"),
          cc("Jovem de 19 anos com asma, em crise há 6 horas, SpO2 de 91% em ar ambiente, fala em palavras soltas e usa musculatura acessória. Qual a conduta inicial?", ["Apenas corticoide inalatório", "Oxigênio, beta-2 agonista de curta ação inalatório e corticoide sistêmico", "Antibiótico venoso", "Intubação imediata em todos os casos", "Alta com salbutamol"], "B", "Crise grave: oxigênio para SpO2 entre 93% e 95%, SABA inalatório repetido (com ipratrópio) e corticoide sistêmico precoce. Intubação fica para falência respiratória.", "media"),
          vf("Pacientes com asma devem usar beta-2 agonista de longa ação (LABA) isoladamente, sem corticoide inalatório.", "F", "LABA em monoterapia na asma aumenta o risco de eventos graves. Deve sempre ser associado ao corticoide inalatório.", "media"),
        ],
      },
      {
        nome: "DPOC",
        descricao: "Diagnóstico espirométrico\nExacerbações\nOxigenoterapia",
        questoes: [
          mc("Qual critério espirométrico confirma DPOC?", ["VEF1/CVF < 0,70 pós-broncodilatador", "VEF1/CVF > 0,80", "CVF < 50% do previsto", "Aumento do VEF1 > 12% após broncodilatador", "DLCO normal"], "A", "O diagnóstico de DPOC exige relação VEF1/CVF < 0,70 após broncodilatador, em paciente com sintomas e exposição de risco.", "facil"),
          mc("Qual intervenção comprovadamente aumenta a sobrevida na DPOC?", ["Corticoide inalatório isolado", "Cessação do tabagismo", "Mucolítico", "Antibiótico profilático contínuo para todos", "Teofilina"], "B", "Cessar o tabagismo e a oxigenoterapia domiciliar prolongada (quando indicada) aumentam a sobrevida. Os outros itens melhoram sintomas ou não têm benefício comprovado.", "facil"),
          mc("Qual é a principal causa de DPOC?", ["Asma na infância", "Tabagismo", "Deficiência de alfa-1-antitripsina", "Tuberculose prévia", "Exposição a pólen"], "B", "O tabagismo é, de longe, a principal causa. A deficiência de alfa-1-antitripsina é rara e deve ser lembrada em jovens com enfisema.", "facil"),
          cc("Homem de 70 anos com DPOC grave, em repouso e ar ambiente, com PaO2 de 52 mmHg em duas gasometrias, com o quadro estável. Qual a conduta?", ["Oxigenoterapia domiciliar prolongada (≥ 15 h/dia)", "Oxigênio apenas durante esforço", "Ventilação mecânica invasiva", "Nenhuma, pois está estável", "Corticoide oral contínuo"], "A", "PaO2 ≤ 55 mmHg em repouso no paciente estável indica oxigenoterapia domiciliar por pelo menos 15 horas por dia, o que aumenta a sobrevida.", "media"),
          vf("Na exacerbação da DPOC com hipercapnia, deve-se ofertar oxigênio em alto fluxo para manter SpO2 de 100%.", "F", "Oxigênio em excesso pode piorar a hipercapnia. A meta na DPOC é SpO2 entre 88% e 92%.", "media"),
        ],
      },
      {
        nome: "Pneumonia adquirida na comunidade",
        descricao: "Agentes etiológicos\nCURB-65\nAntibioticoterapia empírica",
        questoes: [
          mc("Qual é o agente mais comum da pneumonia adquirida na comunidade?", ["Staphylococcus aureus", "Streptococcus pneumoniae", "Pseudomonas aeruginosa", "Klebsiella pneumoniae", "Legionella"], "B", "O pneumococo é o agente mais frequente da PAC em todas as faixas de gravidade.", "facil"),
          mc("Qual item NÃO faz parte do escore CURB-65?", ["Confusão mental", "Ureia elevada", "Frequência respiratória ≥ 30 irpm", "Febre acima de 39 °C", "Idade ≥ 65 anos"], "D", "CURB-65: Confusão, Ureia > 50 mg/dL, Respiração ≥ 30 irpm, Baixa pressão (PAS < 90 ou PAD ≤ 60) e idade ≥ 65. Febre não entra.", "media"),
          mc("Paciente com CURB-65 igual a 0, sem comorbidades. Qual o local de tratamento mais adequado?", ["UTI", "Internação em enfermaria", "Ambulatorial", "Observação de 72 horas", "Hospital-dia com antibiótico venoso"], "C", "CURB-65 de 0 a 1 indica baixo risco, com tratamento ambulatorial possível. 2 sugere internação e ≥ 3, avaliar UTI.", "facil"),
          cc("Mulher de 45 anos, previamente hígida, com febre, tosse produtiva e consolidação em lobo inferior direito. CURB-65 = 0. Qual antibiótico empírico é adequado?", ["Amoxicilina oral", "Vancomicina venosa", "Meropenem", "Ciprofloxacino isolado", "Fluconazol"], "A", "PAC ambulatorial sem comorbidades: amoxicilina (ou macrolídeo). Vancomicina e meropenem são para infecções graves ou germes resistentes; fluconazol é antifúngico.", "media"),
          vf("A radiografia de tórax é útil para confirmar o diagnóstico de pneumonia.", "V", "O diagnóstico de PAC combina quadro clínico e imagem com infiltrado novo. A radiografia também mostra complicações como derrame pleural."),
        ],
      },
    ],
  },
  {
    nome: "Neurologia",
    cor: "#7C4DD1",
    topicos: [
      {
        nome: "AVC isquêmico",
        descricao: "Janela de trombólise\nExame de imagem inicial\nPrevenção secundária",
        questoes: [
          mc("Qual o primeiro exame de imagem na suspeita de AVC agudo?", ["Ressonância com contraste", "Tomografia de crânio sem contraste", "Doppler de carótidas", "Eletroencefalograma", "Angiografia digital"], "B", "A TC sem contraste é rápida e disponível, e serve sobretudo para excluir hemorragia antes da trombólise.", "facil"),
          mc("Qual a janela clássica para trombólise endovenosa com alteplase no AVC isquêmico?", ["Até 1 hora", "Até 4,5 horas", "Até 12 horas", "Até 24 horas", "Até 48 horas"], "B", "A janela clássica para trombólise EV é de até 4,5 horas do início dos sintomas (ou do último momento visto bem).", "facil"),
          mc("Qual é a principal causa de AVC cardioembólico?", ["Estenose mitral isolada", "Fibrilação atrial", "Prolapso de valva mitral", "Bloqueio de ramo esquerdo", "Taquicardia sinusal"], "B", "A fibrilação atrial é a principal fonte cardioembólica e exige avaliação para anticoagulação.", "facil"),
          cc("Mulher de 66 anos com hemiparesia direita e afasia iniciadas há 2 horas. TC sem sangramento, PA 170/95 mmHg e glicemia de 110 mg/dL. Qual a conduta?", ["Trombólise endovenosa, se não houver contraindicação", "Aguardar 24 horas e repetir a TC", "Anticoagulação plena imediata", "Baixar a PA para 120/80 antes de tudo", "Apenas AAS"], "A", "Dentro da janela, sem hemorragia e com PA < 185/110, está indicada a trombólise. Não se deve baixar a PA agressivamente no AVC isquêmico.", "media"),
          vf("No AVC isquêmico agudo, a pressão arterial deve ser reduzida rapidamente para valores normais em todos os pacientes.", "F", "A hipertensão permissiva preserva a perfusão da penumbra. Só se reduz a PA se > 220/120 mmHg, ou > 185/110 para quem vai trombolisar.", "media"),
        ],
      },
      {
        nome: "Epilepsia",
        descricao: "Classificação das crises\nEstado de mal epiléptico\nFármacos anticrise",
        questoes: [
          mc("Qual o tratamento de primeira linha no estado de mal epiléptico?", ["Fenitoína", "Benzodiazepínico", "Ácido valproico oral", "Carbamazepina", "Fenobarbital oral"], "B", "Benzodiazepínico (diazepam ou midazolam) é a primeira linha. Fenitoína ou valproato EV entram se a crise persistir.", "facil"),
          mc("A partir de quanto tempo de crise tônico-clônica contínua já se trata como estado de mal epiléptico?", ["1 minuto", "5 minutos", "30 minutos", "1 hora", "24 horas"], "B", "Pela definição operacional, crise tônico-clônica com mais de 5 minutos já deve ser tratada como estado de mal.", "media"),
          mc("Qual fármaco anticrise deve ser evitado em mulheres em idade fértil pelo alto risco teratogênico?", ["Lamotrigina", "Levetiracetam", "Ácido valproico", "Clobazam", "Gabapentina"], "C", "O valproato tem alto risco de malformações e de efeitos no neurodesenvolvimento. Lamotrigina e levetiracetam são opções mais seguras na gestação.", "media"),
          cc("Homem de 25 anos chega em crise tônico-clônica generalizada há 10 minutos. Recebeu diazepam EV duas vezes, sem melhora. Qual o próximo passo?", ["Repetir diazepam pela terceira vez", "Fenitoína ou valproato endovenoso", "Observação", "Carbamazepina oral", "Alta após a crise"], "B", "Falhados dois benzodiazepínicos, o próximo passo é um fármaco de segunda linha EV (fenitoína, valproato ou levetiracetam).", "media"),
          vf("Uma única crise epiléptica sempre define o diagnóstico de epilepsia.", "F", "Epilepsia exige pelo menos duas crises não provocadas com mais de 24 horas de intervalo, ou uma crise com alto risco de recorrência, ou uma síndrome epiléptica.", "media"),
        ],
      },
      {
        nome: "Cefaleias primárias",
        descricao: "Enxaqueca\nCefaleia tensional\nCefaleia em salvas",
        questoes: [
          mc("Qual característica é típica da enxaqueca?", ["Dor em aperto bilateral, sem náuseas", "Dor pulsátil unilateral com fotofobia e náuseas", "Dor orbitária com lacrimejamento, de 15 a 180 minutos", "Dor súbita, a pior da vida", "Dor que melhora com atividade física"], "B", "A enxaqueca costuma ser pulsátil, unilateral, piora com esforço e vem com náuseas e foto/fonofobia. A dor súbita e explosiva é sinal de alarme.", "facil"),
          mc("Qual tratamento é usado na crise de cefaleia em salvas?", ["Oxigênio a 100% em alto fluxo", "Paracetamol", "Propranolol", "Amitriptilina", "Dipirona oral isolada"], "A", "Oxigênio a 100% em alto fluxo e triptano subcutâneo abortam a crise de cefaleia em salvas.", "media"),
          mc("Qual é o tipo mais comum de cefaleia primária na população?", ["Enxaqueca com aura", "Cefaleia tensional", "Cefaleia em salvas", "Neuralgia do trigêmeo", "Hemicrania contínua"], "B", "A cefaleia do tipo tensional é a mais prevalente na população geral.", "facil"),
          cc("Mulher de 40 anos com cefaleia súbita e intensa, 'a pior da vida', iniciada durante esforço, com rigidez de nuca. Qual a conduta inicial?", ["Prescrever triptano e dar alta", "Tomografia de crânio sem contraste com urgência", "Iniciar profilaxia com propranolol", "Orientar diário de cefaleia", "Solicitar EEG ambulatorial"], "B", "Cefaleia em trovoada com rigidez de nuca sugere hemorragia subaracnoide. A TC sem contraste é urgente; se normal, considerar punção lombar.", "media"),
          vf("Cefaleia nova após os 50 anos é um sinal de alarme que merece investigação.", "V", "Início após os 50 anos é sinal de alarme (lembrar arterite temporal, tumores e outras causas secundárias)."),
        ],
      },
    ],
  },
  {
    nome: "Gastroenterologia",
    cor: "#D4861A",
    topicos: [
      {
        nome: "Doença do refluxo gastroesofágico",
        descricao: "Sintomas típicos e atípicos\nSinais de alarme\nTratamento",
        questoes: [
          mc("Qual é o tratamento farmacológico de escolha na DRGE?", ["Antiácido isolado", "Inibidor de bomba de prótons", "Antibiótico", "Corticoide", "Laxativo"], "B", "O IBP é o fármaco mais eficaz para controle de sintomas e cicatrização de esofagite.", "facil"),
          mc("Qual destes é um sinal de alarme que indica endoscopia na DRGE?", ["Pirose após refeições copiosas", "Disfagia e perda de peso", "Regurgitação ao deitar", "Melhora com IBP", "Idade de 25 anos"], "B", "Disfagia, odinofagia, perda de peso, anemia e sangramento são sinais de alarme e indicam endoscopia.", "facil"),
          mc("O esôfago de Barrett corresponde a qual alteração?", ["Metaplasia intestinal do epitélio escamoso esofágico", "Hipertrofia do esfíncter esofágico inferior", "Divertículo esofágico", "Varizes de esôfago", "Acalasia"], "A", "Barrett é a substituição do epitélio escamoso por colunar com metaplasia intestinal, lesão precursora do adenocarcinoma.", "media"),
          cc("Homem de 58 anos com pirose há anos, agora com disfagia progressiva para sólidos e perda de 6 kg em 3 meses. Qual a conduta?", ["Dobrar a dose de IBP e reavaliar em 3 meses", "Endoscopia digestiva alta", "Orientar mudanças de dieta apenas", "pHmetria antes de qualquer outro exame", "Manometria isolada"], "B", "Disfagia progressiva com perda de peso é sinal de alarme para neoplasia. A endoscopia é o exame inicial.", "media"),
          vf("Elevar a cabeceira da cama pode ajudar pacientes com sintomas noturnos de refluxo.", "V", "Elevar a cabeceira e evitar refeições perto da hora de deitar reduzem os sintomas noturnos."),
        ],
      },
      {
        nome: "Hepatites virais",
        descricao: "Transmissão\nMarcadores sorológicos da hepatite B\nCronificação",
        questoes: [
          mc("Qual marcador indica imunidade por vacinação contra hepatite B?", ["HBsAg positivo", "Anti-HBs positivo isolado", "Anti-HBc IgM positivo", "HBeAg positivo", "Anti-HBc IgG positivo isolado"], "B", "Anti-HBs positivo com anti-HBc negativo indica imunidade vacinal. O anti-HBc só aparece após contato com o vírus.", "media"),
          mc("Qual hepatite viral tem transmissão predominantemente fecal-oral?", ["Hepatite A", "Hepatite B", "Hepatite C", "Hepatite D", "Todas as anteriores"], "A", "Hepatites A e E são de transmissão fecal-oral. B, C e D são parenterais, sexuais e verticais.", "facil"),
          mc("Qual hepatite viral tem maior taxa de cronificação no adulto?", ["Hepatite A", "Hepatite B", "Hepatite C", "Hepatite E", "Nenhuma cronifica"], "C", "A hepatite C cronifica em cerca de 70% a 85% dos casos. A hepatite B cronifica em menos de 10% dos adultos.", "media"),
          cc("Paciente de 30 anos com icterícia há 1 semana. Exames: HBsAg positivo e anti-HBc IgM positivo. Qual a interpretação?", ["Imunidade vacinal", "Hepatite B aguda", "Hepatite B curada", "Falso positivo", "Hepatite C"], "B", "HBsAg e anti-HBc IgM positivos indicam infecção aguda pelo vírus B.", "media"),
          vf("Existe vacina disponível contra a hepatite C.", "F", "Não há vacina contra a hepatite C. Há vacinas para hepatites A e B, e a vacina B também protege contra a D.", "facil"),
        ],
      },
      {
        nome: "Doença ulcerosa péptica",
        descricao: "H. pylori\nAINEs\nComplicações",
        questoes: [
          mc("Quais são as duas principais causas de úlcera péptica?", ["Estresse e café", "H. pylori e AINEs", "Álcool e tabagismo", "Pimenta e frituras", "Gastrinoma e hipercalcemia"], "B", "A infecção por H. pylori e o uso de AINEs respondem pela grande maioria das úlceras pépticas.", "facil"),
          mc("Qual teste não invasivo é usado para confirmar a erradicação do H. pylori?", ["Sorologia IgG", "Teste respiratório com ureia marcada", "Hemograma", "Amilase", "Ultrassonografia"], "B", "O teste respiratório da ureia (ou antígeno fecal) confirma erradicação. A sorologia permanece positiva por muito tempo após a cura.", "media"),
          mc("Qual a complicação mais comum da úlcera péptica?", ["Perfuração", "Hemorragia digestiva", "Obstrução pilórica", "Malignização", "Pancreatite"], "B", "A hemorragia é a complicação mais frequente. A perfuração é menos comum, porém grave.", "facil"),
          cc("Homem de 50 anos em uso crônico de AINE apresenta dor abdominal súbita e intensa, abdome em tábua e pneumoperitônio na radiografia. Qual o diagnóstico?", ["Úlcera perfurada", "Pancreatite aguda", "Apendicite", "Cólica biliar", "Hemorragia digestiva alta"], "A", "Dor súbita, abdome em tábua e ar livre sob o diafragma indicam perfuração de víscera oca, tipicamente úlcera péptica.", "media"),
          vf("O tratamento de erradicação do H. pylori envolve associação de IBP com antibióticos.", "V", "Esquemas usam IBP com dois ou mais antibióticos (por exemplo, amoxicilina e claritromicina), com ou sem bismuto."),
        ],
      },
    ],
  },
  {
    nome: "Nefrologia",
    cor: "#0F9488",
    topicos: [
      {
        nome: "Lesão renal aguda",
        descricao: "Critérios KDIGO\nPré-renal × renal × pós-renal\nIndicações de diálise",
        questoes: [
          mc("Qual achado sugere lesão renal aguda pré-renal?", ["Sódio urinário > 40 mEq/L", "Fração de excreção de sódio < 1%", "Cilindros granulosos 'barrentos'", "Densidade urinária baixa", "Hematúria dismórfica"], "B", "Na pré-renal o rim está íntegro e retém sódio, com FENa < 1%. Cilindros granulosos sugerem necrose tubular aguda.", "media"),
          mc("Qual destas é indicação de diálise de urgência na lesão renal aguda?", ["Creatinina de 2,0 mg/dL", "Hipercalemia refratária com alteração no ECG", "Ureia de 60 mg/dL", "Oligúria por 2 horas", "Acidose leve com pH 7,32"], "B", "Indicações de urgência: hipercalemia refratária, acidose grave refratária, hipervolemia refratária, uremia sintomática e algumas intoxicações.", "media"),
          mc("Pelo KDIGO, um aumento de creatinina de pelo menos quanto em 48 horas define lesão renal aguda?", ["0,1 mg/dL", "0,3 mg/dL", "1,0 mg/dL", "2,0 mg/dL", "3,0 mg/dL"], "B", "KDIGO: aumento ≥ 0,3 mg/dL em 48 h, ou ≥ 1,5 vez o basal em 7 dias, ou diurese < 0,5 mL/kg/h por 6 h.", "facil"),
          cc("Idoso de 78 anos com retenção urinária, globo vesical palpável e elevação da creatinina. Ultrassom com hidronefrose bilateral. Qual a conduta inicial?", ["Diálise imediata", "Sondagem vesical de alívio", "Hidratação venosa vigorosa", "Furosemida em alta dose", "Biópsia renal"], "B", "LRA pós-renal por obstrução infravesical (provável hiperplasia prostática): a desobstrução com sonda vesical é o primeiro passo.", "facil"),
          vf("Na lesão renal aguda, o débito urinário pode estar normal.", "V", "A LRA pode ser não oligúrica, por exemplo em algumas nefrotoxicidades. Diurese normal não exclui LRA.", "media"),
        ],
      },
      {
        nome: "Doença renal crônica",
        descricao: "Estadiamento por TFG e albuminúria\nComplicações\nNefroproteção",
        questoes: [
          mc("Quais são as duas principais causas de doença renal crônica?", ["Glomerulonefrite e rins policísticos", "Diabetes e hipertensão", "Lúpus e vasculite", "Litíase e infecção urinária", "AINEs e contraste"], "B", "Diabetes e hipertensão respondem pela maior parte dos casos de DRC.", "facil"),
          mc("Uma TFG entre 15 e 29 mL/min/1,73 m² corresponde a qual estágio da DRC?", ["G2", "G3a", "G3b", "G4", "G5"], "D", "G4 corresponde a TFG de 15 a 29. G5 é abaixo de 15, a falência renal.", "media"),
          mc("Qual classe de fármaco reduz a progressão da DRC com albuminúria?", ["IECA ou BRA", "AINE", "Diurético de alça isolado", "Betabloqueador isolado", "Alfabloqueador"], "A", "IECA ou BRA (e também iSGLT2) reduzem a albuminúria e a progressão da DRC.", "facil"),
          cc("Paciente com DRC estágio G4 apresenta hemoglobina de 8,5 g/dL, ferritina e saturação de transferrina adequadas, sem sangramento. Qual a causa mais provável da anemia?", ["Deficiência de ferro", "Deficiência de eritropoetina", "Hemólise", "Deficiência de B12", "Talassemia"], "B", "Com estoques de ferro adequados, a anemia da DRC avançada decorre principalmente da produção reduzida de eritropoetina.", "media"),
          vf("Para definir doença renal crônica, as alterações devem persistir por mais de 3 meses.", "V", "DRC é alteração da estrutura ou função renal por mais de 3 meses, com implicações para a saúde."),
        ],
      },
      {
        nome: "Distúrbios do potássio",
        descricao: "Hipercalemia no ECG\nTratamento de urgência\nHipocalemia",
        questoes: [
          mc("Qual é a alteração eletrocardiográfica mais precoce na hipercalemia?", ["Onda U proeminente", "Onda T apiculada", "Onda Q patológica", "Supra de ST", "Intervalo PR curto"], "B", "A onda T apiculada é o achado mais precoce. Depois vêm alargamento do QRS, perda da onda P e padrão sinusoidal.", "facil"),
          mc("Na hipercalemia com alteração no ECG, qual medida estabiliza a membrana do miocárdio?", ["Gluconato de cálcio endovenoso", "Furosemida", "Resina de troca", "Bicarbonato oral", "Diálise"], "A", "O gluconato de cálcio estabiliza a membrana mas não reduz o potássio. Insulina com glicose e beta-2 agonista deslocam o potássio para dentro das células.", "media"),
          mc("Qual achado no ECG é típico da hipocalemia?", ["Onda T apiculada", "Onda U proeminente", "QRS alargado com onda sinusoidal", "Onda delta", "Bloqueio AV total"], "B", "A hipocalemia causa achatamento da onda T e onda U proeminente.", "facil"),
          cc("Paciente com DRC chega com fraqueza. Potássio de 7,2 mEq/L e ECG com QRS alargado. Qual o primeiro passo?", ["Repetir o exame em 24 horas", "Gluconato de cálcio EV imediatamente", "Dieta pobre em potássio", "Hidratação oral", "Suspender o IECA e dar alta"], "B", "Hipercalemia grave com alteração no ECG: primeiro estabilizar a membrana com cálcio EV, depois deslocar e remover o potássio.", "media"),
          vf("A insulina com glicose reduz o potássio sérico ao deslocá-lo para dentro das células.", "V", "A insulina estimula a Na/K-ATPase, levando o potássio para o meio intracelular. A glicose evita hipoglicemia.", "media"),
        ],
      },
    ],
  },
  {
    nome: "Endocrinologia",
    cor: "#C2408F",
    topicos: [
      {
        nome: "Diabetes mellitus tipo 2",
        descricao: "Critérios diagnósticos\nMetformina\nMetas glicêmicas",
        questoes: [
          mc("Qual valor de glicemia de jejum, confirmado, define diabetes?", ["≥ 100 mg/dL", "≥ 110 mg/dL", "≥ 126 mg/dL", "≥ 140 mg/dL", "≥ 200 mg/dL"], "C", "Glicemia de jejum ≥ 126 mg/dL confirmada define diabetes. Entre 100 e 125 é glicemia de jejum alterada (pré-diabetes).", "facil"),
          mc("Qual o fármaco de primeira linha no DM2 sem contraindicações?", ["Metformina", "Glibenclamida", "Insulina NPH", "Acarbose", "Pioglitazona"], "A", "A metformina é a primeira linha pela eficácia, baixo custo, baixo risco de hipoglicemia e neutralidade no peso.", "facil"),
          mc("Qual valor de HbA1c define diabetes?", ["≥ 5,7%", "≥ 6,0%", "≥ 6,5%", "≥ 7,0%", "≥ 8,0%"], "C", "HbA1c ≥ 6,5% define diabetes. Entre 5,7% e 6,4% é pré-diabetes.", "facil"),
          cc("Homem de 60 anos com DM2, em uso de metformina, com HbA1c de 8,1% e insuficiência cardíaca com FE reduzida. Qual a melhor opção para associar?", ["Inibidor de SGLT2", "Pioglitazona", "Sulfonilureia", "Acarbose", "Nenhuma, manter só metformina"], "A", "iSGLT2 reduz desfechos cardiovasculares e internações por IC. A pioglitazona é contraindicada na IC por reter líquido.", "dificil"),
          vf("Metformina causa hipoglicemia com frequência quando usada isoladamente.", "F", "Em monoterapia, a metformina raramente causa hipoglicemia, porque não estimula a secreção de insulina.", "facil"),
        ],
      },
      {
        nome: "Hipotireoidismo",
        descricao: "Tireoidite de Hashimoto\nTSH e T4 livre\nReposição com levotiroxina",
        questoes: [
          mc("Qual é a causa mais comum de hipotireoidismo em áreas com iodo suficiente?", ["Deficiência de iodo", "Tireoidite de Hashimoto", "Tumor hipofisário", "Doença de Graves", "Tireoidite subaguda"], "B", "A tireoidite crônica autoimune (Hashimoto) é a principal causa onde não há deficiência de iodo.", "facil"),
          mc("Qual o perfil laboratorial do hipotireoidismo primário?", ["TSH baixo, T4 livre alto", "TSH alto, T4 livre baixo", "TSH baixo, T4 livre baixo", "TSH normal, T4 livre alto", "TSH alto, T4 livre alto"], "B", "No hipotireoidismo primário a tireoide falha, o T4 cai e o TSH sobe por perda do feedback negativo.", "facil"),
          mc("Como deve ser tomada a levotiroxina?", ["Junto com o café da manhã", "Em jejum, 30 a 60 minutos antes do café", "À noite, junto com cálcio", "Apenas quando houver sintomas", "Junto com sulfato ferroso"], "B", "A absorção é melhor em jejum. Cálcio, ferro e alimentos reduzem a absorção.", "facil"),
          cc("Mulher de 45 anos com cansaço, ganho de peso, constipação e pele seca. TSH 18 mU/L, T4 livre baixo e anti-TPO positivo. Qual a conduta?", ["Iniciar levotiroxina", "Iniciar metimazol", "Iodo radioativo", "Apenas repetir exames em 1 ano", "Corticoide"], "A", "Hipotireoidismo primário franco por Hashimoto: tratar com levotiroxina, ajustando a dose pelo TSH.", "facil"),
          vf("No hipotireoidismo central (hipofisário), o TSH é o melhor exame para ajustar a dose de levotiroxina.", "F", "No hipotireoidismo central o TSH não é confiável. O ajuste é feito pelo T4 livre.", "dificil"),
        ],
      },
      {
        nome: "Cetoacidose diabética",
        descricao: "Critérios diagnósticos\nHidratação e insulina\nPotássio",
        questoes: [
          mc("Qual tríade define a cetoacidose diabética?", ["Hiperglicemia, cetonemia e acidose metabólica", "Hipoglicemia, cetose e alcalose", "Hiperglicemia, hipernatremia e alcalose", "Hiperglicemia, hiperosmolaridade sem cetose", "Acidose respiratória, hiperglicemia e hipocalemia"], "A", "CAD: glicemia elevada (em geral > 250 mg/dL), cetonemia e acidose metabólica com ânion gap aumentado.", "facil"),
          mc("Qual a primeira medida no tratamento da cetoacidose diabética?", ["Insulina em bolus antes de qualquer outra medida", "Hidratação venosa com soro fisiológico", "Bicarbonato de rotina", "Antibiótico empírico", "Dieta oral"], "B", "A hidratação vigorosa com cristaloide é a primeira medida. A insulina vem depois de conferir o potássio.", "facil"),
          mc("Abaixo de qual valor de potássio a insulina deve ser adiada na CAD até a reposição?", ["5,5 mEq/L", "5,0 mEq/L", "4,5 mEq/L", "3,3 mEq/L", "2,0 mEq/L"], "D", "Com K < 3,3 mEq/L, repor potássio antes da insulina, que joga o potássio para dentro das células e pode causar arritmia.", "media"),
          cc("Jovem de 17 anos com DM1, vômitos, dor abdominal e respiração de Kussmaul. Glicemia de 480 mg/dL, pH 7,10, bicarbonato 8 mEq/L, cetonúria positiva e K de 4,8 mEq/L. Qual a conduta?", ["Soro fisiológico e insulina regular EV contínua", "Bicarbonato EV como primeira medida", "Insulina NPH subcutânea e alta", "Apenas hidratação oral", "Cirurgia por abdome agudo"], "A", "CAD grave com potássio adequado: hidratação EV e insulina regular EV contínua. Bicarbonato só se pH < 6,9. A dor abdominal costuma ceder com o tratamento.", "media"),
          vf("Durante o tratamento da CAD, o potássio sérico tende a cair.", "V", "A insulina e a correção da acidose levam o potássio para dentro das células. Por isso é preciso monitorar e repor."),
        ],
      },
    ],
  },
];

// IDs fixos e determinísticos: é o que torna o seed idempotente.
const seedId = (n: number) => `5eed0000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const linhasDisciplinas = DADOS.map((d, di) => ({ id: seedId((di + 1) * 10000), nome: d.nome, cor: d.cor, ordem: di }));
const linhasTopicos = DADOS.flatMap((d, di) =>
  d.topicos.map((t, ti) => ({
    id: seedId((di + 1) * 10000 + (ti + 1) * 100),
    disciplinaId: seedId((di + 1) * 10000),
    nome: t.nome,
    descricao: t.descricao,
  })),
);
const linhasQuestoes = DADOS.flatMap((d, di) =>
  d.topicos.flatMap((t, ti) =>
    t.questoes.map((q, qi) => ({
      ...q,
      id: seedId((di + 1) * 10000 + (ti + 1) * 100 + qi + 1),
      topicoId: seedId((di + 1) * 10000 + (ti + 1) * 100),
      origem: "manual" as const,
    })),
  ),
);

// Gabarito tem de existir entre as alternativas: falha cedo se o seed estiver errado.
for (const q of linhasQuestoes) {
  const ok = q.tipo === "verdadeiro_falso" ? q.gabarito === "V" || q.gabarito === "F" : q.alternativas?.some((a) => a.letra === q.gabarito);
  if (!ok) throw new Error(`Gabarito inválido na questão ${q.id}: ${q.enunciado}`);
}

async function main() {
  const d = await db.insert(disciplinas).values(linhasDisciplinas).onConflictDoNothing().returning({ id: disciplinas.id });
  const t = await db.insert(topicos).values(linhasTopicos).onConflictDoNothing().returning({ id: topicos.id });
  const q = await db.insert(questoes).values(linhasQuestoes).onConflictDoNothing().returning({ id: questoes.id });
  const p = await db.insert(perfil).values({ id: 1 }).onConflictDoNothing().returning({ id: perfil.id });
  console.log(
    `Seed: disciplinas +${d.length}/${linhasDisciplinas.length}, tópicos +${t.length}/${linhasTopicos.length}, ` +
      `questões +${q.length}/${linhasQuestoes.length}, perfil +${p.length}/1`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
