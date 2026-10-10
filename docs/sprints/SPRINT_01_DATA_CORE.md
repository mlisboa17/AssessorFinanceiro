# Sprint 01 — Data Core

## Objetivo

Persistir usuário, entidades, contas, cartões e categorias, com isolamento por RLS e auditoria das mutações de cadastro.

## Valor de negócio

Sem essa estrutura, um comprovante não tem dono, não tem quem pagou e não tem a quem pertencer. A pessoa também precisa separar pessoa física e empresas antes de a leitura tentar adivinhar isso.

## Escopo

- Projeto Supabase e cliente com a sessão do usuário, se ainda não existirem.
- Login por e-mail e senha, decisão O-04. O uso de Supabase Auth não impede magic link no futuro. Esta sprint não adiciona magic link.
- Tabelas `profiles`, `entities`, `financial_accounts`, `payment_cards`, `categories` e `audit_log`.
- Criação do perfil e de uma entidade pessoa física no primeiro acesso.
- Cópia das categorias iniciais da premissa P-17.
- CRUD mínimo, em telas mobile-first, para entidade, conta, cartão e categoria, incluindo arquivar.
- RLS conforme `SECURITY.md`.
- Trigger de auditoria em schema privado para essas tabelas.

## Fora de escopo

- Documento, storage, IA, transação, pendência, duplicidade, recorrência e reembolso.
- Convite, papel adicional e compartilhamento.
- Subcategoria, instituição financeira integrada e número completo de cartão.
- Importação de cadastro.

## Dependências

- Sprint 00 DONE.
- O-04 já está decidido: e-mail e senha.

## Decisões arquiteturais

- ADR-002 e ADR-004, no que diz respeito a existir mais de uma entidade.
- Premissas P-01, P-10 e P-17.
- A identidade permanece no Supabase Auth. O perfil não armazena senha.
- A service role não é usada neste CRUD.
- Tipos de acesso a dados são gerados do schema depois das migrations.

## Modelo de dados afetado

Cria as tabelas da Sprint 01 descritas em `DATA_MODEL.md`. Não cria colunas reservadas para sprints futuras. `categories` nasce sem `parent_id`.

Restrições desta sprint: `kind` de entidade, `kind` de conta, `kind` de categoria, `last4` com quatro dígitos quando não for nulo, `tax_id` apenas com verificador válido, unicidade de documento fiscal entre entidades ativas do mesmo usuário e unicidade do nome normalizado de categoria ativa.

## Backend

- Migrations aplicadas pelo fluxo do Supabase, com RLS na mesma migration da tabela.
- Comandos de servidor ou mutações autorizadas pelo RLS para criar e arquivar cadastros.
- Função pura do dígito verificador de CPF e CNPJ, testada antes de a constraint ou o comando confiarem nela.
- Trigger `security definer` no schema privado escrevendo `audit_log`.

## Frontend

- Entrada e saída da conta.
- Lista e formulário curto de entidades, contas, cartões e categorias.
- A entidade pessoa física inicial aparece sem exigir que o usuário a recrie.
- Cartão pede apelido e, opcionalmente, bandeira e quatro finais. Não há campo de PAN, CVV ou validade.
- Composição mobile-first, sem otimização visual da Sprint 10.

## IA

Nenhum uso.

## Segurança

- RLS habilitado e policies de dono nas tabelas novas.
- `audit_log` sem insert, update ou delete para `authenticated`.
- Teste de dois usuários contra a API.
- `anon` sem acesso às tabelas novas.
- Conferência de que `user_metadata` não entra em policy.
- Chaves apenas em ambiente local, fora do Git.

## Auditoria

Criar, alterar e arquivar entidade, conta, cartão e categoria grava `audit_log` com antes e depois, sem dado de cartão além do que a própria tabela já guarda de forma limitada. A sprint verifica que o cliente não consegue inserir uma linha falsa de auditoria.

## Cenários principais

1. Primeiro acesso cria perfil e pessoa física.
2. O usuário cadastra duas empresas, duas contas e dois cartões, um deles só com apelido.
3. O usuário arquiva uma categoria e ela deixa de aparecer na lista ativa.
4. Dois usuários autenticados não veem o cadastro um do outro.

## Casos de erro

1. CNPJ com dígito inválido é recusado.
2. Quatro finais com tamanho diferente de quatro são recusados.
3. Tentativa de ler cadastro alheio não devolve linha.
4. Tentativa de gravar auditoria diretamente é negada.

## Testes obrigatórios

### Unitários

Dígito verificador de CPF e CNPJ: válidos, inválidos e vazio.

### Integração

Migrations sobem com RLS. Dois usuários exercitam select, insert e update cruzados em entidade, conta, cartão, categoria e auditoria.

### E2E

Jornada: entrar, ver a pessoa física, criar uma empresa e um cartão com quatro finais, sair e entrar de novo com os dados preservados.

## Critérios de aceite

- O login implementado é e-mail e senha, sem provedor social e sem magic link nesta sprint.
- O usuário consegue manter mais de uma entidade e mais de um instrumento.
- Não existe coluna de PAN, CVV ou validade.
- O teste de isolamento passa.
- A trilha de auditoria registra a mutação de cadastro e rejeita escrita direta do cliente.
- Documento e transação continuam inexistentes.

## Evidências necessárias

- Commit com migrations e telas.
- Resultado dos testes de dois usuários, sem dados reais de produção.
- Lista das policies criadas.
- Exemplo redigido de uma linha de auditoria.

## Riscos

- Policy copiada sem `with check` permite inserir linha com `user_id` de outra pessoa.
- Trigger em schema exposto amplia a superfície da função `security definer`.
- Cadastro rico demais atrasa a primeira captura. Os formulários permanecem curtos.

## Dívida técnica conscientemente adiada

- Edição em massa.
- Histórico visual de auditoria para o usuário. A trilha existe; a tela de consulta pode esperar até haver necessidade de suporte.
- Apagar conta, dependente de O-03.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais o teste de isolamento e a revisão das policies contra `SECURITY.md`. Validação humana: criar pessoa, empresa, conta e cartão num celular ou viewport estreito.

## Status

Status: IN_PROGRESS

01A Auth: DONE em 2026-10-10. E-mail e senha com Supabase Auth, clientes de browser e servidor usando só a chave publishable, renovação de sessão no proxy e verificação no servidor com `getClaims`. O retorno da confirmação de e-mail entra em `/auth/callback`, troca o código por sessão e só então abre `/app`.

01B Entity: DONE em 2026-10-10. Tabela `public.entities` com RLS, policies de posse, privilégios `SELECT`/`INSERT`/`UPDATE` para `authenticated` e tela `/app/entities` para listar, criar, renomear e ativar ou desativar. O `user_id` vem da sessão no servidor.

01C Accounts and cards: DONE em 2026-10-10. Tabelas `public.financial_accounts` e `public.payment_cards`, com entidade do mesmo usuário garantida por chave estrangeira composta, RLS de posse e telas `/app/accounts` e `/app/cards`.

01D Categories: DONE em 2026-10-10. Tabela `public.categories`, com catálogo de sistema sem dono, categorias do usuário, RLS e tela `/app/categories`. Perfil, auditoria e criação automática de pessoa física continuam pendentes.
