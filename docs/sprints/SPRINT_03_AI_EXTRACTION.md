# Sprint 03 — AI Extraction

## Objetivo

Interpretar um comprovante já salvo com a Gemini API e persistir somente JSON estruturado validado, ou uma falha sem payload.

## Valor de negócio

O usuário deixa de digitar o que a leitura consegue sustentar. O comprovante continua salvo mesmo quando a leitura erra, cai ou devolve lixo.

## Escopo

- Tabela `ai_extractions`, append-only.
- Módulo de IA somente no servidor.
- Schema versão 1 e validador no servidor.
- Funções puras de valor brasileiro, data dia/mês/ano e projeção segura descritas em `AI_RULES.md`.
- Comando `processar documento` acionado depois do recebimento.
- Transições `RECEIVED` ou `FAILED` para `PROCESSING`, depois `EXTRACTED` ou `FAILED`.
- Troca condicional de status para impedir duas chamadas paralelas.
- Frase visível, antes da primeira leitura, de que a interpretação usa um serviço de IA e não substitui a conferência.
- Descarte de PAN, CVV e validade antes da persistência.

## Fora de escopo

- Criar transação, pendência, categoria, entidade, conta ou cartão.
- Confirmar documento.
- Limiar numérico único. O-01 permanece aberta. A confiança é armazenada por campo; a Sprint 04 decide como usá-la. A Sprint 03 não escolhe um threshold.
- Loop de agente, ferramentas, fila, cron e Edge Function.
- Narrativa de revisão financeira.
- Reprocessamento automático em background. Nova tentativa é ação explícita.

## Dependências

Sprint 02 DONE. A chave da Gemini API presente apenas no ambiente de servidor.

## Decisões arquiteturais

- ADR-003 e ADR-005.
- Premissas P-02, P-03, P-08, P-09, P-12 e P-13. P-02 permite zero, uma ou várias transações futuras por documento. Esta sprint guarda os candidatos evidenciados e não cria transação.
- A sessão do usuário baixa o arquivo e grava a extração. A service role não entra nesse caminho.
- Payload inválido não é adaptado à força. Ele é rejeitado.
- A projeção segura é código testável, separado do JSON original. O JSON original válido permanece intacto.

## Modelo de dados afetado

Cria `ai_extractions`. Amplia o uso de `financial_documents.status` para `PROCESSING`, `EXTRACTED` e `FAILED`, além dos já existentes. Não cria `transactions` nem `pending_items`.

## Backend

- Cliente do modelo isolado em módulo de servidor.
- Comando que exige documento do usuário em status permitido, muda para `PROCESSING`, chama o modelo, valida e grava.
- Timeout do comando marca `FAILED` com `provider_error` e preserva o arquivo.
- Versão de schema desconhecida não é gravada como `stored`.
- Logs só com identificadores e `error_code`.

## Frontend

- A partir de um documento `RECEIVED`, a ação de ler o comprovante.
- Estados humanos: lendo, leitura pronta para revisão, não foi possível ler.
- A leitura pronta mostra os campos da projeção segura e marca sugestões como sugestão. Não há botão de confirmar lançamento.
- Falha oferece tentar de novo e lembra que o comprovante está salvo.
- A frase sobre o serviço de IA aparece antes da primeira chamada.

## IA

Único uso desta sprint: uma chamada estruturada por documento, imagem ou PDF, conforme `AI_RULES.md`. O modelo não vê o restante da base do usuário.

## Segurança

- Chave fora do bundle e fora do Git.
- RLS nas extrações, teste de dois usuários.
- Arquivo alheio não pode ser enviado ao modelo por troca de identificador.
- Payload e comprovante fora dos logs.
- Dado de cartão completo ausente do banco após uma fixture que o contenha.

## Auditoria

Mudança de status do documento e criação de extração geram trilha. A trilha da extração guarda `outcome`, `schema_version` e `error_code`, não o payload. O payload permanece na tabela protegida por RLS.

## Cenários principais

1. Um comprovante de um único valor é lido, a extração `stored` nasce e o documento fica `EXTRACTED`.
2. O usuário recarrega a tela e vê a mesma leitura, sem segunda chamada.
3. Um PDF com vários lançamentos evidenciados volta com vários candidatos em `EXTRACTED`. Candidato sem evidência não é completado.

## Casos de erro

1. Provedor indisponível deixa `FAILED`, arquivo no lugar e nenhuma transação, porque a tabela nem existe.
2. JSON fora do schema deixa `rejected_schema` e `payload` nulo.
3. Valor que não bate com a evidência permanece no payload original, mas a projeção segura entrega valor nulo.
4. Segunda requisição concorrente não dispara segunda chamada.
5. PAN presente na resposta do modelo não aparece em linha nenhuma.

## Testes obrigatórios

### Unitários

Schema válido e inválido. Valor brasileiro compatível e incompatível. Data dia/mês/ano, data impossível e data ambígua. CPF e CNPJ. Parcela incompleta. Remoção de PAN antes de persistir. Lista com um candidato, com vários candidatos evidenciados e com item sem evidência que não é promovido. Confiança ausente tratando o campo como não confiável.

### Integração

Comando contra um modelo falso no teste: sucesso, schema inválido, erro de provedor e corrida de duas chamadas. Isolamento de extração entre dois usuários. O teste de integração não usa a rede da Gemini API.

### E2E

Com modelo falso ou fixture de servidor: receber um arquivo já coberto pela Sprint 02, pedir leitura, ver "Leitura pronta para revisão" e recarregar sem duplicar a extração `stored`. Um cenário de provedor indisponível mostra a falha e o comprovante continua na lista.

## Critérios de aceite

- Nenhum caminho grava texto livre do modelo em coluna de negócio.
- Extração inválida não tem payload.
- Documento `RECEIVED` sobrevive a todas as falhas de leitura.
- A sprint não cria transação nem pendência.
- A frase sobre IA aparece antes da primeira chamada.
- Testes unitários da projeção segura passam sem rede.

## Evidências necessárias

- Commit do módulo de servidor, migration e testes.
- Prova de que o bundle do cliente não contém a chave nem o cliente do modelo.
- Exemplo de payload `stored` redigido e de tentativa `rejected_schema` com payload nulo.
- Saída dos testes com modelo falso.

## Riscos

- Timeout real da plataforma pode impedir PDF grande. Se isso for medido, a sprint documenta o caso e não introduz fila no mesmo passo. Uma decisão nova trata o contorno.
- O modelo pode obedecer a texto malicioso dentro do comprovante. Schema e projeção limitam o dano; o teste inclui uma fixture com instrução embutida pedindo valor diferente do impresso.
- Custo e latência do provedor. A sprint não adiciona retentativa automática em loop.

## Dívida técnica conscientemente adiada

- Calibração do limiar O-01.
- Aplicar a projeção à criação de lançamento, na Sprint 04.
- Retentativa agendada de documentos `FAILED`.
- Extracao de linhas de fatura.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais a prova de schema, de projeção e de ausência de transação. Validação humana: acompanhar uma leitura de fixture e uma falha, confirmando que o arquivo permanece.

## Status

Status: PLANNED
