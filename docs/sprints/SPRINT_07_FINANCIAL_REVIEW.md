# Sprint 07 — Financial Review

## Objetivo

Permitir que o usuário peça "Fazer revisão financeira" e receba um relatório calculado a partir dos dados confirmados.

## Valor de negócio

A pessoa vê, numa ação, o que gastou, onde estão as maiores saídas, o que está pendente e o que foge do padrão, sem montar planilha e sem conversar com um modelo para obter soma.

## Escopo

- Ação única "Fazer revisão financeira".
- Período padrão dos últimos 30 dias, com o período escrito na tela.
- Gastos recentes e maiores gastos.
- Despesas por entidade na lente econômica e na lente de caixa, separadas e nomeadas.
- Recorrências sugeridas ou reconhecidas.
- Pendências abertas e duplicidades abertas.
- Despesas fora do padrão segundo O-07.
- Lista do que precisa de atenção, composta por esses achados.
- Narrativa opcional da Gemini API sobre agregados já calculados. Todo número mostrado vem de consulta ou cálculo verificável. A IA pode explicar, resumir e comparar esses números, e não pode inventá-los, recalculá-los de memória ou alterar seus valores. O texto não vira fato. O relatório aparece mesmo se a narrativa falhar.

## Fora de escopo

- Agendamento, cron, push e e-mail.
- Caixa de pergunta livre.
- Recalcular soma com o modelo.
- Reembolso. A Sprint 09 ainda não aconteceu na ordem do roadmap; esta revisão não ganha uma seção vazia de reembolso "para o futuro".
- Exportação contábil, gráfico decorativo e comparação com orçamento.
- Reclassificar lançamentos antigos.

## Dependências

- Sprints 04, 05 e 06 DONE.
- O-07 respondida.

## Decisões arquiteturais

- Premissa P-11.
- As consultas e os cálculos verificáveis são a fonte dos números. A narrativa explica, resume e compara esses números.
- Sem fila e sem materialização de um "relatório" como segunda verdade. A página calcula na hora.
- Se a narrativa existir, o módulo de IA continua somente no servidor e usa um contrato diferente do schema de comprovante.

## Modelo de dados afetado

Nenhuma tabela nova. Leitura de transações, pendências, candidatos a duplicidade e recorrências. Se a narrativa for implementada, ela não ganha tabela.

## Backend

- Consultas do período, das duas lentes, dos maiores valores, das pendências, das duplicidades e das recorrências.
- Função pura do critério O-07, recebendo a despesa e a amostra histórica.
- Endpoint ou comando da narrativa, desligável. Falha do provedor devolve o relatório sem texto.
- Os números visíveis saem das consultas. A narrativa pode citá-los para explicar, resumir ou comparar, desde que não introduza, recalcule de memória nem altere valor. Texto que traga número ausente dos agregados é descartado, e o relatório calculado permanece.

## Frontend

- Uma ação na área principal.
- Seções na ordem das regras de negócio.
- Cada total mostra lente e período.
- Estado vazio quando não há despesa confirmada no período, sem número fictício.
- Pendências e duplicidades linkam para as filas já existentes.

## IA

Uso opcional para explicar os números já calculados. Nenhum comprovante é relido. Nenhum tool é oferecido ao modelo. Se a equipe da sprint preferir entregar sem narrativa, isso atende o objetivo, e a omissão fica registrada na evidência. A narrativa não é critério de aceite.

## Segurança

- Todas as consultas usam a sessão do usuário e o RLS já existente.
- O payload enviado ao modelo, se houver, contém agregados do próprio usuário e não contém comprovante, CPF, CNPJ nem cartão.
- Log sem os agregados, se eles forem considerados conteúdo financeiro detalhado. O log guarda o identificador da execução e o resultado de sucesso ou falha.
- Teste de que o usuário B não entra na contagem do usuário A.

## Auditoria

A geração do relatório não altera lançamento. Não é obrigatório auditar a leitura. Se a narrativa for chamada, a auditoria registra apenas que uma narrativa foi solicitada, sem o texto e sem os números.

## Cenários principais

1. Usuário com despesas confirmadas pede a revisão e vê os blocos calculados.
2. A mesma despesa aparece na empresa, na lente econômica, e na pessoa, na lente de caixa, quando pagador e dono diferem. Os dois blocos não são somados num terceiro total.
3. Pendência aberta aparece em atenção e leva à fila.
4. Base sem quatro amostras anteriores não marca fora do padrão.

## Casos de erro

1. Período sem despesa mostra vazio, não zero disfarçado de sucesso absoluto sem explicação. Zero pode aparecer como soma vazia desde que o texto diga que não houve despesa confirmada.
2. Falha da narrativa ainda mostra todos os números.
3. Transação anulada não entra.
4. Documento só extraído, sem transação, não entra nos gastos e pode entrar na atenção via pendência.

## Testes obrigatórios

### Unitários

O-07 com amostra suficiente, amostra insuficiente, valor exatamente no limite e transação anulada fora da amostra. Se a narrativa existir, um teste garante que número ausente dos agregados não aparece no texto aceito e que o relatório calculado continua visível.

### Integração

Fixtures de duas entidades e um pagamento cruzado. Os totais das lentes batem com a soma manual. Usuário B não altera a soma de A. Pendência e duplicidade aparecem na atenção.

### E2E

No celular, acionar a revisão, ver as duas lentes nomeadas e abrir uma pendência a partir da lista de atenção.

## Critérios de aceite

- Todos os números visíveis saem das consultas.
- As duas lentes aparecem separadas.
- Não há execução agendada.
- Não há campo de pergunta livre.
- Fora do padrão segue O-07.
- A revisão não grava transação nem altera status.

## Evidências necessárias

- Consultas ou testes que mostrem a soma esperada das fixtures.
- Captura da tela com as duas lentes e o período.
- Prova de que a falha de narrativa, se o recurso estiver ligado, não esconde o relatório.
- Confirmação de que nenhum cron foi criado.

## Riscos

- O usuário pode ler a lente errada. Os nomes "De quem é a despesa" e "Quem pagou" ficam visíveis em cada bloco.
- Mediana com pouca amostra gera alerta bobo. O mínimo de O-07 existe para isso.
- Relatório sob demanda pode ficar lento com histórico grande. A sprint indexa o predicado real se a consulta mostrar problema, sem criar índice especulativo antes disso.

## Dívida técnica conscientemente adiada

- Período escolhível além dos 30 dias.
- Seção de reembolso, que só faria sentido depois da Sprint 09 e não será encaixada retroativamente sem uma sprint própria.
- Exportação.
- Revisão agendada.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais a conferência das duas lentes contra fixtures. Validação humana da ação no celular.

## Status

Status: PLANNED
