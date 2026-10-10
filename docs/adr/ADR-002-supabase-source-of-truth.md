# ADR-002 — Supabase como fonte da verdade operacional

- Status: aceito
- Data: 2026-10-10

## Contexto

Fatos financeiros, identidade, autorização e comprovantes precisam de um lugar durável. A leitura automática produz uma hipótese, não um lançamento.

## Decisão

PostgreSQL no Supabase é a fonte da verdade dos cadastros, documentos, extrações, transações, pendências, duplicidades, recorrências, reembolsos e auditoria.

Supabase Auth é a fonte da verdade da identidade. O perfil da aplicação referencia `auth.users` e não copia segredo de autenticação.

Supabase Storage é a fonte da verdade dos bytes do comprovante. A linha em `financial_documents` guarda a referência, o tipo, o tamanho e o hash, não uma cópia pública do arquivo.

A resposta da Gemini API não é fonte da verdade. Uma extração validada é evidência imutável. A transação confirmada é o fato usado pelos totais. Conversa, prompt e texto livre do modelo não são gravados como lançamento.

A autorização de linhas e arquivos expostos é RLS. A aplicação não mantém um segundo mecanismo paralelo de posse.

## Consequências

- Relatórios leem o banco.
- Regenerar uma leitura não altera uma transação confirmada.
- Apagar um objeto do Storage sem transição explícita é defeito, porque o comprovante deixa de existir.
- Tipos de aplicação devem ser gerados do schema a partir da sprint que criar as tabelas.

## Alternativas recusadas

- Usar o histórico do chat como memória financeira.
- Espelhar os fatos num armazenamento local do navegador como fonte concorrente.
- Implementar autorização somente em código de interface.
