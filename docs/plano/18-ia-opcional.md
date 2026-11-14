# Sessão 18 — IA opcional

**Depende de:** 08, 12
**Ler antes:** CLAUDE.md §2 (Restrições), §6

## Objetivo
Um uso de IA, opcional, com custo zero e cache: "Explique melhor". Gerar questões pelo nome do tópico foi **cortado** no checkup de 13/11/2026 (questão que não vem das fontes dela contraria o princípio do produto); atualizar o CLAUDE.md §5 e §6 nesta sessão para refletir isso.

## Entregáveis
- Dependência `@google/genai`.
- `lib/ai/provider.ts`: interface `AIProvider { explicar(q): Promise<string> }` e `getProvider()`, que devolve `null` sem `GEMINI_API_KEY`.
- `lib/ai/gemini.ts`: implementação com Gemini Flash (plano gratuito). Erro 429 → erro tipado `LimiteIA`.
- `iaDisponivel()` no servidor; sem chave, os botões **não aparecem**.
- **"Explique melhor (IA)"** no feedback de questão errada: a Server Action lê `explicacoes_ia` primeiro; se não houver, chama, salva e mostra. Envia só enunciado, alternativas, gabarito e explicação.
- 429 → "Limite diário de IA atingido, tente amanhã." Outros erros → mensagem amigável.

## Regras e detalhes
- Só por clique explícito; nada automático.
- **Nunca** enviar material dos professores.
- Timeout curto (limite das funções no Vercel Hobby).

## Testes
- Com provider falso: a segunda chamada de "explicar" não chama o provider (cache); 429 vira `LimiteIA`; sem chave → `getProvider()` retorna `null`.

## Pronto quando
- Com chave: explicar uma questão, conferir a linha em `explicacoes_ia`, clicar de novo e confirmar que não houve chamada. Sem chave: o botão some.
- lint, test e build limpos.

## Fora do escopo
Outros provedores. Gerar questões com IA (cortado). Gerar ou explicar procedimentos com IA (decisão da sessão 10: checklist vem só das fontes dela).
