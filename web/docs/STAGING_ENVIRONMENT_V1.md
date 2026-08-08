# GorillaOS — Staging Environment V1

Nenhum valor real deve ser versionado. Segredos ficam exclusivamente no cofre do provedor. `STAGING` e `PRODUCTION` usam bancos, URLs, OAuth e dados separados.

| Classe | Variável | Finalidade | LOCAL | STAGING | PRODUCTION |
| --- | --- | --- | --- | --- | --- |
| REQUIRED | `DATABASE_URL` | PostgreSQL do ambiente; TLS é definido pela URL emitida pelo provedor. | banco local | banco externo de staging | banco externo de produção |
| REQUIRED | `BETTER_AUTH_SECRET` | Assinatura criptográfica de sessão. | segredo local | segredo exclusivo | segredo exclusivo e diferente |
| REQUIRED | `BETTER_AUTH_URL` | URL base HTTPS usada pelo Better Auth e pelo callback OAuth. | `localhost` | host HTTPS de staging | domínio oficial HTTPS |
| REQUIRED | `GOOGLE_CLIENT_ID` | Identificador do cliente OAuth Web do ambiente. | cliente local | cliente de staging | cliente de produção |
| REQUIRED | `GOOGLE_CLIENT_SECRET` | Segredo do cliente OAuth Web. | segredo local | cofre de staging | cofre de produção |
| REQUIRED | `NEXT_PUBLIC_APP_URL` | Origem pública para metadata e links; não é segredo. | URL local | URL HTTPS de staging | domínio oficial |
| REQUIRED | `WORKSPACE_SLUG` | Workspace único servido pela instância. | workspace local | workspace de staging | workspace oficial |
| LOCAL_ONLY | `NODE_ENV` | Modo do Node/Next; a plataforma define `production` no deploy. | `development`/`test` | `production` | `production` |
| OPTIONAL | `STAGING_BOOTSTRAP_CONFIRM` | Guard pontual; deve ser `STAGING`. Não pertence ao runtime. | ausente | somente no bootstrap | proibida |
| OPTIONAL | `STAGING_CONSULTANT_EMAIL` | E-mail Google autorizado para criar o consultor QA. Não pertence ao runtime. | ausente | somente no bootstrap | proibida |
| FUTURE | `R2_APP_URL` | Ferramenta externa de validação R2, fora do runtime principal. | opcional | ausente | ausente |
| FUTURE | `R2_CDP_PORT` | Porta da ferramenta local R2. | opcional | ausente | ausente |
| FUTURE | `R2_GATE_DIR` | Diretório de artefatos da ferramenta local R2. | opcional | ausente | ausente |

Antes do deploy:

- `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` devem ser a mesma origem HTTPS de staging.
- `WORKSPACE_SLUG` deve corresponder ao workspace criado pelo bootstrap.
- `DATABASE_URL` deve apontar apenas para staging e não conter `localhost`.
- nenhum segredo pode usar prefixo `NEXT_PUBLIC_`.
