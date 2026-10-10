# Assessor Financeiro Pessoal e Empresarial

Aplicação para registrar, organizar e revisar despesas pessoais e empresariais. A captura começa pelo comprovante. A leitura automática vem depois, e só vira lançamento o que tiver evidência e confirmação humana.

Esta pasta está na Sprint 00. Há um aplicativo Next.js mínimo. Não há Supabase, Gemini nem regra financeira implementados.

## Propósito

Salvar o comprovante primeiro. Interpretar depois. Nunca perder o original. Quando um dado não puder ser sustentado, ele permanece ausente e uma pendência pede revisão.

O produto não é escrituração contábil e não calcula obrigação fiscal.

## Requisitos

- Node.js 25, versão usada nesta fundação
- npm 11

Não é necessário configurar Supabase nem Gemini para instalar, testar ou construir.

## Instalação

```bash
npm install
```

O arquivo `.env.example` só reserva nomes. Copiar para `.env.local` é opcional nesta sprint e não muda a página inicial. Não coloque segredo em arquivo versionado.

## Execução local

```bash
npm run dev
```

Abra `http://localhost:3000`. A página mostra o nome do produto, uma frase de propósito e o estado "Projeto em configuração".

## Testes

```bash
npm test
```

O runner é o `node:test` do Node.js. Não há framework de teste adicional.

## Build

```bash
npm run build
```

O build não lê Supabase nem Gemini.

## Lint

```bash
npm run lint
```

## Estrutura

```text
src/app/          rotas e página inicial
src/components/   apresentação da página inicial
src/lib/          texto público do produto
tests/            teste do texto público
docs/             fonte da verdade do produto
```

Não há camadas de domínio, repositório ou serviço. Elas só entram quando existir código real que as justifique.

## Segredos

- `.env`, `.env.local` e os demais `.env.*` ficam fora do Git.
- `.env.example` é versionado e não contém valor.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` é a chave pública atual do Supabase. Ela não autoriza dados sozinha.
- `SUPABASE_SECRET_KEY` é a chave secreta atual do Supabase. Ela fica só no servidor e não é usada nesta sprint.
- `GEMINI_API_KEY` fica só no servidor. O navegador não importa cliente de IA.
- Nenhum segredo entra em `NEXT_PUBLIC_`.

## Documentação

| Documento | Função |
| --- | --- |
| [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) | Produto |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisões aprovadas e em aberto |
| [docs/SPRINTS.md](docs/SPRINTS.md) | Índice das sprints |
| [docs/sprints/SPRINT_00_FOUNDATION.md](docs/sprints/SPRINT_00_FOUNDATION.md) | Contrato desta sprint |

Em conflito, um ADR aceito prevalece sobre regra de negócio, que prevalece sobre premissa, contrato de sprint e narrativa.

## Estado

| Item | Estado |
| --- | --- |
| Aplicação Next.js | Página inicial estática |
| Testes, lint e build | Configurados na Sprint 00 |
| Projeto Supabase | Não conectado |
| Gemini | Não integrado |
| Sprint 00 | DONE |
| Sprint 01 | PLANNED, aguardando revisão humana |
