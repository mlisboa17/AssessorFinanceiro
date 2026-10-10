# Princípios de UX

Estado: princípios de fundação de 2026-10-10. Não há tela implementada.

## Princípio principal

O usuário não preenche um formulário completo para registrar uma despesa. O sistema pede somente o que não conseguiu sustentar.

## Captura

A ação primária é `Registrar`. Foto, imagem e PDF nascem na Sprint 02. A digitação manual nasce na Sprint 04. O compartilhamento, quando o navegador permitir, entra na Sprint 10 como entrada adicional.

1. Tirar foto.
2. Escolher imagem.
3. Escolher PDF.
4. Digitar manualmente.

No celular, `Registrar` é a ação mais visível da área principal. Na experiência completa, as entradas cabem no polegar, com a câmera em primeiro lugar.

Depois que o arquivo entra no armazenamento e a linha do documento existe, a interface diz: "Comprovante recebido." Essa frase não espera a leitura automática. Ela também aparece se a leitura estiver indisponível.

Em seguida, quando a sprint correspondente existir, o resultado visível é um destes:

- resumo pronto para confirmar;
- pendência, com o documento já salvo;
- falha de leitura, com o documento já salvo e um caminho para tentar de novo ou lançar manualmente.

## Confirmação e pendência

O caminho feliz é um resumo dos campos já sustentados e um botão `Confirmar` para cada transação extraída. Não é um formulário. O toque é obrigatório antes da confirmação, pela decisão O-08.

A pendência mostra os campos que faltam ou que ficaram ambíguos, preenchidos com o que for seguro reaproveitar. O usuário não redige o comprovante inteiro de novo.

Sugestão de categoria, entidade ou estabelecimento aparece como sugestão. O rótulo não trata sugestão como fato já lançado.

Estados visíveis do documento usam linguagem humana:

| Status | Texto de interface |
| --- | --- |
| `RECEIVED` | Comprovante recebido |
| `PROCESSING` | Lendo comprovante |
| `EXTRACTED` | Leitura pronta para revisão |
| `CONFIRMED` | Confirmado |
| `PENDING` | Pendente |
| `REJECTED` | Rejeitado |
| `FAILED` | Não foi possível ler |

O status técnico permanece disponível para suporte e auditoria. A tela principal fala o texto humano.

## Velocidade de revisão

- Uma pendência diz o motivo em uma frase.
- A fila de pendências é acessível a partir do retorno da captura e de uma lista persistente.
- Duplicidade explica que já existe um lançamento parecido e oferece manter o antigo ou continuar com o novo.
- Anular um lançamento é possível a partir do detalhe, com confirmação simples, sem assistente.
- Ações destrutivas de arquivo não existem neste roadmap.

## Várias entidades

O usuário entende quem pagou e a quem pertence por dois campos nomeados em português: "Quem pagou" e "De quem é a despesa". Quando os dois são a mesma entidade, a tela pode mostrar um único valor e revelar a separação ao editar.

Com uma entidade só, a captura não pede essa escolha. Com várias, a escolha aparece apenas se a regra não tiver resolvido sozinha.

## Revisão financeira

A Sprint 07 oferece uma ação: "Fazer revisão financeira". O resultado é uma página com as seções já definidas nas regras de negócio, cada número com a lente e o período escritos junto. Não há caixa de conversa livre neste roadmap.

Se existir texto de apoio, ele vem depois dos números e não é a única forma de ver o relatório.

## Mobile

- A largura de referência do desenho é a do celular. O navegador de mesa acompanha, sem ser a primeira composição.
- Alvos de toque ficam confortáveis para uso com uma mão.
- A câmera e o seletor de arquivo usam os recursos da plataforma web. Não há aplicativo nativo neste roadmap.
- HEIC é convertido pela interface para um formato suportado antes do processamento, pela decisão O-02. A conversão entra na Sprint 02. Se ela falhar, a pessoa recebe uma explicação e o arquivo não segue.
- Compartilhar para o app, na Sprint 10, usa o mecanismo web disponível. Se o navegador não oferecer, a entrada some e as outras três permanecem.
- Instalação como PWA pode entrar na Sprint 10. Uso offline não entra.

## Confiança

- A interface não mostra categoria inferida como se o usuário já a tivesse escolhido.
- A interface não anuncia reembolso baixado, duplicidade fundida nem assinatura lançada para o futuro.
- Falha de IA não parece falha de salvamento. As duas mensagens são distintas.
- Antes da primeira leitura automática, uma frase informa que a interpretação usa um serviço de IA e que a conferência continua com o usuário.

## Fora da experiência deste roadmap

Formulário longo obrigatório, dashboard decorativo antes da captura, chatbot, onboarding com muitas etapas, tema configurável, notificações push e qualquer fluxo que exija cadastrar estabelecimento antes de lançar a despesa.
