// Domínio do tópico (CLAUDE.md §4.1). Função pura.

const JANELA = 20;
const DECAIMENTO = 0.9;

/**
 * Média ponderada das últimas 20 respostas, 0..100. `acertos` vem da MAIS RECENTE para a mais antiga:
 * a mais recente pesa 1,0 e cada anterior ×0,9. Sem respostas = 0.
 */
export function calcularDominio(acertos: boolean[]) {
  let soma = 0;
  let pesos = 0;
  acertos.slice(0, JANELA).forEach((acertou, i) => {
    const peso = DECAIMENTO ** i;
    pesos += peso;
    if (acertou) soma += peso;
  });
  return pesos ? (soma / pesos) * 100 : 0;
}
