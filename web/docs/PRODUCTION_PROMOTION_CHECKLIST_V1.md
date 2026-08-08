# GorillaOS — Production Promotion Checklist V1

Produção não faz parte desta missão. Promover somente com todos os itens comprovados:

- [ ] staging E2E verde, incluindo venda idempotente
- [ ] Google Auth e sessão segura verdes
- [ ] PostgreSQL persistente e isolado
- [ ] backup, retenção e teste de recuperação confirmados
- [ ] migrations verdes e estratégia de `forward fix`
- [ ] liveness e readiness verdes
- [ ] logs seguros, acessíveis e com retenção definida
- [ ] HTTPS validado
- [ ] domínio oficial e DNS aprovados
- [ ] cliente OAuth de produção e callback oficial
- [ ] variáveis e secrets exclusivos de produção
- [ ] nenhum dado `STAGING TESTE`, `QA` ou `E2E`
- [ ] deployment anterior e rollback disponíveis
- [ ] Market Intelligence resiliente a indisponibilidade do BCB
- [ ] isolamento de workspace validado por IDs
- [ ] exposição de APIs e abuso básico revisados
- [ ] fronteira `MessagingProvider` preservada para WhatsApp Cloud API oficial futura
- [ ] aprovação humana explícita para produção
