# Definition of Done

Uma sprint só pode ser considerada DONE quando todos os itens abaixo forem verdadeiros. `Status: PLANNED` permanece até lá. Não existe estado intermediário silencioso: o arquivo da sprint muda para DONE no mesmo commit que apresenta as evidências, ou permanece PLANNED.

## Checklist global

1. O escopo escrito na sprint está implementado.
2. Os critérios de aceite da sprint foram atendidos.
3. Os testes obrigatórios da sprint estão passando.
4. Não há regressão crítica conhecida.
5. A segurança prevista na sprint foi revisada, incluindo RLS quando a sprint cria ou expõe tabela ou arquivo.
6. A documentação afetada está atualizada: modelo, regras, decisões, sprint e changelog.
7. As evidências exigidas pela sprint estão registradas no relatório da entrega.
8. Os riscos residuais estão escritos na sprint ou em `DECISIONS.md`.
9. A working tree da entrega é compreensível: o que entrou no commit é o que a sprint descreve.
10. Existe um commit identificável da entrega.
11. A validação humana exigida pela sprint foi feita e confirmada pelo diretor. Onde a sprint não exige validação humana, o item é atendido por essa ausência explícita. Interface que depende de navegador humano permanece `HUMAN_VALIDATION_REQUIRED` até essa confirmação. Sem ela, a sprint não fica totalmente validada em UI.

## Regras de aplicação

- Teste que não cobre o critério de aceite não substitui o critério.
- Documentação desatualizada impede DONE mesmo com código funcionando.
- Decisão em aberto que a sprint lista como bloqueio impede o início, não apenas o encerramento.
- Dívida técnica conscientemente adiada continua escrita na sprint depois do DONE. Encerrar a sprint não apaga a dívida.
- Funcionalidade de sprint futura dentro da entrega atual impede DONE, salvo justificativa técnica concreta registrada em `DECISIONS.md` antes da implementação.
- A revisão de segurança da sprint usa `SECURITY.md`. Policies copiadas de outra tabela sem examinar o acesso real não atendem o item 5.
- Browser/UI validation is human-controlled. Agents may run automated terminal/headless checks, but must not open or navigate a browser unless explicitly authorized. O agente não abre navegador, não usa automação visual com janela e não opera a interface em nome do diretor. Playwright, Cypress ou equivalente, quando a sprint autorizar, roda só em modo headless.

## Evidência mínima de encerramento

O relatório de encerramento aponta:

- identificador do commit;
- comandos de teste executados e o resultado;
- migrations ou políticas criadas, quando existirem;
- riscos que permanecem;
- decisões em aberto que continuam sem resposta.

## Status permitido nos arquivos de sprint

| Status | Significado |
| --- | --- |
| PLANNED | Contrato escrito. Implementação não encerrada. |
| DONE | Checklist global e critérios da sprint atendidos. |

Outros status não são usados. Trabalho em andamento continua PLANNED.
