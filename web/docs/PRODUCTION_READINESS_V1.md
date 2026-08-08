# GorillaOS — Production Readiness V1

## Pré-requisitos

- Node.js compatível com o `package.json` e instalação reproduzível via `npm ci`.
- PostgreSQL externo acessível pela aplicação.
- domínio HTTPS definido para a aplicação e para o callback do Google OAuth.
- backup do banco e acesso ao log da plataforma antes de cada release.

## Variáveis

Use `.env.example` como inventário. Em produção são obrigatórias `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_APP_URL` e `WORKSPACE_SLUG`. Valores reais ficam apenas no cofre de secrets da plataforma.

## Migration, build e start

```powershell
npm ci
npx prisma migrate deploy
npm run build
npm run start
```

O build não consulta o PostgreSQL: páginas comerciais são renderizadas sob demanda. A conexão é obrigatória no start para servir dados e aprovar readiness.

## Health

- `GET /api/health`: liveness da aplicação, sem consulta ao banco.
- `GET /api/health?check=readiness`: readiness com consulta segura ao PostgreSQL; retorna `503` quando indisponível.

As respostas não incluem URL do banco, secrets, tokens ou stack traces.

## Banco

Configure `DATABASE_URL` para o PostgreSQL de produção, habilitando TLS conforme o provedor. Antes do tráfego, execute `npx prisma migrate status` e `npx prisma migrate deploy`. Nunca use `migrate reset` ou `db push --force-reset`.

## Google OAuth e domínio

Cadastre a origem HTTPS e o callback do Better Auth no projeto Google. `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` devem apontar para o domínio final. Autorize previamente o e-mail do usuário em um consultor ativo do workspace correto.

## WhatsApp futuro

O piloto permanece manual. Credenciais, webhook, templates, número e conta oficial da Meta não fazem parte deste release e só devem entrar por um provider oficial, sem alterar o núcleo do R2.

## Rollback básico

1. interromper entrada de tráfego na versão nova;
2. restaurar o artefato anterior, sem reverter migration aplicada manualmente;
3. validar liveness, readiness e login;
4. restaurar banco apenas a partir de backup aprovado e quando houver plano específico de dados.
