# ADR-001 — Stack inicial

- Status: aceito
- Data: 2026-10-10

## Contexto

O produto precisa de interface mobile-first, identidade, banco relacional, arquivo privado e leitura de comprovante. A equipe quer uma base única, incremental e operável por uma pessoa, sem plataforma distribuída.

## Decisão

O frontend é Next.js com TypeScript. A persistência, a autenticação e os arquivos usam Supabase: PostgreSQL, Auth e Storage. A leitura automática usa a Gemini API. O desenvolvimento acontece no Cursor, com Git, e o remoto será GitHub quando o repositório remoto for criado.

Edge Functions ficam disponíveis apenas como adaptação futura, se um limite concreto de execução aparecer. Elas não fazem parte do desenho inicial.

Não será introduzido outro framework principal nem outro banco sem necessidade comprovada e um ADR novo.

## Consequências

- Há um aplicativo e um projeto Supabase para operar.
- A interface e os comandos de servidor compartilham tipos e validação.
- A chave de IA e a service role, se algum dia for usada, permanecem no servidor.
- Trocar de stack deixa de ser refatoração local e passa a exigir ADR.

## Alternativas recusadas

- Backend separado em outro framework, porque duplicaria autenticação e deploy.
- Banco além do PostgreSQL do Supabase, porque o modelo é relacional e transacional.
- Framework de agentes ou orquestrador de modelos, porque o contrato é um pedido estruturado por comprovante.
