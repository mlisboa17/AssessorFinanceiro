# Sprint 08 — Multi-Entity Intelligence

## Objetivo

Aprimorar a atribuição entre pessoa física e várias empresas com regras explícitas nascidas das correções do usuário.

## Valor de negócio

Quem tem mais de uma empresa deixa de repetir a mesma escolha óbvia em todo comprovante, sem o sistema passar a inventar entidade.

## Escopo

- Tabela `entity_resolution_rules`.
- Quando o usuário corrige pagador ou dono econômico, oferecer "Lembrar esta escolha".
- A escolha grava regra por final de cartão, nome de estabelecimento normalizado ou documento fiscal do estabelecimento.
- Na classificação da Sprint 04, aplicar regra do usuário antes da heurística de nome e antes do fallback de entidade única.
- A regra só preenche o lado que ela contém.
- Conflito entre regras, ou regra que aponta entidade arquivada, cai na pendência já existente de entidade ambígua.
- A regra não reclassifica transações antigas.

## Fora de escopo

- Aprendizado estatístico, embedding e job.
- Criar empresa a partir do comprovante.
- Rateio.
- Reembolso automático. A diferença entre pagador e dono continua apenas visível; o acompanhamento nasce na Sprint 09.
- Inferir regra sem o clique "Lembrar esta escolha".

## Dependências

Sprint 04 DONE. Pela ordem do roadmap, as sprints 05, 06 e 07 estão DONE antes de esta começar, embora a dependência de dados seja a transação.

## Decisões arquiteturais

- Premissas P-05, P-06 e P-16.
- Preferência é dado do usuário, editável pela sua existência no banco, não um modelo treinado.
- A política de classificação continua uma função. Esta sprint adiciona um passo no início dela.
- Não há motor genérico de regras nem DSL.

## Modelo de dados afetado

Cria `entity_resolution_rules` conforme `DATA_MODEL.md`. Não cria `merchants` nem `transaction_allocations`.

## Backend

- Comando para gravar regra a partir de uma transação confirmada e do tipo de correspondência escolhido.
- Extensão da função de classificação, com testes dos casos antigo e novo.
- Regra de outro usuário ou entidade arquivada não é aplicada.
- Documento fiscal da regra só é aceito se o verificador passar.

## Frontend

- No detalhe de uma transação confirmada, depois de corrigir entidade, a pergunta "Lembrar esta escolha".
- A pergunta oferece a chave realmente disponível: cartão ligado, nome do estabelecimento ou documento fiscal. Chave ausente não aparece.
- Lista simples das regras com ação de arquivar ou remover. Remover aqui é permitido porque a regra é preferência, não fato financeiro. A remoção é auditada.

## IA

Nenhum uso novo. Sugestões já gravadas na extração continuam sendo sugestões e perdem para a regra explícita quando ambas existem e discordam: a regra do usuário vence; se não houver regra, segue a política da Sprint 04.

## Segurança

- RLS da tabela nova.
- A regra não pode apontar entidade de outro usuário. A constraint e o teste cobrem isso.
- Remover regra alheia é negado.

## Auditoria

Criar e remover regra grava trilha com a chave e as entidades. Aplicar a regra na classificação fica rastreável na transação resultante, que já é auditada, sem uma segunda trilha por campo sugerido.

## Cenários principais

1. Usuário com duas empresas corrige um lançamento do cartão final 1234 para a Empresa A e pede para lembrar. O próximo comprovante com esse final único preenche a entidade da regra.
2. Sem clique de lembrar, a próxima classificação continua conservadora.
3. Regra de nome não cria estabelecimento mestre; ela compara o nome normalizado.

## Casos de erro

1. Duas regras ativas da mesma chave com entidades diferentes geram pendência, não uma escolha silenciosa.
2. Entidade arquivada torna a regra inaplicável e gera pendência se o restante também não resolver.
3. Cartão ambíguo continua sem ligação automática; a regra de `card_last4` só vale se o final identificar um único cartão ativo, como na Sprint 04.
4. A regra não preenche valor, data nem categoria.

## Testes obrigatórios

### Unitários

Ordem: regra, correspondência exata, entidade única, ambiguidade. Conflito de regras. Entidade arquivada. Regra parcial que preenche só o pagador.

### Integração

Gravar regra como usuário A não afeta a classificação do usuário B. Remover regra restaura o comportamento anterior num documento novo.

### E2E

No celular, com duas empresas: confirmar um lançamento no toque, corrigir o dono econômico, lembrar pelo cartão e processar um segundo comprovante de fixture que saia com a entidade lembrada e ainda exija o toque de O-08.

## Critérios de aceite

- Nenhuma regra nasce sem ação "Lembrar esta escolha".
- Nenhuma entidade nova nasce da leitura.
- Transações antigas permanecem como estavam depois de criar a regra.
- Conflito vira pendência.
- A função da Sprint 04 continua coberta pelos testes anteriores, agora com o passo novo.

## Evidências necessárias

- Matriz de classificação atualizada.
- Jornada de lembrar e aplicar no comprovante seguinte.
- Teste de isolamento da regra.

## Riscos

- Regra ampla demais, por nome genérico, classifica errado o próximo lançamento. O toque de O-08 deixa o resumo visível antes da confirmação.
- O usuário pode não entender a diferença entre lembrar cartão e lembrar estabelecimento. A interface mostra a chave em texto concreto.

## Dívida técnica conscientemente adiada

- Reclassificação retroativa assistida.
- Regras de categoria e conta.
- Expiração de regra.
- Sugestão automática de regra sem clique.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais a matriz de classificação e a prova de que o histórico antigo não muda. Validação humana com duas entidades.

## Status

Status: PLANNED
