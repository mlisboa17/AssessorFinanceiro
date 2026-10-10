# Regras de negócio

Estado: regras de fundação de 2026-10-10. Elas prevalecem sobre improvisação de sprint. Onde uma constante numérica está em aberto, a regra qualitativa já vale e a constante espera a decisão indicada.

## Dinheiro

- A unidade persistida é o centavo inteiro.
- Toda linha monetária carrega `currency_code`. O MVP opera em `BRL`, que é o default explícito da coluna.
- Valor de transação é maior que zero.
- Despesa usa `kind = expense` e `direction = outflow`.
- Receita usa `kind = income` e `direction = inflow`.
- Total de gastos soma `amount_cents` das transações `expense`, `confirmed`, do período e da lente escolhida.
- Transação `voided` fica fora dos totais e dentro da auditoria.
- Não existe valor negativo para representar estorno neste roadmap.

## Datas

- `transaction_date` é o dia impresso ou informado do fato, não o dia do upload.
- Data numérica é interpretada como dia, mês e ano.
- Data impossível ou ambígua demais para essa leitura fica nula.
- `received_at` e `created_at` não substituem a data do lançamento em relatório.

## Entidades

- Todo usuário começa com uma entidade pessoa física.
- Empresa é criada por ação explícita, com nome informado pelo usuário.
- CPF e CNPJ só são gravados se o dígito verificador passar. Falha de dígito deixa o identificador nulo e, na leitura automática, abre pendência apenas se o restante da política exigir revisão.
- Entidade arquivada não entra em seleção nem em regra padrão.
- Pagador e dono econômico são obrigatórios na transação e podem ser a mesma entidade.

## Regra da entidade única

Se o usuário tem exatamente uma entidade ativa e a leitura não aponta outra entidade conhecida, `paid_by_entity_id` e `belongs_to_entity_id` recebem essa entidade.

Se o usuário tem mais de uma entidade ativa:

- correspondência exata e única de nome ou documento fiscal pode preencher o lado sugerido;
- a partir da Sprint 08, uma regra explícita do usuário pode preencher os lados que ela cobre;
- qualquer ambiguidade ou ausência deixa o lado nulo;
- com qualquer lado nulo, a transação não é criada e o documento fica `PENDING` com `ambiguous_entity` ou `missing_critical_field`.

A leitura nunca insere entidade nova.

## Instrumentos

- Conta e cartão são opcionais na confirmação.
- Os dois juntos não criam dois lançamentos.
- Final de cartão liga `payment_card_id` somente quando há um único cartão ativo com aquele `last4`.
- Vários cartões com o mesmo final deixam o campo nulo e registram pendência de instrumento somente se o usuário tiver de escolher para confirmar. Como o instrumento é opcional, a pendência de cartão ambíguo não bloqueia a confirmação do valor. A interface mostra a ambiguidade e segue sem cartão se o usuário confirmar assim.
- A leitura nunca cria conta nem cartão.

## Categoria

- Categoria não é um fato extraído e não equivale a valor, data ou estabelecimento identificado.
- Ela é uma classificação: sugerida pela IA, aprendida de regra explícita ou confirmada pelo usuário.
- Ligação automática exige igualdade do nome normalizado com uma categoria ativa daquele `kind`.
- Sem igualdade, `category_id` permanece nulo. O nome sugerido pode aparecer na revisão, vindo da extração, e só é gravado na transação se o usuário escolher uma categoria existente ou se a igualdade existir.
- A ausência de categoria não impede confirmação.

## Documento e transação

- Arquivo aceito gera documento `RECEIVED` antes da leitura.
- Lançamento manual gera transação confirmada sem documento e sem extração. O usuário forneceu valor, data, direção e entidades.
- Um FinancialDocument pode originar zero, uma ou várias transações. Comprovantes simples normalmente originam uma. Documentos compostos podem originar várias quando cada lançamento tiver evidência suficiente.
- Lançamento do documento sem evidência suficiente não é criado. O arquivo permanece salvo e a parte não sustentada vira pendência.
- Rejeitar um documento muda o status para `REJECTED`, mantém o arquivo e não deixa transação confirmada ligada a ele.
- Reabrir um documento rejeitado ou confirmado é uma transição explícita, auditada, feita por ação humana.

## Máquina de status do documento

| De | Para | Quem provoca |
| --- | --- | --- |
| `RECEIVED` | `PROCESSING` | Comando de leitura |
| `PROCESSING` | `EXTRACTED` | Schema válido armazenado |
| `PROCESSING` | `FAILED` | Provedor, timeout tratado ou schema inválido |
| `FAILED` | `PROCESSING` | Nova tentativa explícita |
| `EXTRACTED` | `CONFIRMED` | Toque humano em cada transação extraída, decisão O-08 |
| `EXTRACTED` | `PENDING` | Falta campo obrigatório, ambiguidade ou duplicidade forte |
| `EXTRACTED` | `REJECTED` | Ação humana |
| `PENDING` | `CONFIRMED` | Humano completa o que falta e confirma |
| `PENDING` | `REJECTED` | Ação humana |
| `PENDING` | `PROCESSING` | Nova leitura explícita, sem transação confirmada |
| `CONFIRMED` | `PENDING` | Humano reabre a revisão |
| `REJECTED` | `PENDING` | Humano reabre a revisão |

Transições fora desta tabela são defeito. Status anterior não é reescrito no lugar: a linha muda para o novo status e a auditoria guarda os dois.

`EXTRACTED` pode durar pouco, porém é observável. Se a classificação não terminar, o documento permanece `EXTRACTED` e a próxima visita retoma a política sem nova chamada ao modelo, usando a extração `stored` mais recente.

## Confirmação

Uma transação nova exige valor, data, direção, tipo, pagador e dono econômico.

Com esses campos já resolvidos e sem duplicidade que bloqueie o lançamento, a interface mostra um resumo e um botão confirmar. `CONFIRMED` e a linha da transação nascem nesse toque. Transação extraída não é gravada em silêncio.

Pendência deixa o documento salvo. As transações cujos campos obrigatórios existam podem ser confirmadas uma a uma. A que faltar campo obrigatório não é criada.

## Anulação

O usuário pode anular uma transação confirmada. O status passa a `voided`. Se o documento ainda tiver outra transação confirmada e não anulada, ele permanece `CONFIRMED`. Se não restar nenhuma, o documento volta a `PENDING`, com o arquivo intacto.

## Duplicidade

A Sprint 05 aplica esta política antes da confirmação:

- Mesmo `sha256` de outro documento do usuário que já tenha transação confirmada: candidato `strong`. O novo documento não ganha transação. Pendência `duplicate_candidate`.
- Outra transação confirmada do mesmo usuário, mesmo valor, mesma moeda, estabelecimento normalizado igual e data dentro da janela definida em O-05: candidato `possible`. Também bloqueia o toque de confirmação da transação nova até o usuário dispensar ou aceitar a duplicidade.
- O usuário marca `confirmed_duplicate` ou `dismissed`.
- Confirmar duplicidade mantém a transação antiga e o arquivo novo, sem segundo lançamento.
- Dispensar permite o fluxo normal de confirmação.

Hash calculado só no cliente pode ser contestado. A Sprint 05 inclui a recomputação do hash no servidor a partir dos bytes armazenados antes de tratar a duplicidade como `strong`.

## Recorrência

A Sprint 06 observa despesas confirmadas. A sugestão nasce quando a decisão O-06 for atendida. O estado `confirmed` da recorrência significa que o usuário reconheceu o padrão. Não significa lançamento futuro, agendamento ou boleto gerado.

## Reembolso

Na Sprint 09, uma transação confirmada com pagador diferente do dono econômico pode gerar um reembolso `suggested`.

- Reconhecer muda para `acknowledged`.
- Baixar muda para `settled` por ação humana.
- Dispensar muda para `dismissed`.
- Nenhuma transição cria transação.
- O valor do reembolso é copiado no momento da sugestão. Mudança posterior do valor ou das entidades da despesa não reescreve essa cópia. A Sprint 09 abre a pendência `reimbursement_needs_review` e mantém o valor e as entidades já gravados no reembolso.
- Reembolso não entra como segunda despesa nos totais.

## Revisão financeira

A ação "Fazer revisão financeira" da Sprint 07 lê somente transações confirmadas e não anuladas, pendências abertas, candidatos a duplicidade abertos e recorrências não dispensadas.

O período padrão é os últimos 30 dias para gastos recentes, com os maiores gastos desse período. A lente padrão da tela é a econômica, e a tela também mostra a lente de caixa, com os nomes das lentes visíveis.

Itens do relatório:

- gastos recentes;
- maiores gastos;
- despesas por entidade, nas duas lentes;
- cobranças recorrentes sugeridas ou reconhecidas;
- pendências abertas;
- duplicidades abertas;
- despesas fora do padrão, segundo O-07;
- lista do que precisa de atenção, formada por pendência, duplicidade, recorrência sugerida e fora do padrão.

Não há execução agendada.

## Auditoria de negócio

Estas ações geram `audit_log`: criar, alterar e arquivar cadastro estrutural; receber documento; mudar status de documento; armazenar extração; confirmar, alterar e anular transação; resolver ou dispensar pendência; resolver duplicidade; mudar status de reembolso; criar regra de resolução.

Corrigir um campo de uma transação confirmada grava o antes e o depois daquele campo.

## Integridade

- Usuário A não lê nem altera linha ou arquivo do usuário B.
- Comprovante rejeitado continua acessível ao dono.
- Falha de leitura não remove o documento.
- Totais não usam `payload` de extração como entrada.
- Relatório não soma pagador e dono econômico no mesmo número.
