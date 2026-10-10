# Arquitetura

Estado: fundação documental de 2026-10-10. A arquitetura descreve o sistema a ser construído. Ela não cria runtime, pasta de código nem serviço.

## Forma do sistema

Há um único aplicativo Next.js e um único projeto Supabase.

```text
Celular ou navegador
        |
        |  chave pública do Supabase + sessão do usuário
        v
Next.js
  - telas mobile-first
  - comandos de servidor para leitura automática, confirmação e revisão
  - módulo de IA marcado como somente servidor
        |
        |  JWT do usuário, para o RLS valer
        v
Supabase
  - Auth
  - PostgreSQL
  - Storage privado
        ^
        |
Gemini API
  chamada apenas pelo servidor Next.js
  resposta estruturada, validada antes de qualquer gravação
```

O banco é a fonte da verdade dos fatos confirmados. O arquivo no Storage é a fonte da verdade do comprovante original. A resposta da IA é evidência auxiliar, imutável e insuficiente para se considerar um lançamento.

## Revisão de arquitetura

Para cada capacidade, a ordem é reutilizar o que o stack já faz, adaptar um recurso existente e só então criar algo próprio.

| Capacidade | Decisão | Motivo |
| --- | --- | --- |
| Identidade | Reutilizar Supabase Auth | Login próprio seria um segundo sistema de sessão |
| Autorização | Reutilizar RLS no schema exposto | Autorização só na interface não impede a API do Supabase |
| Arquivos | Reutilizar Storage privado | Outro armazenamento criaria outra política de acesso |
| API de produto | Reutilizar Route Handlers ou Server Actions do Next.js | Um backend separado duplica deploy, sessão e segredo |
| Leitura de comprovante | Reutilizar Gemini com saída estruturada | Framework de agentes adiciona ferramentas e memória desnecessárias |
| Validação | Adaptar um validador de schema no servidor, na Sprint 03 | A resposta do modelo não entra crua |
| Auditoria | Adaptar uma função em schema privado e trigger, na Sprint 01 | Uma fila de eventos seria outro produto operacional |
| Processo após o upload | Adaptar um comando de servidor chamado em seguida pelo cliente | Fila, cron e Edge Function esperam um limite concreto de tempo ou de sessão |
| Tipos | Gerar a partir do schema na sprint que criar as tabelas | Tipos escritos à mão não podem competir com o banco |
| Dinheiro e data | Criar funções puras pequenas na sprint que precisar delas | O provedor de IA não é o lugar dessa regra |
| Estabelecimento mestre | Não criar tabela | O nome lido cabe na transação até existir edição compartilhada real |
| Rateio | Não criar tabela | O par `paid_by` / `belongs_to` cobre o caso de duas entidades |
| Chat, fila, barramento, microsserviço | Não criar | Nenhum fluxo deste roadmap exige esses mecanismos |

Não há arquitetura paralela. Não há modelo de domínio espelhado fora do PostgreSQL. Não há fonte de verdade na conversa com o modelo.

## Módulos previstos

As pastas nascem na Sprint 00 junto do esqueleto, e só recebem código na sprint que tem a responsabilidade.

- Interface: captura, revisão, cadastros e relatório. Não chama a Gemini API.
- Comandos de servidor: mudam documento, extração, transação e pendência com a sessão do usuário.
- Módulo de IA, somente servidor: monta o pedido, aplica o schema e devolve objeto validado ou erro.
- Funções puras: dinheiro, data, checksum de CPF/CNPJ, normalização de nome e comparação de duplicidade. Entram na sprint que as testa.
- Postgres: tabelas, restrições, índices das consultas reais, RLS e auditoria.

Não serão criadas camadas genéricas de caso de uso, porta e adaptador antes de existir uma segunda implementação real.

## Fluxo de captura

1. O cliente envia o arquivo direto ao bucket privado, no prefixo do próprio usuário, com a sessão autenticada.
2. O cliente grava `financial_documents` com status `RECEIVED`.
3. A interface mostra que o comprovante foi recebido.
4. A partir da Sprint 03, o cliente chama um comando de servidor para processar aquele documento.
5. O comando só prossegue se a troca condicional para `PROCESSING` tiver efeito. Uma segunda chamada simultânea não dispara outra leitura.
6. O servidor baixa o arquivo com a sessão do usuário, chama a Gemini API e valida a resposta.
7. Payload inválido não é gravado. Erro de provedor ou de schema grava tentativa sem o corpo retornado e marca o documento como `FAILED`.
8. Payload válido grava `ai_extractions` e marca o documento como `EXTRACTED`.
9. A Sprint 04 aplica a política de confiança e leva o documento a `CONFIRMED`, `PENDING` ou `REJECTED`.

Se o usuário fechar o aplicativo depois do passo 2, o arquivo e a linha permanecem. Reprocessar é uma ação explícita sobre um documento `RECEIVED`, `FAILED` ou `EXTRACTED` que ainda não tenha transação confirmada.

A fundação rejeita um worker desacoplado neste momento. O comando síncrono de servidor é mais simples e mantém o JWT do usuário, o que evita usar a service role no caminho normal. Se a Sprint 03 medir timeout real da plataforma, a adaptação para Edge Function ou fila será uma decisão nova, com ADR próprio.

## Fluxo de leitura e confirmação

A extração guarda fatos, evidências, sugestões e confiança. A política da Sprint 04 decide o lançamento.

- Um documento pode originar zero, uma ou várias transações. Cada candidata precisa de valor, data e direção com evidência compatível. A confiança é por campo. O-01 permanece aberta e a Sprint 00 não fixa um threshold único.
- Entidade, conta, cartão, estabelecimento, documento fiscal, categoria e parcela seguem regras próprias em [AI_RULES.md](AI_RULES.md). Confiança alta não transforma sugestão em fato.
- Com uma única entidade ativa e sem contradição, ela preenche `paid_by_entity` e `belongs_to_entity`.
- Com várias entidades e sem correspondência única, os dois lados ficam nulos e o resultado é pendência.
- A transação só nasce quando valor, data, direção e as duas entidades estão definidos.
- A decisão O-08 exige um toque no resumo antes de cada transação extraída ficar confirmada. O MVP inicial não grava transação financeira em silêncio.

## Onde cada verdade mora

| Verdade | Lugar |
| --- | --- |
| Quem é o usuário | Supabase Auth |
| Fato financeiro confirmado | `transactions` |
| Comprovante original | Storage privado, referenciado por `financial_documents` |
| Leitura automática | `ai_extractions`, append-only |
| O que falta revisar | `pending_items` |
| O que mudou | `audit_log` |
| Conversa com o modelo | Não é persistida como verdade |

Correção humana atualiza a transação. A extração que originou o preenchimento permanece intacta.

## Status do documento

`RECEIVED`, `PROCESSING`, `EXTRACTED`, `CONFIRMED`, `PENDING`, `REJECTED` e `FAILED`.

A transição é explícita e auditada. Um job não reescreve um status anterior sem passar pela transição permitida em [BUSINESS_RULES.md](BUSINESS_RULES.md). `EXTRACTED` existe para separar "a leitura válida foi armazenada" de "um humano ou a política de confirmação decidiu o lançamento". Se o processo cair entre esses dois momentos, a próxima abertura continua a classificação sem nova chamada ao modelo.

## Segurança estrutural

- Tabelas expostas nascem com RLS.
- O caminho normal de servidor usa a sessão do usuário.
- A service role não participa de CRUD de produto nem roda no navegador.
- O módulo da Gemini API é incompatível com importação em componente de cliente.
- Logs de aplicação carregam identificadores e códigos de erro, não o arquivo, o payload do modelo ou o número do cartão.

O detalhe das policies está em [SECURITY.md](SECURITY.md). Elas não são aplicadas nesta etapa.

## Evolução permitida

Uma sprint pode adicionar a tabela que ela introduz e as funções puras que seus testes exigem. Uma sprint não cria abstração para a sprint seguinte. Quando uma capacidade do Supabase passar a resolver um problema medido, a adaptação substitui código próprio. Esse momento exige entrada em `DECISIONS.md` e, se for difícil de reverter, um ADR novo.

## Consequências

- A disponibilidade da captura depende do Supabase, não da Gemini API. A leitura pode falhar com o documento já salvo.
- O processamento inicial depende de o usuário permanecer até chamar o comando, ou de voltar depois para tentar de novo.
- Relatórios da Sprint 07 leem transações confirmadas. Eles não relêem comprovantes nem pedem ao modelo para recalcular soma.
- Trocar o provedor de visão no futuro altera o módulo de IA e o `schema_version`. Não altera a transação confirmada.
