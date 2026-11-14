# Sessão 19 — Polimento e estados vazios

**Depende de:** 12–16 (vem antes de 17 e 18, que fazem o próprio polimento)
**Ler antes:** design: "Lacunas e próximos passos", "Acessibilidade"

## Objetivo
Fechar as lacunas do design e revisar acessibilidade antes do uso real.

## Entregáveis
- Conferir o primeiro uso guiado e o manifest (feitos na 14) com banco vazio.
- `loading.tsx` nas rotas com dados; estado "Importando…" com botão desativado.
- Estados vazios revisados em todas as telas.
- Apagar `/dev/tokens` (`/dev/questao` saiu na 12).
- Revisão de acessibilidade: `aria-label` em botões só de ícone, foco visível, contraste AA nos 2 temas, descrição em texto de gráficos e mapas de calor, `prefers-reduced-motion` em todas as animações.
- Atualizar o CLAUDE.md com o que mudou ao longo das sessões.

## Testes
- Rodar a suíte inteira; nada novo obrigatório.

## Pronto quando
- Banco vazio (branch de teste no Neon) → o app guia até a primeira rodada.
- lint, test e build limpos; deploy no Vercel atualizado e conferido.
- **Checklist manual para o usuário** (não dá para provar daqui): Safari do iPadOS em retrato e paisagem, toque na roleta e nas alternativas, timer com a tela bloqueada, adicionar à tela de início, tema escuro do sistema.

## Fora do escopo
Novas features.
