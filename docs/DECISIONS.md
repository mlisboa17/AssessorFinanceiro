# Decisões

Estado: atualizado em 2026-10-10 com as correções aprovadas da especificação, as decisões O-02, O-04 e O-08, e as materializações 01A a 01D.

As decisões difíceis de reverter e já aceitas estão nos ADRs 001 a 005. Este arquivo guarda as premissas usadas para planejar as sprints e as escolhas que ainda exigem validação humana.

Uma premissa orienta o contrato das sprints. Revogá-la exige uma entrada nova aqui, antes da sprint afetada ser implementada.

Uma decisão em aberto não foi escolhida. A sprint bloqueada por ela não começa no ponto que depende da escolha.

## Premissas de planejamento

### P-01 — Centavos inteiros e moeda explícita

Valores monetários usam `bigint` em centavos. Não há `float`, `double` nem coluna numérica genérica para dinheiro. Toda linha monetária carrega `currency_code`. O default e o valor usado pelo MVP é `BRL`. A coluna existe de forma explícita: o banco não deve depender de real apenas implícito. Câmbio e lançamento em outras moedas ficam fora deste roadmap.

### P-02 — Um documento pode originar várias transações

Um FinancialDocument pode originar zero, uma ou várias transações.

Comprovantes simples normalmente originam uma transação.

Documentos compostos, como faturas, extratos ou PDFs contendo vários lançamentos, podem originar múltiplas transações.

A decomposição só pode ocorrer quando houver evidência suficiente no documento. Linha sem evidência suficiente não vira transação e não recebe valor inventado. O arquivo continua salvo.

### P-03 — Parcela não vira série

`installment_current` e `installment_total` só são guardados quando ambos aparecem no comprovante, o checksum lógico passa e o total é maior que um. O sistema não cria os lançamentos das parcelas futuras.

### P-04 — Lançamento simples

A Sprint 04 cria transações `expense` e `income`. Transferência, pagamento de fatura e estorno não ganham interface nem valor de enum até a sprint que realmente os lançar. Totais de gasto contam somente `expense` confirmada e não anulada. O produto não implementa partida dobrada.

### P-05 — Sugestão não é fato

Nome de estabelecimento, conta, cartão, documento fiscal e entidade sugeridos permanecem sugestão. A exceção é a entidade única ativa, que preenche pagador e dono econômico quando não há contradição. Correspondência de cartão pelos quatro últimos dígitos só ocorre quando existe exatamente um cartão ativo com aquele final.

Categoria não é um fato extraído. Categoria é uma classificação: sugerida pela IA, aprendida de regra explícita ou confirmada pelo usuário. Ela não equivale a valor, data ou estabelecimento identificado.

### P-06 — A leitura não cadastra estrutura

A IA não cria entidade, conta, cartão nem categoria. Categoria só é ligada quando o nome sugerido corresponde exatamente a uma categoria já existente do usuário.

### P-07 — Reembolso é acompanhamento

Quando pagador e dono econômico diferem, a Sprint 09 pode sugerir um reembolso. Nada é baixado automaticamente e nenhum lançamento de caixa é gerado sozinho. Rateio e a tabela `TransactionAllocation` não entram nas sprints 00 a 10.

### P-08 — IA sem agente

A chamada é um pedido único de visão ou documento, com schema, feito no servidor Next.js. O modelo não recebe ferramentas, não grava no banco e não mantém memória de conversa.

### P-09 — Sem processamento desacoplado

Não há fila, cron, Edge Function nem barramento neste roadmap. O processamento é um comando de servidor acionado depois do salvamento. Um limite medido de timeout autoriza reabrir essa premissa.

### P-10 — Um dono por base

Toda linha de negócio carrega `user_id`. Não há compartilhamento, convite nem papel de contador.

### P-11 — Revisão calculada

Todo número financeiro mostrado ao usuário deve ser produzido por consulta determinística ou cálculo verificável sobre dados persistidos.

A IA pode explicar, resumir e comparar esses números, mas não pode inventá-los, recalculá-los de memória ou alterar seus valores.

A Sprint 07 mostra o relatório mesmo se a narrativa falhar. O texto da narrativa não é gravado como fato.

### P-12 — Payload inválido não entra

Resposta que não satisfaz o schema não é armazenada. A tentativa guarda código de erro e identificadores, sem corpo do modelo.

### P-13 — Número completo de cartão não existe no sistema

Se a leitura devolver PAN, CVV ou validade completos, o servidor descarta esses valores antes de persistir qualquer coisa. No máximo os quatro finais, quando a regra de evidência passar, seguem adiante.

### P-14 — Sem exclusão física do histórico

Documento recebido, extração e transação confirmada não são apagados fisicamente nas sprints 00 a 10. Correção atualiza ou anula a transação, preservando a linha e a auditoria. Exclusão para atender retenção espera O-03.

### P-15 — Estabelecimento é atributo

`merchant_name` e `merchant_tax_id` ficam na transação ou na extração. Não há tabela `merchants` neste roadmap. A normalização para comparação é uma função pura.

### P-16 — Preferência é regra explícita

A Sprint 08 grava correspondências confirmadas pelo usuário, como final de cartão ou nome de estabelecimento para uma entidade. Não há treino, embedding nem job de aprendizado.

### P-17 — Cadastros mínimos na Sprint 01

O primeiro acesso cria o perfil e uma entidade pessoa física. A redação original previa copiar categorias iniciais para cada usuário. A entrega 01D, confirmada na auditoria 01E, substituiu essa cópia por um catálogo compartilhado: `is_system = true` e `user_id` nulo. As 23 categorias padrão não são duplicadas por usuário e o usuário não as edita.

## Decisões aprovadas em 2026-10-10

### O-02 — HEIC

A interface poderá converter HEIC para um formato suportado antes do processamento. O servidor continua limitado a JPEG, PNG, WEBP e PDF. A conversão não pertence à Sprint 00. A Sprint 02 a implementa no cliente, antes do upload.

### O-04 — Login

O MVP usa e-mail e senha. A autenticação é Supabase Auth, e essa escolha não impede magic link no futuro. A Sprint 00 não implementou Auth. A entrega 01A, em 2026-10-10, implementou cadastro, entrada, saída e a área `/app`. A sessão é verificada no servidor com `getClaims`. `user_metadata` não autoriza acesso. Magic link continua fora desta entrega.

### 01B — Entidade financeira

A entrega 01B materializou somente `public.entities`. Conta, cartão, categoria, perfil, auditoria, documento e transação continuam fora.

O tipo persistido é `PERSON` ou `COMPANY`, na coluna `type`. O documento fiscal fica em `document_number`, apenas com dígitos, sem coluna separada de CPF/CNPJ e sem dígito verificador nesta entrega. Ativo ou inativo usa `is_active`. Os nomes lógicos anteriores `kind`, `tax_id`, `tax_id_type` e `archived_at` não foram criados.

Nenhuma entidade pessoa física é criada no cadastro ou no primeiro acesso. Isso suspende, para esta fatia, a parte de entidade da premissa P-17. O usuário adiciona a primeira entidade explicitamente.

`user_id` referencia `auth.users(id)` com `on delete restrict`. Apagar o usuário autenticado fica bloqueado enquanto existir entidade. A exclusão de conta continua dependente de O-03.

Não havia trigger de `updated_at` no projeto. Foi criada só a função `private.set_entities_updated_at`, com `search_path` vazio, sem `security definer`, e o trigger `entities_set_updated_at`. Não há framework genérico de trigger.

O índice é `entities_user_id_idx` em `user_id`. Índice composto com `is_active` não foi criado: a lista mostra ativas e inativas.

RLS está ligado. Policies de `SELECT`, `INSERT` e `UPDATE` exigem `(select auth.uid()) = user_id`. `INSERT` e `UPDATE` também usam `with check`. Não há policy de `DELETE`.

A Data API do projeto não expõe tabela nova sozinha. `authenticated` recebeu `SELECT`, `INSERT` e `UPDATE`. `TRUNCATE`, `REFERENCES` e `TRIGGER` foram revogados desse papel. `anon` não tem privilégio na tabela.

### 01C — Conta financeira e cartão

A entrega 01C materializou `public.financial_accounts` e `public.payment_cards`. Cada linha pertence a uma entidade e ao mesmo usuário. O `user_id` é a posse usada pelo RLS. A entidade é o dono de domínio.

A chave primária de `entities` não mudou. Foi adicionada a restrição única `(id, user_id)` para a chave estrangeira composta `(entity_id, user_id)`. Assim, uma conta ou um cartão não consegue apontar para entidade de outro usuário mesmo que o RLS aceite o `user_id` da sessão. As duas chaves usam `on delete restrict`.

O tipo da conta é `CHECKING`, `SAVINGS`, `DIGITAL`, `CASH` ou `OTHER`, por check constraint, no mesmo estilo de `entities`. O cartão não guarda número completo, código de segurança, validade, senha nem token. `last_four` é opcional na conta e obrigatório no cartão, sempre com quatro dígitos.

Não há `currency_code` nesta fatia, porque a conta ainda não é uma linha monetária. Não há vínculo entre cartão e conta. Não há policy de `DELETE`. As telas `/app/accounts` e `/app/cards` não criam entidade quando o usuário ainda não tem nenhuma.

Os índices são `user_id`, para a lista protegida pelo RLS, e `entity_id`, para a chave estrangeira. `updated_at` usa uma função específica por tabela no schema `private`, sem framework genérico. `authenticated` tem só `SELECT`, `INSERT` e `UPDATE`. `anon` não tem privilégio.

### 01D — Categorias

A entrega 01D materializou `public.categories` como classificação, não como fato do comprovante. Não há chamada de modelo nem regra de estabelecimento.

O catálogo padrão é compartilhado: `is_system = true` exige `user_id` nulo. Isso substitui, nesta fatia, a cópia por usuário descrita na premissa P-17. O usuário vê essas linhas e não as edita nem desativa pela interface. A policy de `UPDATE` também exige `is_system = false`, então a sessão não consegue alterá-las nem promover uma categoria própria a categoria de sistema.

Categoria do usuário exige `user_id`. O identificador vem da sessão. O slug é gerado no servidor a partir do nome, em minúsculas e sem acento. O tipo aceita `EXPENSE`, `INCOME` e `TRANSFER`.

`parent_id` existe e não pode apontar para a própria linha. A interface não mostra árvore e não procura ciclos mais longos.

Unicidade: slug de sistema é único dentro do mesmo tipo. Slug de usuário é único entre as categorias ativas do mesmo usuário e do mesmo tipo. O seed das 23 categorias padrão usa `on conflict do nothing`.

`authenticated` tem só `SELECT`, `INSERT` e `UPDATE`. `anon` não tem privilégio. Não há policy de `DELETE`. `updated_at` usa `private.set_categories_updated_at`, sem framework genérico.

### 01E — Auditoria de posse

A auditoria de `entities`, `financial_accounts`, `payment_cards` e `categories` não encontrou falha que exigisse migration ou mudança de policy. RLS está ligado. `anon` e `authenticated` não ignoram RLS. `FORCE RLS` não foi ligado: a Data API usa esses dois papéis, que não são donos das tabelas. `postgres` e `service_role` continuam com `BYPASSRLS`, e a aplicação não os usa.

A função `public.rls_auto_enable` é um event trigger da plataforma, `SECURITY DEFINER`, ligado a `ensure_rls`. Ela só habilita RLS em `CREATE TABLE` no schema `public`. A chamada anônima pela Data API retornou HTTP 400 e não leu nem alterou linha de negócio. O aviso do advisor fica aceito. A função não foi alterada.

### O-08 — Confirmação de transação

Uma transação extraída exige confirmação em um toque antes de se tornar confirmada. O toque não abre formulário. Nenhuma gravação silenciosa de transação financeira no MVP inicial.

## Decisões em aberto

### O-01 — Limiar numérico de confiança

Permanece aberta. A Sprint 00 não estabelece um threshold único. A confiança será tratada por campo nas Sprints 03 e 04. Campo crítico sem valor, sem evidência compatível ou sem confiança não confirma. O número de qualquer constante, se ainda for necessário, será escolhido na sprint que for usá-la e versionado com teste.

### O-03 — Retenção e exclusão

Não bloqueia as sprints 00 a 10. Bloqueia qualquer recurso de apagar conta ou comprovante. É preciso definir prazo, base de tratamento e o que acontece com arquivo, extração e lançamento. O texto jurídico não será improvisado na implementação.

### O-05 — Constantes de duplicidade

Permanece aberta até a Sprint 05. A forma da regra está em `BUSINESS_RULES.md`: mesmo hash é duplicidade forte; valor igual, data próxima e estabelecimento normalizado igual são candidato. A janela de dias e qualquer tolerância de valor serão fixadas no início da sprint.

### O-06 — Constantes de recorrência

Permanece aberta até a Sprint 06. A forma recomendada é três despesas confirmadas, mesmo estabelecimento normalizado, cadência mensal e valor parecido. A tolerância percentual será fixada no início da sprint. A regra não lança cobranças futuras.

### O-07 — Gasto fora do padrão

Permanece aberta até a Sprint 07. A recomendação é marcar despesa confirmada acima de duas vezes a mediana da mesma categoria nos últimos 90 dias, com pelo menos quatro amostras anteriores. Sem amostra suficiente, não há alerta. A constante será aceita no início da sprint.

## Registro de revisão

A revisão de produto e a revisão de arquitetura foram feitas antes de fechar estes documentos. Os resultados estão em `PRODUCT_SPEC.md` e `ARCHITECTURE.md`. Nenhuma ideia da proposta original foi removida do mapa conceitual; as que aumentam risco ou complexidade foram colocadas fora da materialização deste roadmap, com o conceito preservado onde ainda importa para não perder o vocabulário do domínio.
