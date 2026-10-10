# Sprint 09 — Reimbursements

## Objetivo

Identificar e acompanhar despesas pagas por uma entidade em nome de outra.

## Valor de negócio

A pessoa física que pagou algo da empresa, ou uma empresa que pagou algo de outra, passa a ter uma lista do que ainda precisa ser acertado, sem lançamento duplicado e sem baixa fantasma.

## Escopo

- Tabela `reimbursements`.
- Ao confirmar uma transação com pagador diferente do dono econômico, criar sugestão de reembolso.
- Ações humanas: reconhecer, baixar e dispensar.
- Ligação opcional a uma transação de acerto já existente, sem criar essa transação.
- Se o valor ou as entidades da despesa original mudarem depois, abrir a pendência `reimbursement_needs_review`, sem alterar a cópia já gravada no reembolso.
- Lista dos reembolsos por status, mostrando quem pagou, de quem é a despesa e o valor.

## Fora de escopo

- Rateio e `transaction_allocations`.
- Gerar a transação de devolução.
- Baixa automática quando um valor parecido aparecer.
- Considerar o reembolso como redução automática do gasto nas lentes da Sprint 07.
- Atualizar a revisão financeira da Sprint 07 nesta mesma entrega. A lista de reembolso vive na própria sprint.
- Multiusuário para "cobrar o sócio".

## Dependências

- Sprint 04 DONE.
- Sprint 08 DONE na ordem do roadmap, porque a atribuição de entidades precisa estar madura antes de sugerir reembolso com frequência. A sugestão também funciona sem regras, desde que as duas entidades estejam preenchidas.

## Decisões arquiteturais

- ADR-004 e premissa P-07.
- Um reembolso ativo por transação original.
- O reembolso não é uma segunda despesa.
- Baixa é status, não lançamento.
- A sugestão nasce no comando de confirmação já existente, não num serviço novo.

## Modelo de dados afetado

Cria `reimbursements` conforme `DATA_MODEL.md`. Acrescenta a pendência `reimbursement_needs_review` quando o valor ou as entidades da despesa original mudam depois da sugestão.

## Backend

- Extensão do comando de confirmação: entidades diferentes inserem reembolso `suggested` na mesma ação auditada.
- Entidades iguais não inserem reembolso.
- Comandos de `acknowledged`, `settled` e `dismissed`.
- `settlement_transaction_id` só aceita transação confirmada do mesmo usuário, diferente da original, e não cria linha.
- Mudança de `amount_cents` ou das entidades da original, com reembolso não dispensado, abre `reimbursement_needs_review` e mantém a cópia do reembolso.
- Anular a transação original dispensa o reembolso ainda não baixado, de forma auditada. Reembolso já baixado permanece e ganha pendência para o humano olhar. A sprint não apaga o histórico da baixa.

## Frontend

- Lista "Reembolsos".
- No lançamento com entidades diferentes, o resumo avisa que um reembolso foi sugerido.
- Ações de reconhecer, baixar e dispensar, com texto de que baixar não cria outro lançamento.
- Campo opcional para apontar um lançamento de acerto existente.
- Pendência quando o valor original mudou.

## IA

Nenhum uso. A diferença entre duas entidades já gravadas é determinística. O modelo não decide se há reembolso.

## Segurança

- RLS da tabela nova.
- Ligação de acerto não aceita transação de outro usuário.
- Usuário B não vê o reembolso de A.

## Auditoria

Criação, mudança de status, ligação de acerto e abertura da pendência de valor entram na trilha. A trilha inclui as duas entidades e o valor em centavos.

## Cenários principais

1. Pessoa física paga despesa da Empresa A. Ao confirmar, nasce reembolso sugerido de R$ 2.000, e a despesa continua uma só.
2. O usuário reconhece e depois baixa. O número de transações não aumenta.
3. Pagador e dono iguais não geram reembolso.
4. O usuário liga um recebimento já lançado como acerto, sem nova transação automática.

## Casos de erro

1. Segunda confirmação concorrente não cria dois reembolsos ativos.
2. Tentar ligar transação de outro usuário falha.
3. Alterar o valor da despesa não reescreve `reimbursements.amount_cents`.
4. Rateio entre três entidades não tem interface. O lançamento continua com um pagador e um dono.

## Testes obrigatórios

### Unitários

Deve sugerir somente quando as entidades diferem. Transições de status. Recusa de criar transação na baixa. Valor do reembolso estável após mudança da origem.

### Integração

Confirmação cruzada cria um reembolso e uma transação. Baixa mantém a contagem. Isolamento entre usuários. Unicidade sob concorrência.

### E2E

No celular, lançar o exemplo da pessoa física e da Empresa A, ver a sugestão, baixar e conferir que a lista de transações não ganhou linha nova.

## Critérios de aceite

- O exemplo de R$ 2.000 fica reproduzível: um lançamento, dois papéis, um reembolso sugerido.
- Baixar não cria lançamento.
- Dispensar não apaga a despesa original nem o comprovante.
- Não existe tabela de alocação parcial.
- A lente econômica e a lente de caixa da despesa original permanecem válidas.

## Evidências necessárias

- Teste do exemplo pessoa/empresa.
- Contagem de transações antes e depois da baixa.
- Policies e prova de isolamento.
- Registro de que a revisão da Sprint 07 não foi reaberta nesta entrega.

## Riscos

- O usuário pode achar que baixar devolveu dinheiro no caixa. O texto da ação precisa dizer que a baixa é acompanhamento.
- Sugestão em todo pagamento cruzado pode incomodar quando a mistura é intencional e definitiva. Dispensar cobre esse caso.
- Uma correção posterior pode deixar a cópia do reembolso diferente da despesa. A pendência avisa, e a sprint não recalcula essa cópia sozinha.

## Dívida técnica conscientemente adiada

- Rateio.
- Geração assistida do lançamento de devolução.
- Inclusão dos reembolsos abertos na revisão financeira.
- Reembolso parcial de uma mesma despesa.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais o exemplo pessoa/empresa e a prova de que a baixa não cria transação. Validação humana dessa jornada.

## Status

Status: PLANNED
