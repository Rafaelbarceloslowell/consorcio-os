# GorillaOS — Database Backup and Recovery V1

Enquanto o provedor não for selecionado:

```text
BACKUP_AVAILABLE=UNKNOWN
POINT_IN_TIME_RECOVERY=UNKNOWN
MANUAL_EXPORT_AVAILABLE=UNKNOWN
```

## Gate antes do primeiro E2E

Registrar: provedor, versão PostgreSQL, retenção, escopo do backup, PITR, região, responsável e horário do último teste. Staging só pode virar produção depois de backup e recuperação confirmados.

## Exportação manual não destrutiva

Quando `pg_dump` estiver disponível e a política do provedor permitir:

```powershell
pg_dump --format=custom --no-owner --no-privileges --file gorillaos-staging.dump $env:DATABASE_URL
```

Não imprimir a variável e não versionar o arquivo. Armazenar o dump criptografado e com acesso restrito.

## Verificação de recuperação

1. criar banco descartável e isolado;
2. restaurar nele, nunca sobre staging ativo;
3. executar `npx prisma migrate status` contra o banco descartável;
4. validar contagens estruturais e um registro QA sem expor dados;
5. remover o banco descartável pelo painel somente após aprovação humana.

Migrations aplicadas não são editadas nem “desfeitas”. Incidentes usam `forward fix`; restore só ocorre com backup identificado, janela de perda aceita e autorização explícita.
