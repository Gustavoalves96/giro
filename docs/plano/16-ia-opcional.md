# Sessão 16 — IA opcional

**Depende de:** 06, 08
**Ler antes:** CLAUDE.md §2 (Restrições), §5 ("IA (opcional)"), §6

## Objetivo
Dois usos de IA, opcionais, com custo zero e cache.

## Entregáveis
- Dependência `@google/genai`.
- `lib/ai/provider.ts`: interface `AIProvider { explicar(q): Promise<string>; gerarQuestoes(topico): Promise<string> }` e `getProvider()`, que devolve `null` sem `GEMINI_API_KEY`.
- `lib/ai/gemini.ts`: implementação com Gemini Flash (plano gratuito). Erro 429 → erro tipado `LimiteIA`.
- `iaDisponivel()` no servidor; sem chave, os botões **não aparecem**.
- **"Explique melhor (IA)"** no feedback de questão errada: a Server Action lê `explicacoes_ia` primeiro; se não houver, chama, salva e mostra. Envia só enunciado, alternativas, gabarito e explicação.
- **"Gerar com IA"** em `/topicos/[id]`: envia só nome + descrição do tópico, pede 5 questões no mesmo JSON, passa pelo mesmo `parse-json` e pela pré-visualização da sessão 06, grava com `origem='ia'`. Selo "gerada por IA, revise" na lista.
- 429 → "Limite diário de IA atingido, tente amanhã." Outros erros → mensagem amigável.

## Regras e detalhes
- Só por clique explícito; nada automático.
- **Nunca** enviar material dos professores.
- Timeout curto (limite das funções no Vercel Hobby).

## Testes
- Com provider falso: a segunda chamada de "explicar" não chama o provider (cache); 429 vira `LimiteIA`; sem chave → `getProvider()` retorna `null`.

## Pronto quando
- Com chave: explicar uma questão, conferir a linha em `explicacoes_ia`, clicar de novo e confirmar que não houve chamada; gerar questões e importar. Sem chave: os botões somem.
- lint, test e build limpos.

## Fora do escopo
Outros provedores.
