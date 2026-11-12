# Sessão 03 — Layout, navegação e Meu perfil

**Depende de:** 02
**Ler antes:** CLAUDE.md §7, §8 · design: "Navegação", "Adaptação por dispositivo"

## Objetivo
Casca do app com navegação responsiva, layout de foco para as sessões de estudo e a página Meu perfil.

## Entregáveis
- `app/(app)/layout.tsx` com os 6 destinos: Início `/`, Roleta `/roleta`, Revisão `/revisao`, Disciplinas `/disciplinas`, Estatísticas `/estatisticas`, Provas `/provas`.
- Navegação responsiva (um componente, o CSS decide):
  - `< md` (celular): barra inferior de 76 px, 5 abas (Provas sai).
  - `md` a `< xl` (iPad): trilho lateral de 96 px, ícone sobre rótulo.
  - `≥ xl` (notebook): barra lateral de 240 px com logotipo "giro" e rótulo ao lado do ícone.
  - Item ativo em Brasa suave. Ícones `lucide-react`.
- `app/(app)/(foco)/layout.tsx`: sem navegação; só "Sair" e o indicador Estudo · Questões · Resultado (recebe a etapa atual).
- Páginas placeholder para cada destino.
- Botão de tema (claro / escuro / sistema).
- **Meu perfil** `app/(app)/perfil/`: acesso pelo rodapé do trilho / barra lateral e por ícone no topo no celular. Campo "Como você quer ser chamada?" (Zod: 1–40 caracteres, trim). Server Action com `requireUser()` fazendo upsert em `perfil` (id = 1). Mostra o e-mail logado e o botão "Sair".
- `lib/db/perfil.ts`: `getPerfil()` (usado na saudação do Início, sessão 12).

## Regras e detalhes
- Alvos de toque ≥ 44 px.
- No celular, o conteúdo respeita a barra inferior (padding + `env(safe-area-inset-bottom)`).

## Testes
- Schema do nome: vazio, só espaços, 41 caracteres.

## Pronto quando
- Navegar por todas as abas nas larguras 1440, 1180, 820 e 390 px, nos dois temas.
- Salvar o nome em Meu perfil e conferir a linha no banco; recarregar mostra o nome salvo.
- lint, test e build limpos.

## Fora do escopo
Conteúdo real das páginas.
