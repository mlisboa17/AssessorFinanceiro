# Decisões

Estado: atualizado em 2026-10-10 com as correções aprovadas da especificação, as decisões O-02, O-04 e O-08, e a implementação 01A de e-mail e senha.

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

O primeiro acesso cria o perfil e uma entidade pessoa física. Categorias iniciais são copiadas para o usuário: Alimentação, Transporte, Moradia, Saúde, Educação, Serviços, Impostos, Assinaturas e Outros. O usuário pode arquivar ou renomear.

## Decisões aprovadas em 2026-10-10

### O-02 — HEIC

A interface poderá converter HEIC para um formato suportado antes do processamento. O servidor continua limitado a JPEG, PNG, WEBP e PDF. A conversão não pertence à Sprint 00. A Sprint 02 a implementa no cliente, antes do upload.

### O-04 — Login

O MVP usa e-mail e senha. A autenticação é Supabase Auth, e essa escolha não impede magic link no futuro. A Sprint 00 não implementou Auth. A entrega 01A, em 2026-10-10, implementou cadastro, entrada, saída e a área `/app`. A sessão é verificada no servidor com `getClaims`. `user_metadata` não autoriza acesso. Magic link continua fora desta entrega.

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
