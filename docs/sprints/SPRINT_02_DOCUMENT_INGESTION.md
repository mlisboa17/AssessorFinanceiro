# Sprint 02 — Document Ingestion

## Objetivo

Receber foto, imagem ou PDF, gravar o original em storage privado e persistir o documento com status `RECEIVED` antes de qualquer processamento de IA.

## Valor de negócio

O usuário passa a poder capturar um comprovante sem medo de perdê-lo e sem esperar uma leitura que ainda não existe.

## Escopo

- Bucket privado `financial-documents`.
- Tabela `financial_documents`.
- Upload direto do cliente autenticado para o prefixo do próprio usuário.
- Ação `Registrar` com tirar foto, escolher imagem e escolher PDF.
- Mensagem "Comprovante recebido." somente depois do objeto e da linha existirem.
- Hash SHA-256 calculado no cliente e guardado na linha, junto de tamanho, tipo e nome original de exibição.
- Allowlist persistida: JPEG, PNG, WEBP e PDF.
- Conversão de HEIC para JPEG no cliente, antes do upload, conforme O-02. Se a conversão falhar, o arquivo não é enviado e a interface explica o motivo.

## Fora de escopo

- Chamada à Gemini API e qualquer status além de `RECEIVED`.
- Transação, pendência, lançamento manual e compartilhamento do sistema operacional.
- Substituição ou exclusão do arquivo.
- URL pública permanente.
- Recompute servidor do hash. Isso entra na Sprint 05, quando o hash passa a decidir duplicidade forte.

## Dependências

Sprint 01 DONE. O-02 já está decidido: a conversão acontece nesta sprint, no cliente.

## Decisões arquiteturais

- ADR-003.
- Upload direto ao Storage reutiliza a plataforma e evita receber o arquivo no processo do Next.js.
- O runner de ponta a ponta entra nesta sprint, porque aqui nasce a primeira jornada de interface. A Sprint 00 apenas deixou essa escolha para este momento.
- O nome do objeto é gerado. O nome original não compõe o caminho.
- Não há fila de upload nem cache offline.

## Modelo de dados afetado

Cria `financial_documents` como em `DATA_MODEL.md`, com `source` limitado a `camera`, `image_upload` e `pdf_upload`. Status inicial único desta sprint: `RECEIVED`.

## Backend

- Migration da tabela com RLS.
- Policies de storage para `INSERT` e `SELECT` do dono no bucket nomeado. Sem `UPDATE` e sem `DELETE`.
- Comando para criar a linha do documento depois do upload, verificando tipo e tamanho máximo de 15 MB.
- Leitura autorizada do próprio arquivo para a lista da sprint, por URL assinada curta ou equivalente, sem persistir a URL.

O limite de 15 MB é regra desta sprint. Se a plataforma impedir arquivos menores, a sprint registra o limite real em `DECISIONS.md` em vez de contornar com outro armazenamento.

## Frontend

- Botão `Registrar` e as três entradas de arquivo.
- A digitação manual aparece desabilitada ou ausente, porque o lançamento manual é da Sprint 04. A ausência precisa ser honesta, não um botão morto sem explicação. A sprint mostra somente as três entradas que funcionam.
- Lista simples dos comprovantes recebidos, com data de recebimento e status humano.
- Abertura do próprio comprovante.
- Erro de tipo, tamanho ou rede sem apagar um arquivo já confirmado como recebido.

## IA

Nenhum uso. O código desta sprint não importa cliente de modelo.

## Segurança

- Bucket privado verificado por tentativa de acesso sem sessão e com sessão de outro usuário.
- RLS da tabela nova no teste de dois usuários.
- Caminho do objeto preso ao `user_id` da sessão.
- URL assinada com expiração curta, não registrada em log.
- Nome original tratado como texto de exibição, não como caminho.

## Auditoria

Receber documento grava ação `document.received` com identificadores, tipo e tamanho. O log não inclui o arquivo nem o hash completo se o hash for considerado sensível em combinação com o comprovante; a sprint guarda o hash na tabela do documento e, na auditoria, apenas o identificador do documento. O hash continua consultável na linha autorizada pelo RLS.

## Cenários principais

1. O usuário fotografa um comprovante JPEG e vê "Comprovante recebido."
2. O usuário envia um PDF dentro do limite e o encontra na lista depois de recarregar.
3. O usuário abre o próprio arquivo pela autorização do Storage.

## Casos de erro

1. HEIC, GIF ou tipo desconhecido é recusado e nenhuma linha `RECEIVED` nasce.
2. Arquivo acima de 15 MB é recusado.
3. Falha entre o upload e a linha do documento fica visível como erro de conclusão. A sprint não chama IA para compensar. O tratamento deixa o objeto órfão identificável para limpeza manual futura, sem apagá-lo automaticamente nesta sprint.
4. Outro usuário não baixa o objeto nem lê a linha.

## Testes obrigatórios

### Unitários

Allowlist de MIME, limite de tamanho e resultado da conversão HEIC para JPEG. Falha de conversão não produz documento.

### Integração

Dois usuários sobem arquivos. Cada um lê o próprio e não lê o do outro. Acesso anônimo ao bucket falha.

### E2E

Em viewport de celular: registrar uma imagem, ver a mensagem de recebimento, recarregar e ver o documento na lista. Um segundo cenário recusa um tipo fora da allowlist.

## Critérios de aceite

- O documento só é anunciado como recebido depois do objeto e da linha `RECEIVED`.
- Nenhuma chamada de IA existe no código da sprint.
- O bucket não é público.
- Usuário A não acessa comprovante do usuário B.
- JPEG, PNG, WEBP e PDF dentro do limite funcionam. HEIC é convertido para JPEG antes do upload. Conversão impossível não cria documento.

## Evidências necessárias

- Commit com migration, policies de storage e a captura.
- Resultado dos testes de isolamento de tabela e bucket.
- Registro do fluxo em viewport estreito: recebimento, recarga e recusa de tipo.
- Confirmação de que a lista de status gravados nesta sprint contém apenas `RECEIVED`.

## Riscos

- Objeto órfão se a linha do banco falhar depois do upload. A limpeza automática fica adiada para não apagar comprovante por engano.
- Hash de cliente pode ser incorreto. Ele ainda não decide regra financeira.
- Upload direto depende de policy correta de `INSERT`. Policy só de tabela não protege o arquivo.

## Dívida técnica conscientemente adiada

- Recompute de hash no servidor, na Sprint 05.
- Compartilhamento do sistema, na Sprint 10.
- Limpeza de objetos órfãos.
- Lançamento manual, na Sprint 04.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais a prova de que o recebimento acontece sem IA e com bucket privado. Validação humana: enviar uma foto real ou fixture e ver "Comprovante recebido."

## Status

Status: PLANNED
