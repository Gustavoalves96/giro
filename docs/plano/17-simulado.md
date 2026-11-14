# Sessão 17 — Simulado

**Depende de:** 08, 12
**Ler antes:** CLAUDE.md §4.6

## Objetivo
Prova simulada com tempo total e feedback só no fim.

## Entregáveis
- `/simulado` (acesso pela Roleta e pelo Início): escolher disciplinas, nº de questões (padrão 20) e tempo total (padrão 1 min por questão).
- Sorteio de N questões ativas aleatórias no servidor; sessão `modo='simulado'`.
- Prova em layout de foco: `Questao` com `feedback='final'`, timer total visível, navegação anterior / próxima, mapa de questões respondidas, "Entregar". Tempo esgotado → entrega automática.
- Cada resposta final grava em `respostas` e **atualiza o FSRS** (como nos outros modos).
- Resultado: nota, acertos, tempo, gabarito comentado (explicação + fonte) questão por questão; recalcular o domínio dos tópicos envolvidos.

## Regras e detalhes
- Simulado não conta para o recorde de pontuação.
- Só questões: procedimentos (sessões 10–11) ficam fora, porque são sem pressão de tempo.
- Trocar de resposta antes de entregar é permitido: grava só a resposta final de cada questão (na entrega).
- As respostas em andamento e o início da prova ficam em `sessionStorage` (com try/catch): recarregar a aba no iPad não perde a prova nem zera o tempo.
- FSRS no simulado: nota só por acerto/erro (Again ou Good); o tempo por questão não é confiável quando se navega entre elas.
- Usa `finalizar()` genérico da sessão 12 (domínio de todos os tópicos envolvidos).

## Testes
- Função pura de correção do lote (respostas finais → acertos e nota).

## Pronto quando
- Fazer um simulado curto (3 questões, 2 min) inteiro e outro deixando o tempo esgotar; conferir `respostas`, `revisoes` e `sessoes`.
- lint, test e build limpos.

## Fora do escopo
Estatísticas específicas de simulado.
