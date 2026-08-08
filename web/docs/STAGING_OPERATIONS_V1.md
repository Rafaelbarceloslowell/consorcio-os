# GorillaOS — Staging Operations V1

## Estado e arquitetura recomendada

```text
TARGET=STAGING
URL=NOT_CONFIGURED
CURRENT_DEPLOY_PROVIDER=NOT_CONFIGURED
CURRENT_DB_PROVIDER=NOT_CONFIGURED
CUSTOM_DOMAIN=BLOCKED_EXTERNAL
```

Sem conta/provider existente, a seleção fica `BLOCKED_EXTERNAL_PROVIDER_SELECTION`. A opção gratuita recomendada para avaliação humana é **Render Free Web Service + Neon Free Postgres**: Next.js em servidor Node, HTTPS e logs no Render; PostgreSQL persistente, TLS e pooling no Neon. Esperar cold start do host gratuito.

Alternativas auditadas:

- Render Web + Render Free Postgres: compatível, mas o banco gratuito expira em 30 dias e não oferece backups; inadequado para staging durável.
- Vercel + Neon: compatível, porém o plano Hobby limita uso a fins pessoais/não comerciais; não deve ser adotado automaticamente para este projeto.

Referências: [Render Free](https://render.com/docs/free), [Render Web Services](https://render.com/docs/web-services), [Neon Pricing](https://neon.com/pricing), [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling) e [Vercel Hobby](https://vercel.com/docs/plans/hobby).

## Deploy

No host selecionado, configurar root `web`, runtime Node compatível, branch `feature/lead-approach-and-seals`, build `npm ci && npx prisma generate && npm run build` e start `npm run start`. Não promover para produção e não habilitar cobrança.

Antes do primeiro tráfego, configurar os nomes de `STAGING_ENVIRONMENT_V1.md` no cofre e executar contra o banco externo:

```powershell
npx prisma migrate status
npx prisma migrate deploy
$env:STAGING_BOOTSTRAP_CONFIRM = "STAGING"
$env:STAGING_CONSULTANT_EMAIL = "<CONTA_GOOGLE_QA>"
npm run staging:bootstrap
```

O bootstrap é transacional, idempotente, não apaga registros e cria workspace, consultor pré-autorizado, produto QA não ofertável, pipeline, fases e estados. Conflitos estruturais fazem a transação falhar.

## Health e readiness

```text
GET https://<STAGING_HOST>/api/health
GET https://<STAGING_HOST>/api/health?check=readiness
```

Liveness é público e não consulta banco. Readiness faz consulta segura e retorna `503` sem expor credenciais quando o banco está indisponível.

## OAuth, logs e segurança

- seguir `STAGING_GOOGLE_OAUTH_V1.md` e autorizar exatamente a conta QA;
- validar cookie seguro/SameSite no HTTPS real;
- conferir logs por timestamp, rota/contexto e tipo de erro;
- reprovar qualquer log com secret, token, URL completa do banco, documento ou conversa privada;
- APIs comerciais, Market Intelligence e R2 permanecem protegidos pelo proxy; `/api/health` é a exceção pública intencional;
- não configurar CORS `*`.

## Market Intelligence e E2E

Após login, validar `/api/market-intelligence`: payload, fonte, `observedAt`, `fetchedAt`, `stale` e fallback sem números inventados. Criar apenas `STAGING E2E - <timestamp>`, percorrer lead → R2 → follow-up → meeting → proposal → client → sale, repetir o fechamento para provar idempotência e confirmar persistência após redeploy/cold start.

## Rollback e backup

Usar `STAGING_ROLLBACK_V1.md` e `DATABASE_BACKUP_AND_RECOVERY_V1.md`. Nunca executar reset, force-reset, drop ou restore sobre banco ativo sem autorização.

## Ação humana pendente

Selecionar/criar contas gratuitas do host e banco, disponibilizar suas sessões/credenciais de staging, escolher a URL e cadastrar o callback Google. Só então migrations, bootstrap, deploy, login e E2E online podem ser executados.
