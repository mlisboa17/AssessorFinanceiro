# Sprint 04 — Transaction Review

## Objetivo

Transformar uma extração em transação confirmada ou em pendência, e permitir lançamento manual sem arquivo.

## Valor de negócio

O comprovante passa a poder virar um fato financeiro conferível, ou uma pendência clara, sem formulário completo e sem perder o original.

## Escopo

- Tabelas `transactions` e `pending_items`.
- Política de projeção segura mais as regras de entidade, cartão e categoria da `BUSINESS_RULES.md`.
- Tratar confiança por campo. O-01 permanece aberta e esta sprint não inventa um threshold único se a decisão continuar sem número na largada; o bloqueio de O-01 vale para qualquer constante numérica que a política precise.
- Aplicar O-08: cada transação extraída nasce confirmada somente depois de um toque. Não há gravação silenciosa.
- Lançamento manual de despesa ou receita, já confirmado, sem documento.
- Fila de pendências e detalhe para completar só o que falta.
- Rejeitar documento e anular transação.
- Ligação opcional de conta, cartão e categoria existentes. Nunca criação desses cadastros pela leitura.

## Fora de escopo

- Detecção de duplicidade. Até a Sprint 05, dois comprovantes iguais podem gerar dois lançamentos. Esse risco fica aceito e visível.
- Recorrência, revisão financeira, regra aprendida e reembolso.
- Criar entidade, conta, cartão ou categoria a partir do modelo.
- Transferência, pagamento de fatura, estorno e parcela futura.
- Gravar `entity_resolution_rules`. Correção desta sprint altera só a transação atual.

## Dependências

- Sprint 03 DONE.
- O-08 já está decidido.
- O-01 continua aberta para constante numérica. A política por campo pode começar sem um número único, e qualquer constante nova espera o fechamento de O-01.

## Decisões arquiteturais

- ADR-004 e ADR-005.
- Premissas P-02, P-04, P-05 e P-06.
- Transação nasce inteira. Não existe rascunho financeiro com valor nulo.
- A extração não é editada quando o usuário corrige o lançamento.
- A política mora em função testável, não espalhada em componentes.

## Modelo de dados afetado

Cria `transactions` e `pending_items` conforme `DATA_MODEL.md`. Um documento pode originar várias transações. `kind` limitado a `expense` e `income`. `currency_code` é obrigatório e default `BRL`.

## Backend

- Comando de classificar um documento `EXTRACTED`, executado ao abrir o documento. Cada candidato sem campo obrigatório não cria transação. Candidato completo aparece em resumo e só vira `CONFIRMED` no toque.
- Comando de confirmar uma transação por toque.
- Comando de resolver pendência, rejeitar documento e anular transação.
- Comando de lançamento manual.
- Todas as mutações respeitam RLS com a sessão do usuário.
- Totais ainda não têm tela, mas a query de soma, se for testada, ignora `voided` e não lê payload de extração.

## Frontend

- Resumo do caminho feliz com "Quem pagou" e "De quem é a despesa".
- Botão `Confirmar` em cada resumo de transação extraída. Sem esse toque a transação não entra nos totais.
- Pendência com motivo humano e apenas os campos necessários.
- Lista de pendências.
- Entrada "Digitar manualmente" em `Registrar`.
- Sugestões rotuladas como sugestão.
- O documento rejeitado permanece consultável pelo arquivo original.

## IA

Nenhuma chamada nova. A sprint consome a extração da Sprint 03 e a projeção segura. Não pede ao modelo para escolher a entidade.

## Segurança

- RLS das duas tabelas novas e teste de dois usuários.
- Confirmação de documento alheio é negada.
- Lançamento manual não aceita entidade, conta, cartão ou categoria de outro usuário.
- Logs sem valor e sem identificação fiscal.

## Auditoria

Confirmar, alterar, anular, rejeitar e resolver pendência gravam trilha com antes e depois dos campos financeiros. A extração referenciada não muda.

## Cenários principais

1. Extração com um candidato completo e uma única entidade vira resumo e, no toque, transação confirmada.
2. Extração sem valor fica pendente, sem linha em `transactions`, com o arquivo disponível.
3. Usuário com duas empresas e sem correspondência única cai em pendência de entidade.
4. Lançamento manual cria despesa confirmada sem documento.
5. Usuário anula um lançamento e o documento volta a pendente.

## Casos de erro

1. Tentar confirmar sem campo obrigatório não cria linha parcial.
2. Categoria sugerida sem igualdade de nome deixa `category_id` nulo e ainda assim permite confirmar.
3. Final de cartão ambíguo não liga cartão nenhum.
4. Documento com dois candidatos evidenciados pode gerar duas transações, cada uma após o próprio toque. Candidato sem evidência não gera linha.
5. Dois toques no mesmo candidato não criam duas transações para aquele candidato.

## Testes obrigatórios

### Unitários

Política de confirmação: caminho completo, campo crítico nulo, confiança ausente no campo, entidade única, entidades ambíguas, categoria tratada só como classificação, cartão único, cartões repetidos e documento com dois candidatos evidenciados.

### Integração

Confirmar, pendenciar, lançar manual, anular e isolar dois usuários. Tentativa concorrente de confirmar o mesmo documento.

### E2E

Viewport de celular: documento extraído só vira confirmado depois do toque; outro documento incompleto aparece na fila de pendências e é resolvido sem preencher campos que já estavam sustentados; lançamento manual de uma despesa.

## Critérios de aceite

- O-08 está implementado: não existe gravação silenciosa. Nenhum threshold único foi inventado enquanto O-01 seguir aberta.
- Nenhuma transação existe sem valor, data, direção, pagador e dono econômico.
- Pendência não apaga o documento.
- A leitura não criou cadastro estrutural.
- Lançamento manual funciona sem arquivo.
- Duplicidade ainda não é detectada, e isso está registrado como risco residual da entrega.

## Evidências necessárias

- Commit, testes e migrations.
- Matriz curta dos casos da política e o resultado esperado versus obtido.
- Registro da jornada de celular: confirmar, pendenciar e lançar manualmente.
- Prova de que dois toques no mesmo candidato não duplicam aquela transação, e de que dois candidatos evidenciados podem gerar duas transações.

## Riscos

- Janela sem duplicidade até a Sprint 05.
- O toque reduz lançamento silencioso. Um limiar frouxo, se O-01 for fechado assim no futuro, ainda pode preencher o resumo com leitura fraca. O usuário vê o resumo antes do toque.
- Anulação e reconfirmação podem confundir a fila se o status do documento não seguir a máquina.

## Dívida técnica conscientemente adiada

- Duplicidade na Sprint 05.
- Memória de correção na Sprint 08.
- Reembolso sugerido na Sprint 09.
- Edição visual avançada e atalhos da Sprint 10.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais a matriz da política de confirmação. Validação humana obrigatória no caminho feliz e numa pendência de valor ausente.

## Status

Status: PLANNED
