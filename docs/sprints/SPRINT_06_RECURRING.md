# Sprint 06 — Recurring Charges

## Objetivo

Identificar possíveis assinaturas e cobranças recorrentes a partir de despesas já confirmadas.

## Valor de negócio

O usuário enxerga gastos que se repetem sem cadastrar assinatura nem aceitar lançamentos futuros inventados.

## Escopo

- Tabela `recurring_charges`.
- Detecção determinística com as constantes fechadas em O-06.
- Sugestão, reconhecimento e dispensa.
- Tela simples das recorrências, separando sugeridas e reconhecidas.
- Atualização de `last_seen_on` e do valor esperado quando uma nova despesa confirmada entra no grupo.

## Fora de escopo

- Criar transação futura, agendamento, boleto ou lembrete.
- Cron e reprocessamento noturno. A detecção roda quando uma despesa é confirmada e quando o usuário abre a lista.
- IA para "adivinhar assinatura" a partir de um único cupom.
- Cadência diferente de mensal, até uma decisão nova.
- Tabela mestre de estabelecimentos. A chave é o nome normalizado.
- Alterar o valor das despesas que formaram o grupo.

## Dependências

- Sprint 04 DONE, porque só despesa confirmada entra no grupo.
- Sprint 05 DONE, pela ordem do roadmap, para a sugestão não nascer de duplicidade ainda aberta.
- O-06 respondida.

## Decisões arquiteturais

- Recorrência é projeção de leitura sobre transações, não um gerador de transações.
- A comparação de nome reutiliza a normalização introduzida para duplicidade, se já existir; se o nome da função precisar mudar, a mudança fica no mesmo módulo de normalização.
- Não há job.

## Modelo de dados afetado

Cria `recurring_charges` conforme `DATA_MODEL.md`. `cadence` permanece `monthly`.

## Backend

- Função pura que recebe despesas confirmadas e devolve grupos que atendem O-06.
- Comando que materializa grupos novos como `suggested` e atualiza os já existentes.
- Comandos de reconhecer e dispensar.
- Despesa anulada deixa de contar. Se o grupo cair abaixo do mínimo, a sugestão não confirmada é dispensada pela própria função ou marcada de forma auditada. A sprint escolhe dispensar sugestão que perdeu a base e manter a recorrência já reconhecida pelo usuário, para não apagar uma decisão humana.

## Frontend

- Lista "Recorrências" com valor esperado, estabelecimento, entidade econômica e último dia visto.
- Ações "É uma recorrência" e "Não é".
- Texto explícito de que nada será lançado sozinho no futuro.

## IA

Nenhum uso.

## Segurança

- RLS da tabela nova e teste de dois usuários.
- A detecção só lê transações do usuário da sessão.
- Reconhecer recorrência alheia é negado.

## Auditoria

Criar sugestão, reconhecer, dispensar e atualizar valor esperado geram trilha. A trilha guarda identificadores e centavos do valor esperado, pois é o fato da decisão, sem copiar comprovante.

## Cenários principais

1. Três despesas mensais confirmadas, mesmo nome normalizado, mesma entidade econômica e valor dentro da tolerância, geram uma sugestão.
2. O usuário reconhece a recorrência e nenhuma quarta transação aparece sozinha.
3. O usuário dispensa e o grupo não volta a ser sugerido automaticamente na mesma chave, salvo decisão de reabrir. A sprint registra a dispensa como permanente para aquela chave até o usuário criar de novo manualmente, o que esta sprint não oferece. Reabrir exigiria ação futura.

## Casos de erro

1. Duas ocorrências apenas não sugerem nada.
2. Valores fora da tolerância de O-06 não formam grupo.
3. Receitas não entram na detecção desta sprint.
4. Despesas de entidades econômicas diferentes não são misturadas no mesmo grupo.

## Testes obrigatórios

### Unitários

Agrupamento com três meses, com duas ocorrências, com valor fora da tolerância, com nome equivalente depois da normalização, com despesa anulada e com entidades diferentes.

### Integração

Confirmar a terceira despesa cria sugestão. Reconhecer não insere transação. Isolamento entre usuários.

### E2E

Criar ou fixture de três despesas confirmadas, abrir a lista, reconhecer uma recorrência e verificar que o número de transações permanece três.

## Critérios de aceite

- O-06 está aplicado com as constantes decididas.
- Nenhuma transação nova nasce desta sprint.
- A lista distingue sugerida, reconhecida e dispensada.
- Dispensa impede a mesma sugestão de reaparecer sozinha.

## Evidências necessárias

- Testes da função de agrupamento.
- Contagem de transações antes e depois de reconhecer.
- Policies da tabela.

## Riscos

- Nome instável do mesmo fornecedor impede o grupo. A sprint aceita esse falso negativo. A tabela mestre continua fora.
- Tolerância larga demais junta compras ocasionais. O-06 existe para fixar isso com consciência.
- Dispensa permanente pode esconder uma assinatura real que o usuário dispensou cedo. O texto da ação deixa a consequência clara.

## Dívida técnica conscientemente adiada

- Cadências semanal e anual.
- Previsão de próximo vencimento.
- Ligação com reembolso.
- Edição manual de uma recorrência que a detecção não encontrou.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais a prova de que reconhecer não lança despesa futura. Validação humana da lista e das duas ações.

## Status

Status: PLANNED
