# Modelo de dados

Estado: modelo lógico de 2026-10-10, com a tabela `public.entities` materializada na entrega 01B. As demais tabelas continuam lógicas até a sprint indicada em "Materialização".

Convenções para quando o schema for escrito:

- Identificadores `uuid`, gerados no Postgres.
- Instante em `timestamptz`. Data de lançamento em `date`, sem hora e sem fuso, porque o comprovante traz um dia civil.
- Dinheiro em `bigint` centavos, nunca negativo. `currency_code` é coluna explícita, obrigatória, com default `BRL`. O MVP não omite a moeda para subentender real.
- Nomes de tabela e coluna em `snake_case`, em inglês.
- Toda tabela de negócio no schema exposto nasce com RLS e índice em `user_id`.
- Chave estrangeira recebe índice na sprint que cria a consulta que a filtra.
- Cadastro deixa de aparecer por `archived_at`. Histórico financeiro não usa exclusão física neste roadmap.
- `user_id` referencia o usuário da aplicação, que por sua vez referencia `auth.users`.

## User

O User autenticado é `auth.users`. A aplicação não reimplementa senha, sessão nem JWT.

O perfil da aplicação é a tabela `profiles`.

| Coluna | Notas |
| --- | --- |
| `id` | Igual a `auth.users.id` |
| `display_name` | Pode começar vazio |
| `created_at` | |
| `updated_at` | |

Materialização: Sprint 01.

Posse: a linha existe somente para o próprio `id`.

## Entity

Pessoa física ou empresa à qual dados financeiros podem pertencer. Cada linha pertence a exatamente um usuário autenticado. Um usuário pode ter várias entidades. Empresa não é um usuário separado.

Materialização: entrega 01B, em 2026-10-10. Tabela `public.entities`.

| Coluna | Notas |
| --- | --- |
| `id` | `uuid` primário, `gen_random_uuid()` |
| `user_id` | Dono. `not null`, referencia `auth.users(id)` com `on delete restrict` |
| `type` | `PERSON` ou `COMPANY` |
| `name` | Texto não vazio depois de remover espaços das pontas |
| `document_number` | CPF para `PERSON` e CNPJ para `COMPANY`. Nulo se desconhecido. Só dígitos, sem máscara |
| `is_active` | `true` por omissão. Desativar não apaga a linha |
| `created_at` | `timestamptz` |
| `updated_at` | `timestamptz`, preenchido por trigger específica no schema `private` |

A entrega 01B não cria entidade no cadastro nem no primeiro acesso. Sem entidades, a tela mostra o estado vazio. A leitura de comprovante continua sem inserir entidade.

`document_number` aceita nulo ou uma sequência de dígitos. Dígito verificador de CPF/CNPJ e unicidade entre entidades ativas do mesmo usuário não fazem parte desta entrega.

Não há policy de `DELETE` e a interface não apaga a linha. Enquanto existir entidade, a exclusão do usuário autenticado fica bloqueada pela chave estrangeira, até a decisão O-03.

A entrega 01C acrescentou a restrição única `(id, user_id)`. A chave primária continua sendo `id`. O par existe para conta e cartão referenciarem a entidade e o mesmo dono.

## FinancialAccount

Conta financeira de uma entidade. O `user_id` guarda a posse. A conta não pertence ao usuário sem entidade.

Materialização: entrega 01C, em 2026-10-10. Tabela `public.financial_accounts`.

| Coluna | Notas |
| --- | --- |
| `id` | `uuid` primário |
| `user_id` | Dono. Referencia `auth.users(id)` com `on delete restrict` |
| `entity_id` | Entidade dona da conta. Com `user_id`, referencia `entities(id, user_id)` com `on delete restrict` |
| `name` | Texto não vazio |
| `institution_name` | Nulo se não houver |
| `account_type` | `CHECKING`, `SAVINGS`, `DIGITAL`, `CASH` ou `OTHER` |
| `last_four` | Quatro dígitos ou nulo |
| `is_active` | `true` por omissão |
| `created_at` | |
| `updated_at` | Trigger específica `private.set_financial_accounts_updated_at` |

A conta não é o cartão. Esta entrega não grava moeda na conta e não cria transação. `currency_code` continua obrigatório nas linhas monetárias futuras.

## PaymentCard

Cartão de uma entidade. O cadastro guarda nome, emissor, bandeira e exatamente quatro dígitos. Não há coluna para número completo, código de segurança, validade, senha ou token.

Materialização: entrega 01C, em 2026-10-10. Tabela `public.payment_cards`.

| Coluna | Notas |
| --- | --- |
| `id` | `uuid` primário |
| `user_id` | Dono. Referencia `auth.users(id)` com `on delete restrict` |
| `entity_id` | Entidade responsável. Com `user_id`, referencia `entities(id, user_id)` com `on delete restrict` |
| `name` | Texto não vazio |
| `issuer_name` | Nulo se desconhecido |
| `brand` | Nulo se desconhecido |
| `last_four` | Exatamente quatro dígitos. Obrigatório |
| `is_active` | `true` por omissão |
| `created_at` | |
| `updated_at` | Trigger específica `private.set_payment_cards_updated_at` |

Esta entrega não liga o cartão a uma conta. A ligação automática por final continua exigindo exatamente quatro dígitos e exatamente um cartão ativo correspondente, quando a sprint de leitura existir.

## Merchant

Estabelecimento é um conceito: o nome e, quando existir, o CPF ou CNPJ lidos no comprovante.

Materialização: nenhuma tabela neste roadmap, pela premissa P-15. `merchant_name` e `merchant_tax_id` acompanham a extração e podem ser copiados para a transação no ato da confirmação. A transação guarda o texto que o usuário deixou valer, mesmo que a extração original diga outra coisa.

Uma tabela mestre só volta a ser considerada quando houver um caso real de fundir ou renomear o mesmo estabelecimento em muitos lançamentos. Isso exige decisão nova.

## Category

Classificação financeira. Não é fato extraído do comprovante.

Materialização: entrega 01D, em 2026-10-10. Tabela `public.categories`.

| Coluna | Notas |
| --- | --- |
| `id` | `uuid` primário. O slug não é chave primária |
| `user_id` | Nulo na categoria de sistema. Obrigatório na categoria do usuário. Referencia `auth.users(id)` com `on delete restrict` |
| `name` | Texto não vazio |
| `slug` | Minúsculo, estável, sem espaço. Derivado do nome |
| `kind` | `EXPENSE`, `INCOME` ou `TRANSFER` |
| `parent_id` | Opcional. Referencia `categories(id)` com `on delete restrict`. Não pode ser a própria linha |
| `is_system` | `true` somente quando `user_id` é nulo |
| `is_active` | `true` por omissão |
| `created_at` | |
| `updated_at` | Trigger específica `private.set_categories_updated_at` |

As categorias padrão são linhas de sistema, visíveis a todo usuário autenticado e sem dono. A entrega 01D não copia essa lista para cada usuário. A auditoria 01E manteve essa decisão: as 23 linhas padrão não são duplicadas por usuário. Categorias personalizadas pertencem a um usuário. A interface não edita a árvore: `parent_id` fica no banco, sem tela de hierarquia.

Slug de sistema é único dentro do mesmo `kind`. Slug de usuário é único entre as categorias ativas do mesmo usuário e do mesmo `kind`. A leitura futura não cria categoria.

## FinancialDocument

O comprovante original e o estado da captura.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | |
| `storage_bucket` | Bucket privado |
| `storage_path` | Prefixo do usuário e nome gerado; o nome original não entra no caminho |
| `original_filename` | Apenas para exibição |
| `mime_type` | Allowlist da Sprint 02 |
| `byte_size` | |
| `sha256` | Hash calculado no cliente no upload; a confiança desse hash para duplicidade é reforçada na Sprint 05 |
| `status` | Um dos status de documento |
| `source` | `camera`, `image_upload` ou `pdf_upload` na Sprint 02; `share` só na Sprint 10 |
| `received_at` | |
| `created_at` | |
| `updated_at` | |

Materialização: Sprint 02.

Status: `RECEIVED`, `PROCESSING`, `EXTRACTED`, `CONFIRMED`, `PENDING`, `REJECTED`, `FAILED`.

O documento não contém valor, data nem estabelecimento como colunas de fato. Esses dados vivem na extração e, depois da confirmação, na transação.

## AIExtraction

Uma tentativa de leitura já validada, ou uma tentativa falha sem payload.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | |
| `financial_document_id` | |
| `model` | Identificador do modelo usado |
| `schema_version` | Versão do contrato |
| `outcome` | `stored`, `rejected_schema` ou `provider_error` |
| `payload` | JSON validado, nulo quando `outcome` não é `stored` |
| `error_code` | Nulo no sucesso |
| `created_at` | |

Materialização: Sprint 03.

A linha não é atualizada. Nova tentativa insere outra linha. O payload segue o contrato de [AI_RULES.md](AI_RULES.md). Não há coluna de texto livre.

## Transaction

Fato financeiro que entra nos totais quando está confirmado e não anulado.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | |
| `financial_document_id` | Nulo no lançamento manual |
| `ai_extraction_id` | Nulo no lançamento manual ou quando o humano ignorou a leitura |
| `status` | `confirmed` ou `voided` |
| `kind` | `expense` ou `income` na Sprint 04 |
| `amount_cents` | Obrigatório, inteiro, maior que zero |
| `currency_code` | Obrigatório. Default `BRL` no MVP |
| `direction` | `outflow` em despesa e `inflow` em receita |
| `transaction_date` | Dia civil obrigatório |
| `merchant_name` | Nulo se desconhecido |
| `merchant_tax_id` | Nulo se ausente ou inválido |
| `category_id` | Classificação, não fato extraído. Nulo até sugestão aceita, regra explícita ou confirmação do usuário |
| `paid_by_entity_id` | Obrigatório |
| `belongs_to_entity_id` | Obrigatório |
| `financial_account_id` | Nulo se desconhecido |
| `payment_card_id` | Nulo se desconhecido |
| `installment_current` | Nulo ou par válido com o total |
| `installment_total` | Nulo ou inteiro maior que um |
| `created_at` | |
| `updated_at` | |
| `voided_at` | Nulo enquanto confirmada |

Materialização: Sprint 04.

Não existe transação pendente. Sem os campos obrigatórios, a linha não é criada e a pendência fica no documento.

`direction` precisa concordar com `kind`. Conta e cartão, quando preenchidos, pertencem ao mesmo usuário. As duas entidades também. Anular uma transação muda `status` para `voided` e preenche `voided_at`. A linha sai dos totais e permanece na auditoria.

Compra no cartão é uma despesa. O pagamento da fatura não é representado neste roadmap.

## TransactionAllocation

Conceito para uma despesa dividida entre mais de uma entidade. Cada parte teria entidade, valor em centavos e papel econômico.

Materialização: nenhuma neste roadmap, pela premissa P-07 e pelo ADR-004. O caso de duas entidades, pagador e dono, cabe na própria transação. Reabrir o conceito exige uma decisão que mostre um rateio real que o par de colunas não expressa.

## PendingItem

Um motivo concreto para um humano olhar um documento ou uma decisão.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | |
| `financial_document_id` | Nulo somente se a pendência for de uma transação já existente |
| `transaction_id` | Nulo quando a pendência é anterior ao lançamento |
| `reason_code` | Código estável, sem texto livre como chave |
| `field_name` | Nulo quando o motivo não é um campo |
| `status` | `open`, `resolved` ou `dismissed` |
| `created_at` | |
| `resolved_at` | |

Materialização: Sprint 04.

Códigos iniciais da Sprint 04: `missing_critical_field`, `ambiguous_entity`, `multi_amount_document` e `low_confidence`. A Sprint 05 acrescenta `duplicate_candidate`. A Sprint 09 acrescenta `reimbursement_needs_review`. Recorrência não é pendência bloqueante; ela tem tabela própria.

Resolver a pendência não apaga a linha.

## RecurringCharge

Sugestão ou acompanhamento de cobrança que se repete. Não é um lançamento futuro.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | |
| `merchant_name_normalized` | Chave de agrupamento |
| `belongs_to_entity_id` | |
| `expected_amount_cents` | Nulo se a sugestão ainda não tiver valor estável |
| `currency_code` | Obrigatório. Default `BRL` no MVP |
| `cadence` | `monthly` neste roadmap, até outra cadência ser especificada |
| `status` | `suggested`, `confirmed` ou `dismissed` |
| `last_seen_on` | |
| `created_at` | |
| `updated_at` | |

Materialização: Sprint 06.

Confirmar a recorrência não cria transações. As transações continuam nascendo de comprovantes ou de lançamento manual.

## DuplicateCandidate

Par suspeito entre um documento novo e uma transação já confirmada, ou entre duas transações.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | |
| `financial_document_id` | Documento que disparou a suspeita |
| `existing_transaction_id` | Lançamento já confirmado |
| `new_transaction_id` | Nulo enquanto o novo lançamento não existe |
| `strength` | `strong` para o mesmo hash; `possible` para a heurística |
| `status` | `open`, `confirmed_duplicate` ou `dismissed` |
| `created_at` | |
| `resolved_at` | |

Materialização: Sprint 05.

`confirmed_duplicate` impede uma segunda transação confirmada para aquele documento. `dismissed` permite confirmar. O arquivo do candidato permanece.

## Reimbursement

Acompanhamento de valor pago por uma entidade em nome de outra.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | |
| `transaction_id` | Despesa ou receita original, única por reembolso ativo |
| `payer_entity_id` | Cópia de quem pagou no momento da sugestão |
| `beneficiary_entity_id` | Cópia de quem deve carregar o gasto |
| `amount_cents` | Cópia do valor original |
| `currency_code` | Obrigatório. Default `BRL` no MVP |
| `status` | `suggested`, `acknowledged`, `settled` ou `dismissed` |
| `settlement_transaction_id` | Nulo até um humano ligar um lançamento existente |
| `created_at` | |
| `updated_at` | |
| `settled_at` | |

Materialização: Sprint 09.

O registro só pode surgir quando `paid_by_entity_id` e `belongs_to_entity_id` da transação são diferentes. Baixa automática é incompatível com a premissa P-07. Ligar `settlement_transaction_id` é opcional e aponta para uma transação que já existe; não a cria.

## AuditLog

Trilha append-only das mudanças relevantes.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | Dono dos dados |
| `actor_user_id` | Quem executou a ação |
| `action` | Código estável |
| `entity_table` | Tabela afetada |
| `entity_id` | |
| `before` | JSON redigido, nulo em inserção |
| `after` | JSON redigido, nulo se não couber no evento |
| `created_at` | |

Materialização: Sprint 01, com as primeiras mutações de cadastro. As sprints seguintes passam a auditar suas próprias mutações.

O cliente autenticado pode ler a própria trilha. Não pode inserir, alterar nem apagar. A escrita ocorre por trigger com função em schema privado, fora da API exposta.

O JSON de auditoria não inclui bytes de arquivo, payload bruto do modelo, PAN, CVV nem segredo. Mudança de status guarda o status anterior e o novo.

## EntityResolutionRule

Regra explícita criada quando o usuário pede para lembrar uma correção.

| Coluna | Notas |
| --- | --- |
| `id` | |
| `user_id` | |
| `match_kind` | `card_last4`, `merchant_name` ou `merchant_tax_id` |
| `match_value` | Valor já normalizado |
| `paid_by_entity_id` | Nulo se a regra não afirmar o pagador |
| `belongs_to_entity_id` | Nulo se a regra não afirmar o dono econômico |
| `created_at` | |

Materialização: Sprint 08.

A Sprint 04 não grava regra. Sem um lado de entidade preenchido, a linha não existe.

## Relações

```text
auth.users 1---1 profiles
auth.users 1---n entities, accounts, cards, categories, documents,
                 extractions, transactions, pending items, duplicates,
                 recurring charges, reimbursements, audit, rules

entities 1---n financial_accounts
entities 1---n payment_cards
financial_accounts 0---n payment_cards

financial_documents 1---n ai_extractions
financial_documents 0---n transactions
ai_extractions 0---n transactions

transactions n---1 paid_by entity
transactions n---1 belongs_to entity
transactions n---0..1 category, account, card
transactions 0---n pending_items
transactions 0---1 reimbursement
```

Um documento pode ter zero, uma ou várias transações. Cada transação referencia no máximo um documento. Não há restrição de unicidade entre documento e transação. A decomposição em várias transações só vale quando cada uma tiver evidência suficiente, conforme a premissa P-02.

## Fora do schema deste roadmap

Tabelas ou colunas de orçamento, meta, investimento, conversa, fila de jobs, webhook, usuário convidado, permissão, parcela futura, item de fatura e alocação parcial.
