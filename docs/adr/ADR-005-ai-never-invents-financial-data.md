# ADR-005 — A IA não inventa dado financeiro

- Status: aceito
- Data: 2026-10-10

## Contexto

Modelos de visão preenchem lacunas com valores plausíveis. Em lançamento financeiro, um valor plausível e errado é pior do que uma pendência.

## Decisão

A leitura automática nunca pode inventar valor, data, estabelecimento, CNPJ, CPF, conta, cartão, entidade, parcela, categoria como fato ou pagamento.

A saída persistível é JSON validado por schema. Texto livre do modelo não é gravado em coluna de negócio. Cada campo relevante pode carregar confiança própria. Sugestões usam nomes e colunas diferentes dos fatos.

Valor, data e direção são campos críticos. Sem confiança suficiente, o documento não segue para confirmado. A política detalhada, a evidência textual e a verificação determinística estão em `docs/AI_RULES.md`.

O banco continua sendo a fonte da verdade. A conversa com o modelo não é persistida como verdade.

Quando o modelo não sustenta um campo, o campo fica nulo. O documento original permanece. A revisão humana resolve depois.

## Consequências

- A Sprint 03 entrega extração e erro, não lançamento confirmado.
- Testes de schema, evidência e campos proibidos são obrigatórios antes de qualquer confirmação automática ou semiautomática.
- Uma categoria sugerida pode aparecer na interface e só vira `category_id` por correspondência exata ou escolha humana.
- Número completo de cartão é descartado antes da persistência.

## Alternativas recusadas

- Gravar a resposta textual e interpretar depois com heurística frouxa.
- Preencher categoria, conta ou empresa mais provável para evitar pendência.
- Aceitar valor numérico sem evidência localizável no texto lido.
