# Sprint 10 — Mobile UX Polish

## Objetivo

Tornar o registro de uma despesa o mais rápido possível no celular, usando os fluxos que as sprints anteriores já tornaram corretos.

## Valor de negócio

A captura é o hábito diário do produto. Cada toque a menos na foto, na pendência e na confirmação aumenta a chance de o comprovante entrar no sistema sem virar digitação.

## Escopo

- Revisar a jornada `Registrar` em viewport de celular: câmera, imagem, PDF e lançamento manual.
- Reduzir a confirmação e a pendência ao que `UX_PRINCIPLES.md` já definiu, sem regra financeira nova.
- Manter a conversão HEIC da Sprint 02 rápida e compreensível no celular. Esta sprint não cria a conversão de novo.
- Compartilhar um arquivo para o app quando o navegador oferecer Web Share Target, gravando o documento pelo mesmo caminho da Sprint 02 com `source = share`.
- Manifesto de instalação PWA, se isso aproximar a câmera e o compartilhamento. Sem cache offline de comprovante e sem fila local.
- Estados vazios, erro de rede e "Comprovante recebido." visíveis sem esperar a IA.
- Alvos de toque e hierarquia da ação primária.

## Fora de escopo

- Nova regra de valor, entidade, duplicidade, recorrência ou reembolso.
- Aplicativo nativo.
- Offline-first, sincronização posterior e service worker que sirva dados financeiros sem rede.
- Redesign de todas as telas de cadastro além do que a captura precisa.
- WhatsApp.
- Tema, animação decorativa e biblioteca nova de componentes, a menos que um obstáculo concreto de acessibilidade não possa ser resolvido com CSS. Nesse caso a escolha entra em `DECISIONS.md` antes de a dependência ser adicionada.

## Dependências

Sprints 02 e 04 DONE. Na ordem do roadmap, as sprints até a 09 estão encerradas, e o polimento considera pendência, duplicidade e confirmação já existentes. Reembolso não precisa ser redesenhado além de continuar usável no celular.

## Decisões arquiteturais

- A sprint adapta a interface existente. Não cria um segundo fluxo de captura.
- Compartilhamento reutiliza o upload e a linha `financial_documents`.
- PWA instalável reutiliza a plataforma web. Offline seria outro produto de sincronização e permanece fora.
- HEIC, se convertido, é convertido no navegador antes do byte entrar no Storage, preservando o allowlist do servidor.

## Modelo de dados afetado

Amplia `financial_documents.source` com `share`. Nenhuma tabela nova.

## Backend

- Aceitar `source = share` no comando já existente de criação do documento.
- Recusar compartilhamento que não passe na mesma allowlist e no mesmo limite de 15 MB.
- Nenhuma mudança de policy além do que o novo `source` exigir, e o `source` não muda a posse do arquivo.

## Frontend

- Hierarquia visual da captura no celular.
- Retorno imediato de "Comprovante recebido."
- Resumo e pendência com uma ação primária clara.
- Caminho de compartilhamento, oculto quando o navegador não suportar.
- Manifesto e ícones mínimos se a instalação for incluída.
- A conversão HEIC permanece a da Sprint 02. Esta sprint só ajusta a mensagem e o encaixe no polegar se a jornada mostrar atrito.

## IA

Nenhum uso novo e nenhuma mudança de prompt. O tempo percebido da leitura pode ganhar estado de progresso já especificado, sem antecipar a chamada.

## Segurança

- Arquivo compartilhado segue o mesmo bucket privado e o mesmo prefixo do usuário autenticado.
- Share Target não cria endpoint anônimo.
- PWA não armazena comprovante em cache persistente.
- Revisão de que a chave de IA continua fora do cliente depois das mudanças de bundle.

## Auditoria

Documento recebido por compartilhamento usa a mesma ação `document.received`, com `source = share`. Não há auditoria nova para ajuste visual.

## Cenários principais

1. No celular, o usuário tira uma foto e vê o recebimento antes da leitura terminar.
2. O usuário resolve uma pendência só com os campos faltantes, com o polegar, sem rolar um formulário longo.
3. Onde o navegador permitir, compartilhar uma imagem abre o app já autenticado e grava o documento.
4. Instalar o atalho, se o manifesto entrar, não muda o comportamento online.

## Casos de erro

1. Compartilhamento sem sessão leva ao login e não grava arquivo anônimo.
2. Arquivo compartilhado acima do limite ou fora da allowlist é recusado com a mesma clareza da Sprint 02.
3. Navegador sem Share Target continua com câmera, imagem, PDF e manual.
4. Falha de rede depois do recebimento não perde a linha `RECEIVED`.

## Testes obrigatórios

### Unitários

Validação de `source = share`. A conversão HEIC permanece coberta pela Sprint 02.

### Integração

Documento `share` respeita RLS e o prefixo do dono. Usuário não autenticado não conclui o recebimento.

### E2E

Viewport de celular: foto ou fixture de imagem até "Comprovante recebido."; pendência resolvida com um campo; lançamento manual ainda acessível. Share Target é testado onde o ambiente permitir e, onde não permitir, a evidência registra a limitação em vez de simular suporte inexistente.

## Critérios de aceite

- O caminho de captura no celular cumpre os textos de `UX_PRINCIPLES.md`.
- Nenhuma regra de `BUSINESS_RULES.md` ou `AI_RULES.md` mudou, salvo o valor novo de `source`.
- Não há modo offline de comprovante.
- Compartilhamento, quando presente, usa o pipeline já seguro da Sprint 02.
- As jornadas de confirmar, pendenciar e duplicidade continuam passando.

## Evidências necessárias

- Registro em viewport de celular das quatro entradas, ou das três mais a recusa honesta do que o navegador não suporta.
- Testes E2E das jornadas afetadas.
- Confirmação de que nenhum cache offline de dado financeiro foi adicionado.
- Nota de que a conversão HEIC continua sendo a da Sprint 02.

## Riscos

- Polimento visual pode alterar sem querer a ordem da política de confirmação. Os testes da Sprint 04 e da Sprint 05 são a rede de segurança.
- Share Target varia por navegador. A sprint não deve bloquear o DONE por ausência de suporte num navegador específico, desde que o caminho clássico esteja sólido e a limitação esteja escrita.
- Manifesto mal configurado pode cachear resposta autenticada. A revisão de segurança olha isso explicitamente.

## Dívida técnica conscientemente adiada

- Offline.
- Aplicativo nativo.
- Ícones e tela de abertura elaborados.
- Atalho de widget do sistema operacional.
- Redesign das telas de relatório e reembolso além da usabilidade mínima já verificada.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais a passagem das jornadas anteriores de captura, confirmação e duplicidade no viewport de celular. Validação humana obrigatória dessa captura.

## Status

Status: PLANNED
