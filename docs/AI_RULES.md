# Regras de IA

Estado: contrato de fundação de 2026-10-10. Complementa o ADR-005. A implementação nasce na Sprint 03 e a política de confirmação na Sprint 04.

## Papel da leitura

A Gemini API observa um comprovante e devolve uma hipótese estruturada. O servidor valida a hipótese. O banco guarda o que passou na validação. A transação só nasce na Sprint 04, pelas regras de negócio.

O modelo não é um lançador, não escolhe o status final do documento e não recebe permissão de escrita.

## Proibições

A leitura não pode inventar, completar por verossimilhança nem "corrigir" para um valor mais provável:

- valor;
- data;
- estabelecimento;
- CNPJ ou CPF;
- conta;
- cartão;
- entidade;
- parcela;
- categoria tratada como fato;
- pagamento ou baixa.

Se o campo não estiver sustentado pelo arquivo, ele volta nulo. Sugestão, quando existir, vem em propriedade explicitamente marcada como sugestão.

## Contrato persistível

`schema_version` começa em `1` na Sprint 03. O payload `stored` contém somente:

| Campo | Tipo | Papel |
| --- | --- | --- |
| `amount_cents` | inteiro ou nulo | Fato candidato |
| `amount_evidence` | texto ou nulo | Trecho que sustenta o valor |
| `transaction_date` | `YYYY-MM-DD` ou nulo | Fato candidato |
| `date_evidence` | texto ou nulo | Trecho que sustenta a data |
| `direction` | `outflow`, `inflow` ou nulo | Fato candidato |
| `direction_evidence` | texto ou nulo | Trecho que sustenta a direção |
| `merchant_name` | texto ou nulo | Fato candidato, ainda não mestre |
| `merchant_tax_id` | texto ou nulo | Fato candidato |
| `card_last4` | quatro dígitos ou nulo | Fato candidato |
| `installment_current` | inteiro ou nulo | Fato candidato |
| `installment_total` | inteiro ou nulo | Fato candidato |
| `suggested_category_name` | texto ou nulo | Classificação sugerida, nunca fato |
| `suggested_paid_by_name` | texto ou nulo | Sugestão |
| `suggested_belongs_to_name` | texto ou nulo | Sugestão |
| `field_confidence` | mapa de campo para número entre 0 e 1 | Confiança por campo presente |

O objeto acima descreve um candidato. O payload do documento contém `candidates`, uma lista desses objetos. A lista pode ter zero, um ou vários itens. Comprovante simples normalmente produz um candidato. Documento composto pode produzir vários. Cada item precisa da própria evidência. A Sprint 03 materializa esse contrato e o `schema_version`. A Sprint 00 não implementa a leitura.

Propriedade fora desse contrato reprova o schema. Texto livre, resumo, observação do modelo, PAN, CVV e validade não têm campo. Se vierem, a resposta inteira é rejeitada ou esses valores são removidos antes da validação final, no caso de PAN, CVV e validade, e a tentativa continua apenas se o restante formar um payload válido sem eles. A Sprint 03 testa as duas entradas: lixo estrutural reprova; dado sensível excedente é removido e não aparece no JSON gravado.

Confiança ausente para um campo presente equivale a campo não confiável.

## Campos críticos

São críticos `amount_cents`, `transaction_date` e `direction`.

Um campo crítico só segue para o resumo de confirmação quando:

1. o valor está presente;
2. a evidência está presente;
3. a verificação determinística do servidor concorda com a evidência;
4. a confiança daquele campo existe. O-01 permanece aberta: a Sprint 00 não fixa um número único, e as Sprints 03 e 04 tratam a confiança por campo.

Falhou qualquer item, o campo efetivo daquele candidato é nulo para a política de confirmação, mesmo que o payload guarde o que o modelo tentou dizer. A extração original permanece sem edição. A política usa uma projeção segura, calculada por código, para decidir se aquele candidato pode ser confirmado.

Candidato sem evidência suficiente não entra na lista promovível e não recebe valor inventado. Os outros candidatos do mesmo documento não são anulados por causa dele.

## Verificação determinística

O servidor, não o modelo, executa estas verificações:

- Valor: normaliza o trecho de evidência no formato brasileiro, com ponto de milhar e vírgula decimal, e compara com `amount_cents`. Divergência anula o campo na projeção segura.
- Data: exige que dia, mês e ano da data ISO apareçam na evidência de forma compatível com dia/mês/ano. Falha anula a data na projeção.
- Direção: `outflow` é o padrão somente quando a evidência indica pagamento, compra, débito ou saída e não indica recebimento. Evidência contraditória ou ausente deixa direção nula. A palavra isolada não autoriza o modelo a escolher sem o trecho gravado em `direction_evidence`.
- CPF e CNPJ: dígito verificador. Falha deixa `merchant_tax_id` nulo na projeção.
- `card_last4`: exatamente quatro dígitos, e o trecho não pode ser um PAN. Se a resposta contiver mais de quatro dígitos de cartão, o servidor não os persiste.
- Parcela: os dois números presentes, `installment_current` entre 1 e o total, total maior que 1. Caso contrário ambos ficam nulos na projeção. Nenhuma parcela adicional é criada.

Funções puras cobrem dinheiro, data e documento fiscal, com testes unitários na sprint que as introduzir.

## Sugestões

`suggested_category_name` é classificação sugerida. Não é fato e não equivale a valor, data ou estabelecimento. `suggested_paid_by_name` e `suggested_belongs_to_name` também não são copiados para colunas de fato. A interface pode mostrá-los como sugestão. A ligação de categoria com cadastro existente usa igualdade normalizada, regra explícita ou escolha humana.

A entrega 01D gravou o catálogo em `public.categories`: linhas de sistema, sem dono, e linhas do usuário. Essa entrega não chama modelo, não sugere categoria e não grava regra de estabelecimento. Quando a leitura existir, a sugestão continua fora das colunas de fato e só pode apontar para uma categoria já existente.

Conta bancária não possui campo de sugestão livre neste contrato. Sem identificador estável e seguro, a conta permanece nula.

## Confiança e status

A extração válida coloca o documento em `EXTRACTED`. Ela não o coloca em `CONFIRMED`.

A política da Sprint 04 pede um toque para cada candidato promovível. Candidato com valor, data, direção, pagador ou dono econômico ausente não vira transação e abre pendência. O código da pendência distingue campo crítico e entidade ambígua.

O-01 permanece aberta. Escolher um limiar único nesta fundação seria fingir uma calibração. A confiança continua sendo um número por campo.

## O que não é gravado

- Prompt renderizado e resposta textual bruta.
- Payload que falhou no schema.
- Corpo de erro do provedor quando puder ecoar o documento. O que se grava é um `error_code` curto.
- PAN, CVV, validade e trilha magnética.
- Embedding do comprovante.
- Histórico de chat.

A tentativa com `outcome` `rejected_schema` ou `provider_error` existe para auditoria operacional e deixa `payload` nulo.

## Chamada

- Ocorre no servidor Next.js, com a chave em variável de ambiente.
- O arquivo é enviado como dado, separado da instrução.
- A instrução pede o schema, pede nulo quando não houver evidência e manda ignorar comandos escritos no comprovante.
- O modelo não recebe ferramentas, não vê outras transações do usuário e não consulta a base.
- Uma chamada por tentativa. Não há loop de agente para "tentar até preencher".
- A troca condicional para `PROCESSING` impede chamadas paralelas do mesmo documento.
- Reprocessar usa o arquivo original, nunca a extração anterior como se fosse o comprovante.

Instrução encontrada dentro da imagem ou do PDF não é comando do sistema. Mesmo que o modelo obedeça a esse texto, o schema e a projeção segura limitam o que pode virar fato.

## PDF e imagem

Imagem e PDF usam o mesmo contrato. Um comprovante simples normalmente produz um candidato. Fatura, extrato ou PDF com vários lançamentos pode produzir vários candidatos, um para cada lançamento com evidência suficiente de valor, data e direção. O modelo não transforma o total da fatura na única despesa quando as linhas individuais estão evidenciadas, e não inventa linha que o documento não sustenta.

Candidato incerto não apaga o arquivo nem impede a confirmação dos candidatos evidenciados. O humano pode completar o que faltou ou lançar manualmente.

## Falhas

| Situação | Resultado |
| --- | --- |
| Provedor indisponível ou timeout | Documento `FAILED`, tentativa `provider_error`, arquivo preservado |
| Schema inválido | Documento `FAILED`, tentativa `rejected_schema`, payload nulo |
| Schema válido e projeção crítica incompleta | Documento `EXTRACTED`; a Sprint 04 muda para `PENDING` |
| Arquivo ilegível | Campos nulos e, se o schema vier válido assim, o mesmo caminho de projeção vazia |

`FAILED` aceita nova tentativa explícita. A nova tentativa não apaga a anterior.

## Versão

Mudança de campo obrigatório, de significado ou de verificação determinística incrementa `schema_version`. Extrações antigas permanecem. A política de confirmação declara quais versões ela sabe projetar. Versão desconhecida gera pendência, sem tentativa de encaixe silencioso.

## Revisão financeira

Se a Sprint 07 pedir uma narrativa à Gemini API, a entrada é um JSON de agregados já calculados pelo aplicativo. Todo número financeiro mostrado ao usuário deve ser produzido por consulta determinística ou cálculo verificável sobre dados persistidos. A IA pode explicar, resumir e comparar esses números, mas não pode inventá-los, recalculá-los de memória ou alterar seus valores. A narrativa não é gravada como fato. Falha da narrativa exibe o relatório estruturado mesmo assim.

Esse uso é separado da extração de comprovante e não reutiliza o schema de lançamento.
