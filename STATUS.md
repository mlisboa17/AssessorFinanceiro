# Assessor Financeiro — Status Atual

## Estado do Projeto

- Sprint 00 — DONE
- Sprint 01 — DONE
- Sprint 02 — NOT STARTED

## Stack Confirmada

- Next.js 16
- React
- TypeScript
- Supabase
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage ainda não implementado
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

Objetivo:

- bucket privado financial-documents
- upload JPG / PNG / PDF
- salvar arquivo original antes de processamento
- criar financial_documents
- SHA-256
- status inicial RECEIVED
- isolamento por usuário
- cleanup de arquivo órfão
- integração com audit log

REGRA PRINCIPAL:

SALVAR PRIMEIRO.
PROCESSAR DEPOIS.

Nesta sprint NÃO implementar:

- Gemini
- OCR
- transactions
- deduplicação
- recorrência
- reembolso
- dashboard financeiro

## Próximo Passo

Executar o prompt aprovado da:

SPRINT 02 — DOCUMENT INGESTION

Antes de qualquer nova feature.
