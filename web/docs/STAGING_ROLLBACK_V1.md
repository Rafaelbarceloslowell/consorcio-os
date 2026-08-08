# GorillaOS — Staging Rollback V1

Inventário desta missão:

```text
SOURCE_BASELINE=dd8dca5
CURRENT_DEPLOYMENT=NOT_CONFIGURED
PREVIOUS_DEPLOYMENT=NOT_CONFIGURED
STAGING_PROVIDER=NOT_CONFIGURED
```

Antes de cada deploy, registrar commit, deployment ID, URL, data e deployment anterior. O rollback deve usar restore/redeploy do provedor para o artefato anterior conhecido, sem merge em `main`.

1. impedir novas mutações se a versão estiver corrompendo dados;
2. selecionar o deployment anterior aprovado no ambiente **staging**;
3. restaurar/redeployar somente a aplicação;
4. validar `/api/health`, readiness, login e o registro QA persistente;
5. registrar motivo e deployment resultante.

Não executar rollback automático de migration Prisma. Se o schema causou a falha, preferir migration corretiva compatível. Restore do banco exige avaliação de perda e autorização separada.
