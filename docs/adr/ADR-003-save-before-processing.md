# ADR-003 — Salvar antes de processar

- Status: aceito
- Data: 2026-10-10

## Contexto

A leitura automática pode atrasar, falhar, inventar um campo ou ficar indisponível. O valor principal do produto é não perder o comprovante que o usuário acabou de capturar.

## Decisão

O arquivo entra no bucket privado e a linha do documento é persistida com status `RECEIVED` antes de qualquer chamada à Gemini API. A interface pode confirmar o recebimento nesse momento.

A interpretação é um passo posterior. Falha, timeout ou schema inválido levam a `FAILED` ou a uma nova tentativa. Nenhum desses resultados apaga o arquivo ou a linha.

Lançamento manual não fabrica um arquivo vazio. Ele cria transação sem documento. Quando há arquivo, o arquivo existe mesmo que nunca exista transação.

## Consequências

- O usuário pode ficar com comprovantes ainda não lidos. Isso é um estado válido.
- O processamento precisa ser idempotente, porque o usuário pode pedir de novo.
- A Sprint 02 pode ser entregue e usada sem a Sprint 03.
- Operações de limpeza não fazem parte do caminho de erro da IA.

## Alternativas recusadas

- Chamar o modelo no mesmo passo do upload e só salvar se a leitura funcionar.
- Manter o arquivo apenas na memória do navegador até a extração terminar.
- Substituir o original pelo JSON interpretado.
