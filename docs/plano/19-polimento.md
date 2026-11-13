# Sessão 19 — Polimento e estados vazios

**Depende de:** todas
**Ler antes:** design: "Lacunas e próximos passos", "Acessibilidade"

## Objetivo
Fechar as lacunas do design e revisar acessibilidade antes do uso real.

## Entregáveis
- Primeiro uso guiado: sem disciplinas → "Crie sua primeira disciplina"; sem questões → "Gere questões com o NotebookLM" (e a opção de procedimentos); refletir no Início e na Roleta.
- `loading.tsx` nas rotas com dados; estados "Importando…" e "Gerando…" com botão desativado.
- Estados vazios revisados em todas as telas; mensagem de limite de IA.
- Apagar `/dev/tokens` e `/dev/questao`.
- Revisão de acessibilidade: `aria-label` em botões só de ícone, foco visível, contraste AA nos 2 temas, descrição em texto de gráficos e mapas de calor, `prefers-reduced-motion` em todas as animações.
- `app/manifest.ts` + ícone (a marca da roleta) para "Adicionar à tela de início" no iPad.
- Atualizar o CLAUDE.md com o que mudou ao longo das sessões.

## Testes
- Rodar a suíte inteira; nada novo obrigatório.

## Pronto quando
- Banco vazio (branch de teste no Neon) → o app guia até a primeira rodada.
- lint, test e build limpos; deploy no Vercel atualizado e conferido.
- **Checklist manual para o usuário** (não dá para provar daqui): Safari do iPadOS em retrato e paisagem, toque na roleta e nas alternativas, timer com a tela bloqueada, adicionar à tela de início, tema escuro do sistema.

## Fora do escopo
Novas features.
