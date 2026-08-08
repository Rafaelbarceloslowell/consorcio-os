# GorillaOS — Environment Matrix V1

| Item | LOCAL | STAGING | PRODUCTION |
| --- | --- | --- | --- |
| Objetivo | desenvolvimento e testes | validação online com dados QA | operação oficial |
| URL | `localhost` | URL HTTPS do provedor | domínio oficial HTTPS |
| PostgreSQL | instância local | banco gerenciado isolado | banco gerenciado isolado |
| Dados | locais/fictícios | somente `STAGING TESTE`, `QA`, `E2E` | dados reais autorizados |
| Google OAuth | callback local | cliente e callback de staging | cliente e callback oficiais |
| Workspace | local | slug explícito de staging | slug oficial |
| Secrets | `.env.local`, não versionado | cofre do provedor | cofre separado |
| Migrations | fluxo local | `migrate deploy` | `migrate deploy` com janela aprovada |
| Bootstrap | seed/desenvolvimento | `npm run staging:bootstrap` | proibido |
| Logs | console local | logs do host sem dados sensíveis | retenção e acesso formalizados |
| WhatsApp | manual | manual; provider futuro ausente | somente Cloud API oficial futura |

Nenhum dado ou credencial é promovido entre ambientes. A promoção transfere um commit aprovado e uma configuração revisada, não o banco de staging.
