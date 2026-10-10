# Especificação de produto

Estado: fundação documental de 2026-10-10. Nenhum fluxo está implementado.

## Para quem é

Uma pessoa administra as próprias despesas e as despesas de uma ou mais empresas. Ela usa várias contas e vários cartões e precisa lançar um gasto sem montar um formulário completo.

O primeiro recorte tem um único usuário autenticado como dono de todos os dados. Não há família, sócio, contador nem operador compartilhando a mesma base.

## O que o produto faz

O usuário entrega um comprovante ou informa um lançamento manual. O sistema preserva o original, tenta ler os dados e liga o que conseguir a entidade e ao instrumento. A categoria pode ser sugerida, lembrada por regra explícita ou confirmada pelo usuário. Ela não é um fato extraído no mesmo nível de valor, data ou estabelecimento. Em seguida o sistema procura duplicidade e só confirma transação depois de um toque. Dúvida vira pendência. Dado ausente permanece ausente.

Um FinancialDocument pode originar zero, uma ou várias transações. Comprovantes simples normalmente originam uma transação. Documentos compostos, como faturas, extratos ou PDFs contendo vários lançamentos, podem originar múltiplas transações. A decomposição só pode ocorrer quando houver evidência suficiente no documento.

Uma despesa distingue quem pagou de quem deve carregar o gasto:

- `paid_by_entity` é quem efetivamente pagou.
- `belongs_to_entity` é a quem a despesa pertence economicamente.

Exemplo: a pessoa física paga R$ 2.000 de uma despesa da Empresa A. `paid_by_entity` é a pessoa física. `belongs_to_entity` é a Empresa A. Isso pode, na Sprint 09, originar um reembolso sugerido. Não nasce baixado.

## Fluxo principal

1. O usuário tira uma foto, escolhe uma imagem, escolhe um PDF ou digita o lançamento.
2. O arquivo, quando existe, é gravado em storage privado e o registro do documento nasce antes de qualquer leitura automática.
3. A interface confirma o recebimento.
4. A interpretação devolve JSON validado, com evidência e confiança por campo.
5. Campos críticos confiáveis preenchem um resumo. Campos incertos ficam nulos.
6. A política de revisão confirma a transação ou abre pendência.
7. Duplicidade, recorrência, revisão financeira, preferências entre entidades e reembolso entram nas sprints próprias, nessa ordem.

A pendência não impede o salvamento do documento.

## Prioridades

1. Captura extremamente simples.
2. Confiabilidade financeira.
3. Rastreabilidade.
4. Auditoria.
5. Segurança.
6. Velocidade de revisão.
7. Redução de digitação.
8. Aprendizado de preferências por regras explícitas, não por um modelo próprio.
9. Várias empresas de verdade, com atribuição conservadora até a Sprint 08.
10. Expansão futura sem reescrever o fato de quem pagou e de quem é o dono econômico.

## Superfícies previstas neste roadmap

- Fotografar comprovante.
- Enviar imagem.
- Enviar PDF.
- Lançar manualmente.
- Compartilhar um comprovante para o app, na Sprint 10, se a plataforma web permitir.
- Pedir uma revisão financeira por uma ação explícita, na Sprint 07.

WhatsApp fica fora do roadmap atual.

## Conceitos

Os conceitos e o momento em que cada um vira tabela estão em [DATA_MODEL.md](DATA_MODEL.md). Os nomes canônicos são: User, Entity, FinancialAccount, PaymentCard, Merchant, Category, FinancialDocument, Transaction, TransactionAllocation, PendingItem, RecurringCharge, DuplicateCandidate, Reimbursement, AuditLog e AIExtraction.

Merchant e TransactionAllocation são conceitos do domínio e não ganham tabela nas sprints 00 a 10. A justificativa está em [DECISIONS.md](DECISIONS.md).

## O que uma transação representa

O produto usa lançamento simples. Cada transação é um fato visto uma vez, com `currency_code` explícito. O MVP usa `BRL` como default. Não há partida dobrada, plano de contas contábil nem conciliação de fatura de cartão.

Os totais de gasto incluem despesas confirmadas. Uma compra no cartão e o pagamento posterior da fatura são fatos diferentes. Este roadmap registra a compra. Não reconstrói a fatura. Somar os dois como despesa seria uma decisão de produto futura, e a fundação a rejeita.

Toda consulta de totais declara a lente:

- lente econômica: agrupa por `belongs_to_entity`;
- lente de caixa: agrupa por `paid_by_entity`.

As duas lentes não são somadas entre si.

## Revisão crítica do produto

A proposta original é coerente e grande demais para um único incremento. A fundação mantém o problema e recusa os atalhos que tornariam o número financeiro mentiroso ou a arquitetura prematura.

### Riscos de produto

- A palavra "assessor" sugere conselho. O produto organiza fatos e aponta atenção. Não recomenda investimento, não fecha imposto e não produz demonstração contábil.
- Várias empresas no primeiro dia de modelo são necessárias por causa de `paid_by` e `belongs_to`. Inteligência para adivinhar a empresa certa vem só na Sprint 08. Antes disso, a regra é conservadora.
- A revisão em linguagem natural, se virar conversa livre, passa a competir com o banco como fonte da verdade. A Sprint 07 é um relatório fixo. Todo número financeiro mostrado ao usuário deve ser produzido por consulta determinística ou cálculo verificável sobre dados persistidos. A IA pode explicar, resumir e comparar esses números, mas não pode inventá-los, recalculá-los de memória ou alterar seus valores.
- Aprender preferências, se virar treino de modelo, é um segundo produto. A Sprint 08 grava correções do usuário como regras de correspondência.

### Riscos financeiros

- Valor, data ou parcela inventados corrompem o histórico de forma silenciosa.
- Confirmar automaticamente uma leitura fraca grava um fato que o usuário pode não revisar.
- Tratar transferência, pagamento de fatura ou estorno como despesa infla o gasto.
- Desdobrar parcela em lançamentos futuros inventa datas e valores que o comprovante não individualizou.
- Um PDF com muitos lançamentos condensado num único total mistura fatura e comprovante.
- Reembolso criado e baixado sozinho gera caixa fictício.
- Rateio automático distribui valor sem uma regra que o usuário tenha confirmado.

### Riscos de IA

- O modelo pode ler um dígito que não está no papel.
- O texto do comprovante pode tentar instruir o modelo.
- CNPJ, cartão e categoria parecidos podem ser ligados à ficha errada.
- O envio do comprovante a um provedor externo é tratamento de dado pessoal e financeiro.

### Problemas de modelagem tratados aqui

- User de autenticação e Entity financeira são coisas diferentes.
- Conta e cartão são instrumentos diferentes. O cartão não é uma segunda despesa.
- O status do documento descreve a captura. O status da transação descreve o lançamento.
- Pendência é uma fila de revisão. Ela não é uma transação sem valor.
- Extração é evidência imutável. Correção humana altera a transação e entra na auditoria.

### Premissas frágeis

- Documento composto só vira várias transações quando cada lançamento tem evidência suficiente. Sem essa evidência, a linha não é inventada e o arquivo permanece salvo.
- A data numérica brasileira é dia, mês e ano. Data ambígua que não passa nessa leitura fica nula.
- O usuário confere o resumo quando a leitura parece completa. A decisão O-08 exige um toque antes de a transação extraída ficar confirmada.
- Há, no início, uma entidade pessoa física criada com o usuário. Isso sustenta o padrão de entidade única.

### O que não construir ainda

- WhatsApp e qualquer mensageria.
- Sincronização com banco, Open Finance, OFX ou e-mail.
- PWA offline e fila local de comprovantes.
- Chat livre sobre as finanças.
- Rateio entre muitas entidades.
- Conciliação de fatura de cartão.
- Série futura de parcelas ou de assinaturas lançada sozinha.
- Orçamento, meta, investimento e alerta agendado.
- Multiusuário, convite e perfil de contador.
- Câmbio e lançamento em moeda diferente de BRL. A coluna `currency_code` existe e o default do MVP é BRL.
- Motor genérico de regras, barramento, microsserviço e framework interno.
- Cadastro mestre de estabelecimentos.
- Exclusão de conta e política formal de retenção. O item O-03 precisa de decisão própria e não bloqueia a captura.

### Validação humana continua obrigatória

- Campo crítico sem evidência suficiente.
- Mais de uma entidade compatível com o comprovante.
- Criação de empresa, conta ou cartão. A leitura nunca cria esses cadastros.
- Candidato a duplicidade.
- Sugestão de recorrência.
- Sugestão de reembolso e qualquer baixa dele.
- Números da revisão financeira, que saem das consultas; o texto gerado não é conferido como fato novo.

### Caminho mais simples adotado na fundação

O caminho feliz é um resumo preenchido, não um formulário. Cada transação extraída exige um toque em confirmar antes de valer nos totais. O documento já está salvo antes desse toque. O MVP inicial não grava transação financeira em silêncio.

## Critério de sucesso deste roadmap

Uma pessoa consegue, pelo celular, enviar um comprovante, vê-lo preservado, confirmar um lançamento com pouca digitação quando a leitura é boa, resolver pendência quando não é, separar pessoa e empresas, evitar duplicidade óbvia, enxergar recorrências sugeridas, pedir uma revisão calculada e acompanhar reembolso entre entidades. Tudo isso com isolamento por usuário e trilha de auditoria.
