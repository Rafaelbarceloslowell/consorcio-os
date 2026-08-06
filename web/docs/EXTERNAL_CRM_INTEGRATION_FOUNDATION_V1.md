# External CRM Integration Foundation V1

## Objetivo

Preparar o GorillaOS para consumir dados de qualquer CRM sem colocar regras específicas do Maestro dentro do núcleo do produto.

Nesta versão:

- não existe acesso ao Maestro real;
- não existe credencial externa;
- não existe escrita em CRM externo;
- não existe nova cadência;
- não existe alteração no motor comercial atual;
- não existe migration;
- não existe mudança de interface.

## Arquitetura

```text
CRM externo
    ↓
Conector do provedor
    ↓
Contratos universais do GorillaOS
    ↓
Memória e inteligência do R2
```

O R2 consome contratos universais. Ele não conhece tabelas, RPCs, migrations ou nomes internos do Maestro.

## Modos

### `STANDALONE`

O GorillaOS funciona sem CRM externo selecionado.

### `INTEGRATED`

O GorillaOS utiliza um conector externo registrado. A V1 permite apenas leitura.

## Variáveis previstas

```text
GORILLAOS_CRM_MODE=STANDALONE|INTEGRATED
GORILLAOS_EXTERNAL_CRM_ENABLED=true|false
GORILLAOS_EXTERNAL_CRM_PROVIDER=MOCK_MAESTRO
GORILLAOS_EXTERNAL_CRM_READ_ONLY=true
```

Essas variáveis ainda não são conectadas à inicialização global da aplicação. A V1 entrega o resolvedor validado e testado para a próxima etapa de composição.

## Propriedade dos dados na Seal’s

| Informação | Dono oficial |
|---|---|
| Lead e responsável | Maestro |
| Check e ações | Maestro |
| Funil e resultado oficial | Maestro |
| Conteúdo da conversa | GorillaOS |
| Memória comercial | GorillaOS |
| Intenção do cliente | GorillaOS |
| Sugestão do R2 | GorillaOS |
| Aprendizado comercial | GorillaOS |
| Próxima ação sincronizada | Compartilhada por contrato |

Todos os registros externos carregam `trace`, com:

- sistema de origem;
- identificador externo;
- código externo;
- versão do contrato;
- data de atualização da origem;
- data de sincronização;
- proprietário oficial do dado.

## Conector simulado do Maestro

`MockMaestroConnector` permite desenvolver sem API e sem credenciais.

Cenários disponíveis:

- `NEW_LEAD_CHECK_1`
- `NO_RESPONSE_CHECK_3`
- `OVERDUE_ACTIONS`
- `CADENCE_PAUSED_NEXT_ACTION`
- `MEETING_SCHEDULED`
- `CADENCE_COMPLETED`

O conector simulado expõe o Padrão A como dado recebido. Ele não executa, avança ou modifica a cadência.

O cenário de pausa por próximo passo não inventa o conteúdo da conversa. O texto do cliente continua sendo responsabilidade da memória do GorillaOS.

## Limites da V1

A fundação não implementa:

- cliente HTTP do Maestro;
- autenticação da API do Maestro;
- persistência de espelho externo;
- sincronização automática;
- webhooks;
- escrita de resultado;
- conclusão de ação;
- criação de reunião;
- dashboard integrado.

## Próxima etapa

Quando o contrato da API do Maestro estiver aprovado:

1. criar `MaestroHttpConnector`;
2. validar respostas externas;
3. traduzir o contrato Maestro para os tipos universais;
4. iniciar sincronização somente leitura;
5. ligar os dados ao briefing do R2;
6. liberar escrita apenas em uma fase posterior e auditada.
