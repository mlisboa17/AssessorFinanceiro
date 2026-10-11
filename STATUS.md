# Assessor Financeiro — Status Atual

## Estado do Projeto

- Sprint 00 — DONE
- Sprint 01 — DONE
- Sprint 02 funcional — NOT STARTED

## Stack Confirmada

- Next.js 16
- React
- TypeScript
- Supabase
- Supabase Auth
- Supabase PostgreSQL
- Supabase CLI autenticado e linked ao projeto correto
- project ref: nqgntmhcpfrwcyoyefqp
- bucket privado financial-documents já existe no remoto
- upload da aplicação ainda não implementado
- Gemini ainda não implementado

## Auth

Status:
DONE

Validado:
- signup
- confirmação de e-mail
- callback SSR/PKCE
- login
- sessão
- /app protegido
- logout

## Data Core

Implementado e validado:

- entities
- financial_accounts
- payment_cards
- categories

Regras centrais:

- ownership por user_id
- RLS
- grants mínimos
- cross-user bloqueado
- anon bloqueado
- paid_by vs belongs_to permanece decisão central do produto

## Audit Log

Implementado:

private.audit_log

Audita:

- entities
- financial_accounts
- payment_cards
- categories

Características:

- imutável para application roles
- escrita por trigger
- actor_user_id
- owner_user_id
- old_data
- new_data
- changed_fields
- sem acesso direto pela Data API

## Segurança

Validado:

- RLS
- ownership
- spoofing de user_id bloqueado
- cross-user bloqueado
- anon bloqueado
- secret key não usada no client
- service role não usada pela aplicação

Riscos aceitos:

- advisory braces no lint de desenvolvimento
- rls_auto_enable documentado
- leaked password protection ainda desligada
- ON DELETE RESTRICT até decisão O-03

## Categorias

Modelo adotado:

- categorias system compartilhadas
- user_id = null
- is_system = true
- categorias privadas por usuário
- nenhuma cópia das categorias system por usuário

## Banco

Histórico de migrations local e remoto totalmente alinhado.

Migration recuperada:

- 20261011000913_add_financial_documents.sql

Migration corretiva aplicada:

- 20261011023819_restrict_financial_documents_grants.sql

financial_documents existe no Supabase remoto.

Grants de public.financial_documents:

- authenticated possui apenas SELECT e INSERT
- authenticated não possui UPDATE, DELETE, TRUNCATE, REFERENCES ou TRIGGER
- anon não possui privilégios

## Validação de interface

UI VALIDATION POLICY

Browser/UI validation is human-controlled. Agents may run automated terminal/headless checks, but must not open or navigate a browser unless explicitly authorized.

Agentes não podem abrir navegador. Validação visual é humana.

Validação humana pendente fica marcada como `HUMAN_VALIDATION_REQUIRED`.

## Git

Branch:
main

Remote:
origin

URL:
https://github.com/mlisboa17/AssessorFinanceiro.git

Status esperado:
working tree clean
main sincronizada com origin/main

## Próxima Sprint

Sprint 02 — Document Ingestion

O schema remoto de comprovantes já existe. A sprint funcional ainda precisa implementar o código da aplicação:

- upload server-side
- SHA-256
- validação MIME/tamanho
- cleanup
- UI
- testes
- docs

REGRA:

SALVAR PRIMEIRO, PROCESSAR DEPOIS.

Gemini NÃO implementado.

Nesta sprint NÃO implementar:

- Gemini
- OCR
- transactions
- deduplicação
- recorrência
- reembolso
- dashboard financeiro

## Próximo Passo

Retomar Sprint 02 funcional.
