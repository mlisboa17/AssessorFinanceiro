# ADR-004 — Quem pagou e a quem pertence

- Status: aceito
- Data: 2026-10-10

## Contexto

Uma despesa pode ser paga por uma pessoa ou empresa e pertencer economicamente a outra. Tratar "entidade" como um único campo mistura caixa e resultado e impede reembolso.

Exemplo obrigatório: a pessoa física paga R$ 2.000 de uma despesa da Empresa A.

## Decisão

Toda transação possui:

- `paid_by_entity_id`: a entidade que efetivamente pagou;
- `belongs_to_entity_id`: a entidade a quem a despesa ou a receita pertence.

Os dois campos são obrigatórios para uma transação existir. Eles podem apontar para a mesma entidade. Quando apontam para entidades diferentes, o lançamento continua sendo uma transação só. O reembolso, a partir da Sprint 09, é um registro de acompanhamento ligado a essa transação, não uma segunda despesa automática.

Os totais declaram a lente. A lente econômica agrupa por `belongs_to_entity_id`. A lente de caixa agrupa por `paid_by_entity_id`. Nenhuma tela soma as duas lentes como se fossem a mesma grandeza.

Rateio entre mais de um dono econômico fica fora deste roadmap. `TransactionAllocation` permanece conceito documentado, sem tabela.

## Consequências

- A Sprint 01 precisa permitir mais de uma entidade, mesmo que a inteligência de classificação venha depois.
- Com várias entidades e sem correspondência única, a transação não nasce e o documento fica pendente.
- Com exatamente uma entidade ativa, ela pode preencher os dois papéis.
- Um reembolso não altera, sozinho, o valor da despesa original.

## Alternativas recusadas

- Um único `entity_id` na transação.
- Criar automaticamente duas transações, uma negativa e outra positiva, para representar o mesmo comprovante.
- Implementar rateio genérico antes de existir um caso real de divisão confirmada pelo usuário.
