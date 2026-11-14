// Provas (CLAUDE.md §4.2 e §4.6). provas.data é date sem hora: "hoje" é o dia civil em America/Sao_Paulo.

const DIA = 24 * 60 * 60 * 1000;
export const JANELA_PROVA_DIAS = 14;

const diaSP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }); // en-CA = AAAA-MM-DD

/** Dia de hoje (AAAA-MM-DD) no fuso de São Paulo. 22h em SP já é o dia seguinte em UTC. */
export function hojeEmSP(agora: Date) {
  return diaSP.format(agora);
}

/** Dias de `hoje` até `data` (ambos AAAA-MM-DD): hoje = 0, amanhã = 1, ontem = -1. */
export function diasAte(data: string, hoje: string) {
  return Math.round((Date.parse(data) - Date.parse(hoje)) / DIA);
}

/** Ids dos tópicos que têm prova de hoje até o 14º dia (inclusive). */
export function topicosComProvaEm14Dias(provas: { data: string; topicoIds: string[] }[], hoje: string) {
  const ids = new Set<string>();
  for (const p of provas) {
    const d = diasAte(p.data, hoje);
    if (d >= 0 && d <= JANELA_PROVA_DIAS) p.topicoIds.forEach((t) => ids.add(t));
  }
  return ids;
}

/** Contagem regressiva exibida na lista. */
export function contagemRegressiva(dias: number) {
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias > 1) return `em ${dias} dias`;
  return dias === -1 ? "ontem" : `há ${-dias} dias`;
}
