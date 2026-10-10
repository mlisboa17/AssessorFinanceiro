# Segurança

Estado: especificação de 2026-10-10, com a auditoria 01E das tabelas de cadastro e a trilha 01F em `private.audit_log`. Bucket continua fora. A sintaxe do Supabase muda com frequência e foi conferida nesta entrega.

## Objetivo

O usuário A não lê, altera, apaga nem infere dados financeiros do usuário B. O comprovante não é público. O segredo não entra no repositório nem no navegador. A autorização efetiva está no Postgres e no Storage, não apenas na tela.

## Identidade

- Supabase Auth emite a sessão.
- `profiles.id` é `auth.users.id`.
- Autorização não usa `user_metadata` nem `raw_user_meta_data`. Esses campos são editáveis pelo usuário e podem aparecer no JWT.
- Papel administrativo de produto não faz parte deste roadmap. Não há claim especial para elevar privilégio.
- O MVP autentica com e-mail e senha, decisão O-04. A implementação fica na Sprint 01, via Supabase Auth, e essa escolha não impede magic link depois.

## RLS

Toda tabela criada no schema exposto, em especial `public`, nasce com RLS habilitado na mesma migration que a cria. A migration também concede só o que cada papel precisa.

Concessão conferida na auditoria 01E para as quatro tabelas de cadastro:

- `anon` não recebe acesso às tabelas financeiras nem ao bucket de comprovantes.
- `authenticated` recebe apenas as operações que a sprint realmente usa.
- `service_role` não é usada no caminho normal. Conceder privilégio a ela no Postgres não autoriza colocá-la no cliente.

Forma das policies de tabela de negócio:

- `SELECT`, `INSERT`, `UPDATE` e, somente onde a sprint permitir, `DELETE`: `user_id = (select auth.uid())`.
- `INSERT` também exige `with check` com o mesmo predicado.
- Tabela cujo identificador é o próprio usuário, como `profiles`, usa `id = (select auth.uid())`.
- `UPDATE` sem `SELECT` correspondente é especificação incompleta, porque o Postgres precisa ler a linha para alterá-la.
- A expressão `(select auth.uid())` evita reavaliar a função linha a linha. Confirmar essa forma na documentação vigente no momento da Sprint 01.

`private.audit_log` não é concedida a `anon` nem a `authenticated`. Não há `SELECT` nesta sprint. A escrita é o trigger `private.audit_row_change()`, `security definer`, com `search_path` vazio. `EXECUTE` foi revogado de `public`, `anon` e `authenticated`; o disparo do trigger continuou válido. Não existe função equivalente em `public`.

Views, se alguma sprint precisar delas, nascem com `security_invoker = true`. View sem essa propriedade não é aceita como superfície de leitura.

Função `security definer` não fica em schema exposto.

## Isolamento mínimo testável

A Sprint 01 cria dois usuários de teste. Cada um insere uma entidade. Cada um tenta ler e alterar a entidade do outro pela API com a própria sessão. O resultado esperado é vazio ou negado, nunca a linha alheia. As sprints que criam tabelas novas repetem o mesmo teste para a tabela nova e para o bucket, quando houver arquivo.

## Storage

- Bucket `financial-documents`, privado, sem acesso público e sem URL permanente aberta.
- Caminho do objeto: `{user_id}/{document_id}/{object_name_gerado}`.
- O nome original do arquivo fica só na coluna de exibição.
- Policies de `storage.objects` limitam `bucket_id` e exigem que a primeira pasta seja `(select auth.uid())`.
- `SELECT`, `INSERT` e `UPDATE` do dono são necessários se o cliente puder substituir o objeto. A Sprint 02 não oferece substituição de comprovante. Portanto a policy inicial cobre `INSERT` e `SELECT` do dono, não `UPDATE` nem `DELETE`.
- Leitura para exibir o comprovante usa URL assinada de curta duração, emitida no servidor com a sessão do usuário, ou leitura autorizada equivalente do Storage. A URL não é gravada como permanente.
- O comando de IA baixa o objeto com a sessão do usuário que pediu o processamento.

Arquivo nunca é público por padrão. Bucket público, link permanente e pasta compartilhada estão fora da especificação.

## Service role

A chave de service role ignora RLS. Por isso:

- não entra em variável `NEXT_PUBLIC_` nem em outro símbolo exposto ao bundle;
- não é usada em componente de cliente;
- não é o cliente padrão dos comandos de servidor;
- não aparece em log, teste comitado nem fixture.

O caminho normal usa a sessão do usuário, inclusive no servidor, para que o RLS continue valendo. Se uma sprint futura precisar da service role, o motivo, o comando e o limite ficam numa decisão nova antes da implementação. A fundação não reserva uso para ela.

## Segredos

Variáveis previstas quando o projeto existir:

- `NEXT_PUBLIC_SUPABASE_URL`, pública.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, chave publishable atual do Supabase. Ela identifica o projeto e não autoriza sozinha o acesso aos dados.
- `GEMINI_API_KEY`, somente servidor.
- `SUPABASE_SECRET_KEY`, somente servidor. É o nome atual da chave secreta do projeto. A service role legada permanece fora do cliente e fora do caminho normal. Nenhuma das duas recebe prefixo `NEXT_PUBLIC_`.

`.env` e arquivos equivalentes não são versionados. `.env.example` da Sprint 00 contém nomes, sem valor. Segredo encontrado no Git é incidente: a chave é revogada, não apenas removida no commit seguinte.

## Logs

Log de aplicação pode conter identificador de usuário, identificador de documento, status e `error_code`.

Log de aplicação não contém arquivo, texto integral do comprovante, payload da extração, valor, CPF, CNPJ, `last4`, PAN, URL assinada, JWT, chave pública usada como se fosse segredo de sessão, prompt nem resposta bruta do modelo.

A trilha `audit_log` fica no banco do próprio usuário e segue a redação definida no modelo de dados. Ela não é copiada para um coletor externo neste roadmap.

## Dados pessoais

Comprovante pode conter CPF, cartão, endereço e saúde financeira. Enviá-lo à Gemini API é tratamento por um operador externo. Antes da primeira chamada, a Sprint 03 mostra uma frase clara de que a leitura automática usa um serviço de IA e não substitui a conferência. Essa frase não é a política de privacidade. Prazo de retenção e exclusão permanecem na decisão O-03.

Até O-03, o produto não oferece apagar a conta nem promete prazo de descarte.

## Superfície da aplicação

- Mutação financeira relevante passa por comando de servidor que também deixa trilha, seja pelo trigger, seja pelo próprio comando quando o trigger ainda não cobre a tabela. A partir da Sprint 01 o mecanismo previsto é o trigger.
- O navegador não importa o módulo da Gemini API.
- Dependência nova, quando uma sprint realmente precisar, entra no registro da sprint. Não se antecipa biblioteca de criptografia, fila ou auth paralela.
- Cabeçalho, CORS amplo e endpoint anônimo de upload não fazem parte do desenho.

## Revisão 01E

Em 2026-10-10, as quatro tabelas de cadastro foram auditadas no banco real.

- RLS está habilitado. Não há policy de `DELETE`.
- `anon` não tem privilégio. A Data API anônima respondeu 401 nas quatro tabelas.
- `authenticated` tem somente `SELECT`, `INSERT` e `UPDATE`. Não tem `TRUNCATE`, `REFERENCES` nem `TRIGGER`.
- Conta e cartão referenciam `entities(id, user_id)`. A relação com entidade de outro usuário foi recusada.
- Categoria de sistema é legível e não é editável. Categoria privada não é visível para o outro usuário.
- `payment_cards` guarda no máximo `last_four`. Não há coluna de número completo, código de segurança, validade ou token.
- As funções de `updated_at` ficam no schema `private`, sem `SECURITY DEFINER`, com `search_path` vazio, e sem `EXECUTE` para `anon` ou `authenticated`.
- `public.rls_auto_enable` é event trigger da plataforma. O aviso do advisor foi aceito, conforme `DECISIONS.md`. Não houve mudança de função.
- Avisos de índice sem uso e de chave estrangeira composta sem índice exatamente na ordem das colunas são desempenho, não autorização. Não foram alterados.

## Revisão 01F

Em 2026-10-10, `private.audit_log` passou a registrar insert, update e delete de `entities`, `financial_accounts`, `payment_cards` e `categories`.

- O dono sai de `user_id` da linha. O ator sai de `auth.uid()`.
- `UPDATE` grava o estado anterior e o estado final, depois do trigger de `updated_at`. `changed_fields` não inclui `updated_at`.
- `INSERT` e `DELETE` deixam `changed_fields` nulo.
- A Data API não enxerga a tabela nem a função. Tentativas autenticadas e anônimas de ler, inserir, alterar ou apagar a trilha falharam.
- O advisor marca RLS sem policy em `private.audit_log` como informação. A policy não foi criada: a ausência de policy é a barreira, e uma policy de leitura abriria a trilha. `public.rls_auto_enable` permanece o aviso já aceito na 01E.

A revisão do bucket continua prevista para a Sprint 02.
