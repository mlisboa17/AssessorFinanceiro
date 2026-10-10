# Sprint 00 — Foundation

## Objetivo

Criar o esqueleto executável do projeto, os padrões de repositório e a governança mínima, preservando a documentação de fundação já escrita em 2026-10-10.

## Valor de negócio

O desenvolvimento posterior ganha um lugar único para código, ambiente e verificação. Sem esse esqueleto, cada sprint inventaria estrutura, segredo e comando de teste.

## Escopo

- Conferir a documentação existente e corrigir apenas contradição descoberta durante o esqueleto.
- Inicializar Next.js com TypeScript, sem fluxo de negócio.
- Definir scripts de desenvolvimento, lint e teste unitário.
- Criar `.gitignore` e `.env.example` com nomes de variáveis e sem valores.
- Registrar a convenção: banco como fonte da verdade, módulo de IA somente no servidor e ausência de service role no cliente.
- Preparar o repositório Git local para commits identificáveis. O remoto GitHub fica para quando for pedido.
- Incluir um teste unitário trivial que prove o runner, sem regra financeira.

## Fora de escopo

- Telas de produto, schema, bucket, Auth configurado e chamada à Gemini API.
- Biblioteca de componentes, design system e PWA.
- Edge Functions, fila, cron e pacotes que só uma sprint futura usaria.
- Qualquer lançamento, upload ou cadastro.

## Dependências

Aprovação humana desta fundação documental. Não há sprint anterior.

## Decisões arquiteturais

- ADR-001 e ADR-002.
- Um único aplicativo Next.js. Pastas vazias para domínio futuro não são criadas.
- CSS simples do próprio Next.js. Kit de interface exigiria decisão nova.
- O teste usa o runner `node:test` do Node.js 25. Nenhuma dependência de teste foi adicionada. Playwright espera a primeira jornada de interface que precise dele.

## Modelo de dados afetado

Nenhum. O modelo lógico permanece em `docs/DATA_MODEL.md`.

## Backend

Não há backend de produto. A sprint apenas deixa o servidor Next.js apto a receber comandos nas sprints seguintes e documenta onde variáveis secretas poderão entrar.

## Frontend

Página inicial estática, mobile-first, com o nome Assessor Financeiro, a frase de propósito e o estado "Projeto em configuração". Sem formulário, dashboard ou dado financeiro.

## IA

Nenhum uso. O `.env.example` reserva o nome da variável da chave, sem cliente do provedor.

## Segurança

- `.env` e variantes locais entram no ignore.
- `.env.example` não contém segredo, URL real de projeto nem chave.
- A revisão da sprint procura segredo no diff.
- Nenhuma tabela exposta é criada, então ainda não há RLS para aplicar.

## Auditoria

Não há mutação de negócio. O changelog registra a criação do esqueleto.

## Cenários principais

1. Uma pessoa clona o repositório, copia o exemplo de ambiente sem valores reais e sobe a página inicial.
2. Lint e teste unitário rodam com sucesso num projeto ainda sem domínio.

## Casos de erro

1. Arquivo de ambiente local não pode ser necessário para a página inicial subir.
2. Segredo colado no exemplo ou no código falha a revisão da sprint.

## Testes obrigatórios

### Unitários

Um teste do runner, sem assert de regra de negócio.

### Integração

Não aplicável. Não há banco nem serviço externo.

### E2E

Não aplicável. Não há jornada de produto. A verificação humana abre a página inicial uma vez.

## Critérios de aceite

- O aplicativo sobe e mostra a página inicial.
- Lint e teste unitário passam.
- Não existe dependência de Gemini, cliente de banco usado por tela de produto nem migration.
- `.env.example` está completo em nomes e vazio em segredos.
- A documentação continua coerente com o esqueleto escolhido.

## Evidências necessárias

- Commit do esqueleto.
- Saída dos comandos de lint e teste.
- Lista curta das dependências adicionadas e por que cada uma é necessária para o esqueleto.
- Confirmação de que nenhum `.env` real foi versionado.

## Riscos

- O esqueleto pode puxar exemplo oficial com autenticação, banco e UI além do necessário. A sprint remove o que não for preciso para compilar e testar.
- Escolher cedo demais um kit visual aumenta a área de mudança da Sprint 10.

## Dívida técnica conscientemente adiada

- Remoto GitHub.
- Playwright.
- Pipeline de integração contínua.
- Geração de tipos do banco, que espera o schema da Sprint 01.

## Definition of Done

A [definição global](../DEFINITION_OF_DONE.md) mais os critérios desta sprint. Validação humana: abrir a página inicial e reconhecer que ainda não existe captura.

## Status

Status: DONE

Verificado em 2026-10-10, sem Supabase e sem Gemini:

- `npm test` passou, 1 teste.
- `npm run lint` passou.
- `npm run build` passou e gerou a rota estática `/`.
