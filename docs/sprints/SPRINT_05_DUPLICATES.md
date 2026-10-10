# Sprint 05 — Duplicate Detection

## Objetivo

Evitar lançamentos duplicados e guardar o candidato para uma pessoa decidir.

## Valor de negócio

Fotografar o mesmo comprovante duas vezes, ou lançar de novo o que já foi confirmado, deixa de inflar o gasto em silêncio.

## Escopo

- Tabela `duplicate_candidates`.
- Recomputação do SHA-256 no servidor a partir dos bytes do Storage antes de classificar duplicidade `strong`.
- Candidato `strong` pelo hash igual ao de outro documento que já tenha transação confirmada.
- Candidato `possible` pela heurística fechada em O-05.
- Bloqueio da confirmação enquanto existir candidato aberto.
- Ações humanas: confirmar que é duplicata ou dispensar.
- Arquivo e transação antiga preservados em qualquer decisão.

## Fora de escopo

- Fundir lançamentos, somar, editar o antigo automaticamente ou apagar arquivo.
- Similaridade por embedding, visão comparativa ou modelo de IA.
- Duplicidade de cadastro, de recorrência ou de reembolso.
- Varredura retroativa em massa além do necessário para o documento que está sendo confirmado. Uma verificação sob demanda da fila aberta pode existir se for a mesma função, sem job separado.

## Dependências

- Sprint 04 DONE.
- O-05 respondida.
- Ordem do roadmap: esta sprint vem antes da Sprint 06.

## Decisões arquiteturais

- Duplicidade é regra determinística sobre dados já persistidos.
- O hash do cliente, sozinho, não sustenta candidato `strong`.
- Não há novo serviço de busca.
- A função de comparação é pura nos critérios e isolada da tela.

## Modelo de dados afetado

Cria `duplicate_candidates` conforme `DATA_MODEL.md`. Não altera o significado de `transactions`. Acrescenta o uso do motivo `duplicate_candidate` em `pending_items`.

## Backend

- No caminho de confirmação, recalcular hash, procurar candidatos e, se houver, abrir pendência e candidato em vez de confirmar.
- Comandos para `confirmed_duplicate` e `dismissed`.
- `confirmed_duplicate` não cria a nova transação.
- `dismissed` devolve o documento ao fluxo de confirmação da Sprint 04.
- Hash divergente entre cliente e servidor atualiza a coluna com o valor do servidor e audita a correção. O valor do servidor prevalece.

## Frontend

- Na pendência, mostrar o lançamento existente e o comprovante novo.
- Ações "Já estava lançado" e "Não é duplicata".
- Candidato `possible` explica o critério em linguagem humana: valor, data e estabelecimento.
- Nenhuma das ações apaga o comprovante.

## IA

Nenhum uso. Esta sprint não pede ao modelo para dizer se dois comprovantes são o mesmo.

## Segurança

- RLS da tabela nova.
- Usuário não cria candidato apontando para transação de outra pessoa.
- Bytes do arquivo alheio não entram no cálculo de hash por troca de identificador.
- Log sem conteúdo do comprovante.

## Auditoria

Abertura e resolução do candidato, e correção de hash pelo valor do servidor, entram na trilha. O hash pode constar na trilha porque já é dado do documento do próprio usuário e é necessário para explicar a decisão. O arquivo não entra.

## Cenários principais

1. O mesmo arquivo é enviado duas vezes. O segundo fica pendente como duplicidade forte e não gera segunda despesa.
2. Dois comprovantes diferentes, com mesmo valor, mesmo estabelecimento normalizado e data dentro da janela, geram candidato possível.
3. O usuário dispensa o candidato possível e consegue confirmar.
4. O usuário aceita a duplicidade e permanece uma única transação confirmada, com dois documentos salvos.

## Casos de erro

1. Hash do cliente adulterado não produz `strong` se os bytes diferem.
2. Transação anulada não serve de âncora para duplicidade.
3. Dois cliques em "Já estava lançado" não corrompem o documento.
4. Falha ao baixar o arquivo para recomputar o hash interrompe a confirmação e deixa o documento pendente com erro recuperável, sem lançar.

## Testes obrigatórios

### Unitários

Normalização de estabelecimento, janela de O-05, classificação `strong` e `possible`, ignorar transação anulada e valores diferentes.

### Integração

Dois uploads do mesmo byte contra storage de teste, confirmação bloqueada, dispensa, aceite e isolamento entre usuários. Hash de cliente divergente do byte armazenado.

### E2E

No celular: confirmar um comprovante, enviar o mesmo arquivo de novo, ver a pendência de duplicidade e escolher "Já estava lançado". O total de despesas da lente econômica não dobra. A consulta de total pode ser verificação de teste, mesmo que a tela de revisão ainda não exista.

## Critérios de aceite

- O-05 está aplicado com as constantes decididas.
- Duplicidade forte depende do hash recalculado no servidor.
- Confirmação não ocorre com candidato aberto.
- Aceitar ou dispensar preserva os dois arquivos.
- Nenhuma chamada nova de IA foi introduzida.

## Evidências necessárias

- Testes das duas forças de candidato.
- Prova de um único lançamento após duplicidade forte aceita.
- Registro de que o total não dobrou no cenário E2E.
- Policies da tabela nova.

## Riscos

- A heurística possível gera falso positivo para gastos repetidos legítimos do mesmo valor. A dispensa humana é o contorno. A constante fica fácil de ajustar num único módulo.
- Conta de cartão e cupom da mesma compra podem não ter o mesmo hash nem o mesmo estabelecimento normalizado. A sprint não promete pegar esse caso.
- Recomputar hash baixa o arquivo. A operação usa a sessão do dono e não registra o conteúdo.

## Dívida técnica conscientemente adiada

- Comparação visual de imagens diferentes do mesmo papel.
- Duplicidade de lançamento manual contra comprovante quando não há estabelecimento.
- Conciliação de fatura.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais os cenários forte e possível. Validação humana da escolha "Já estava lançado".

## Status

Status: PLANNED
