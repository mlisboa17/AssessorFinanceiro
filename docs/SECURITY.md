# Segurança

Estado: especificação de 2026-10-10. Nenhuma policy, bucket, variável ou projeto foi criado. Na sprint que for aplicar esta especificação, a sintaxe vigente da documentação do Supabase deve ser conferida de novo. O produto muda de versão com frequência.

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

Especificação de concessão, ainda não aplicada:

- `anon` não recebe acesso às tabelas financeiras nem ao bucket de comprovantes.
- `authenticated` recebe apenas as operações que a sprint realmente usa.
- `service_role` não é usada no caminho normal. Conceder privilégio a ela no Postgres não autoriza colocá-la no cliente.

Forma das policies de tabela de negócio:

- `SELECT`, `INSERT`, `UPDATE` e, somente onde a sprint permitir, `DELETE`: `user_id = (select auth.uid())`.
- `INSERT` também exige `with check` com o mesmo predicado.
- Tabela cujo identificador é o próprio usuário, como `profiles`, usa `id = (select auth.uid())`.
- `UPDATE` sem `SELECT` correspondente é especificação incompleta, porque o Postgres precisa ler a linha para alterá-la.
- A expressão `(select auth.uid())` evita reavaliar a função linha a linha. Confirmar essa forma na documentação vigente no momento da Sprint 01.

`audit_log` é diferente: `authenticated` só possui `SELECT` da própria trilha. `INSERT`, `UPDATE` e `DELETE` não são concedidos ao cliente. A escrita é trigger em função `security definer` colocada em schema privado, não exposto na API. O schema privado não entra nas grants de `anon` nem de `authenticated`.

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

## O que esta especificação não faz

Não cria policy, não liga advisor, não configura o painel e não revisa um projeto já existente. A primeira revisão executável ocorre na Sprint 01 para tabelas e na Sprint 02 para o bucket. O critério é o teste de dois usuários, mais a verificação de que o bucket recusa acesso sem sessão.
