# Roadmap

Estado: plano de 2026-10-10. Todas as sprints estão PLANNED. A ordem é obrigatória, salvo decisão nova que registre a exceção e o motivo técnico.

O índice operacional, com bloqueios humanos, está em [SPRINTS.md](SPRINTS.md).

## Intenção

Cada sprint entrega uma capacidade verificável e para de avançar. A sprint seguinte começa quando a anterior está DONE, a documentação foi atualizada e as decisões em aberto que a bloqueiam foram respondidas.

## Sprints

| Sprint | Nome | Resultado observável |
| --- | --- | --- |
| 00 | Foundation | Esqueleto Next.js, padrões, ambiente sem segredo e documentação viva |
| 01 | Data Core | Usuário, entidades, contas, cartões, categorias, RLS e auditoria de cadastro |
| 02 | Document Ingestion | Foto, imagem ou PDF salvos em bucket privado antes de qualquer IA |
| 03 | AI Extraction | Leitura Gemini em JSON validado, sem lançamento |
| 04 | Transaction Review | Resumo confirmável ou pendência, mais lançamento manual |
| 05 | Duplicate Detection | Candidatos preservados e segunda confirmação bloqueada quando couber |
| 06 | Recurring Charges | Sugestão de recorrência, sem lançamento futuro |
| 07 | Financial Review | Relatório calculado sob demanda |
| 08 | Multi-Entity Intelligence | Regras explícitas para várias empresas e a pessoa física |
| 09 | Reimbursements | Acompanhamento do que uma entidade pagou pela outra |
| 10 | Mobile UX Polish | Registrar uma despesa no celular com o menor atrito seguro |

## Dependências

```text
00 -> 01 -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09 -> 10
```

A Sprint 05 depende da transação da Sprint 04 e do hash da Sprint 02. A Sprint 07 lê o que as anteriores tiverem produzido e não antecipa reembolso: reembolso aparece na revisão só se a sprint da revisão for reaberta depois da Sprint 09, o que não está previsto. A revisão da Sprint 07 lista pendência, duplicidade e recorrência. Reembolso fica na própria Sprint 09.

A Sprint 10 não cria regra financeira. Ela melhora a captura e a revisão já existentes.

## Fora deste roadmap

Estes itens não recebem sprint escondida nem preparação "por via das dúvidas":

- WhatsApp e outros canais de mensagem.
- Sincronização bancária, Open Finance e importação de extrato.
- Conciliação de fatura de cartão.
- Rateio e `TransactionAllocation`.
- Tabela mestre de estabelecimentos.
- Parcelas futuras e cobrança recorrente lançada sozinha.
- Chat financeiro livre.
- Revisão agendada, push e e-mail periódico.
- PWA offline.
- Multiusuário, contador e compartilhamento.
- Multimoeda, orçamento, meta e investimento.
- Escrituração, imposto, nota fiscal e obrigação acessória.
- Exclusão de conta, até a decisão O-03.
- Edge Function, fila, cron e barramento, até um limite medido invalidar a premissa P-09.

## Critério para abrir uma sprint futura

Um item fora do roadmap só ganha especificação quando um uso real, já observado nas sprints feitas, não couber nas regras atuais. A especificação nova atualiza decisões, modelo e uma sprint própria. Ela não é encaixada no fim de outra entrega.

## Riscos de sequenciamento

- Confirmar lançamentos na Sprint 04 antes da duplicidade da Sprint 05 permite repetir o mesmo comprovante durante essa janela. O risco é aceito e fica escrito na Sprint 04.
- A revisão da Sprint 07 ainda não conhece reembolso. Ela pode mostrar a mesma despesa na lente econômica de uma empresa e na lente de caixa de uma pessoa, o que é correto, e não mostra uma fila de reembolso.
- A inteligência da Sprint 08 chega depois dos primeiros lançamentos. Lançamentos antigos não são reclassificados sozinhos.
