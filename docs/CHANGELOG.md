# Changelog

O formato segue a ideia de registro cronológico. Versões de produto só aparecem quando existir software versionado.

## [Unreleased]

### Added

- Contas e cartões 01C em 2026-10-10: tabelas `public.financial_accounts` e `public.payment_cards`, ligadas à entidade do mesmo usuário, com RLS de posse e telas `/app/accounts` e `/app/cards`. Sem transação, categoria, documento ou Gemini.
- Entidades 01B em 2026-10-10: tabela `public.entities` para pessoa física e empresa, com RLS de posse, e tela `/app/entities` para listar, criar, renomear e ativar ou desativar.
- Autenticação 01A em 2026-10-10: cadastro e entrada por e-mail e senha, saída, área `/app` protegida no servidor e clientes Supabase de browser e servidor. Sem secret key, sem tabelas financeiras e sem Gemini.
- Confirmação de e-mail da 01A: o código retornado pelo Supabase é trocado por sessão em `/auth/callback` antes do acesso a `/app`.
- Fundação documental em 2026-10-10: especificação de produto, arquitetura, modelo lógico, regras de negócio, regras de IA, segurança, UX, roadmap, definição de pronto, decisões, cinco ADRs e as sprints 00 a 10.
- Revisão crítica de produto e de arquitetura incorporada às premissas e às decisões em aberto.
- Esqueleto Next.js 16 com TypeScript, ESLint, página inicial e teste em `node:test`.
- `.env.example` sem valores e `.gitignore` cobrindo arquivos de ambiente.

### Changed

- Correções aprovadas da especificação: um documento pode originar zero, uma ou várias transações; `currency_code` explícito com default BRL; categoria como classificação; narrativa da revisão pode explicar números calculados e não pode inventá-los.
- O-02, O-04 e O-08 registradas como aprovadas. O-01, O-05, O-06 e O-07 permanecem abertas.

### Fora deste conjunto

- Categoria, perfil, auditoria, bucket e o restante do CRUD financeiro.
- Integração com a Gemini API.
- Funcionalidade financeira.
