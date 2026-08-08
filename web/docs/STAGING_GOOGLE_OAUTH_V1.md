# GorillaOS — Google OAuth em Staging V1

Estado atual: `BLOCKED_EXTERNAL_CONFIGURATION`, pois não há host público nem acesso autenticado ao Google Cloud Console nesta execução.

Quando o host estiver definido como `https://<STAGING_HOST>`, configurar no cliente OAuth do tipo **Web application**:

```text
Authorized JavaScript origin:
https://<STAGING_HOST>

Authorized redirect URI:
https://<STAGING_HOST>/api/auth/callback/google
```

O callback acima é o callback real padrão do Better Auth usado pelo projeto. Configurar também `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_URL` com a origem HTTPS exata, sem barra final adicional.

Procedimento:

1. criar ou selecionar credencial OAuth exclusiva de staging;
2. cadastrar origem e redirect URI exatos;
3. armazenar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no cofre do host;
4. executar o bootstrap com o e-mail da conta Google QA;
5. iniciar o login pela tela do GorillaOS e validar callback, sessão, consultor e workspace.

O bootstrap cria somente o consultor pré-autorizado. O registro `User` é criado pelo Better Auth no primeiro login Google bem-sucedido. E-mail ausente, inativo ou ambíguo continua bloqueado; não existe seleção automática de outro consultor.

Referência oficial: [Better Auth — Google](https://better-auth.com/docs/authentication/google).
