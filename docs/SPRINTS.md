# Sprints

Estado: índice de 2026-10-10. O contrato de cada sprint está em `docs/sprints/`. O status inicial de todas é PLANNED.

Uma sprint só começa quando a anterior está DONE e as decisões bloqueadoras abaixo foram respondidas. Premissas de planejamento não são bloqueio: elas já orientam o contrato.

| Sprint | Arquivo | Depende de | Bloqueio humano | Status |
| --- | --- | --- | --- | --- |
| 00 Foundation | [SPRINT_00_FOUNDATION.md](sprints/SPRINT_00_FOUNDATION.md) | Aprovação desta fundação | Nenhum | DONE |
| 01 Data Core | [SPRINT_01_DATA_CORE.md](sprints/SPRINT_01_DATA_CORE.md) | 00 | Nenhum; O-04 já decidido | PLANNED |
| 02 Document Ingestion | [SPRINT_02_DOCUMENT_INGESTION.md](sprints/SPRINT_02_DOCUMENT_INGESTION.md) | 01 | Nenhum; O-02 já decidido | PLANNED |
| 03 AI Extraction | [SPRINT_03_AI_EXTRACTION.md](sprints/SPRINT_03_AI_EXTRACTION.md) | 02 | Nenhum | PLANNED |
| 04 Transaction Review | [SPRINT_04_TRANSACTION_REVIEW.md](sprints/SPRINT_04_TRANSACTION_REVIEW.md) | 03 | O-01; O-08 já decidido | PLANNED |
| 05 Duplicate Detection | [SPRINT_05_DUPLICATES.md](sprints/SPRINT_05_DUPLICATES.md) | 04 | O-05 | PLANNED |
| 06 Recurring Charges | [SPRINT_06_RECURRING.md](sprints/SPRINT_06_RECURRING.md) | 04 e 05 | O-06 | PLANNED |
| 07 Financial Review | [SPRINT_07_FINANCIAL_REVIEW.md](sprints/SPRINT_07_FINANCIAL_REVIEW.md) | 04, 05 e 06 | O-07 | PLANNED |
| 08 Multi-Entity Intelligence | [SPRINT_08_MULTI_ENTITY.md](sprints/SPRINT_08_MULTI_ENTITY.md) | 04, depois de 07 na ordem do roadmap | Nenhum | PLANNED |
| 09 Reimbursements | [SPRINT_09_REIMBURSEMENTS.md](sprints/SPRINT_09_REIMBURSEMENTS.md) | 04 e 08 | Nenhum | PLANNED |
| 10 Mobile UX Polish | [SPRINT_10_POLISH_MOBILE.md](sprints/SPRINT_10_POLISH_MOBILE.md) | 02 e 04 | Nenhum | PLANNED |

A Sprint 06 pode ser implementada em paralelo conceitual com a Sprint 05 porque as tabelas não se sobrepõem, mas a ordem do roadmap permanece 05 e depois 06 para manter uma frente só. Paralelismo de implementação exigiria decisão explícita e duas working trees isoladas. A fundação não autoriza esse paralelismo.

A Sprint 08 depende da confirmação da Sprint 04, não da revisão da Sprint 07. A ordem do roadmap ainda a coloca depois da revisão para não misturar inteligência de entidade com o primeiro relatório.

A Sprint 10 depende da captura e da revisão já existirem. Ela fica por último para polir o fluxo completo, incluindo duplicidade e pendência se essas sprints já estiverem DONE. Ela não espera reembolso para ser útil, embora o roadmap a execute depois da Sprint 09.

## Regra de escopo

O arquivo da sprint é a lista fechada do que pode ser construído. Trabalho útil de uma sprint posterior permanece na sprint posterior. A exceção precisa estar escrita em `DECISIONS.md` antes do código, com o motivo técnico concreto.

## Encerramento

DONE segue [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md). O status neste índice muda junto com o status no arquivo da sprint.
