import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import type {
    CreateClientInput,
  } from "./create-client"
  
  import {
    mockClients,
  } from "@/data/mock-crm"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    CreateClient,
  } from "./create-client"
  
  function createValidInput(): CreateClientInput {
    return {
      type: "individual",
      name: "  Rafael Barcelos  ",
      email:
        "  RAFAEL.NOVO@EXAMPLE.COM  ",
      phone:
        "(41) 99999-8877",
      document:
        "529.982.247-25",
      birthDate:
        "1996-01-10",
      consultantId:
        mockClients[0]
          .consultantId,
      address: {
        street:
          "  Rua das Flores  ",
        number: "  100  ",
        complement:
          "  Apartamento 10  ",
        neighborhood:
          "  Centro  ",
        city:
          "  Curitiba  ",
        state: "  pr  ",
        zipCode:
          "80000-000",
      },
      tags: [
        "  Alto potencial  ",
        "Investidor",
        "alto potencial",
        "  ",
      ],
      notes:
        "  Cliente cadastrado diretamente no CRM.  ",
    }
  }
  
  describe(
    "CreateClient",
    () => {
      it(
        "deve criar um cliente brasileiro ativo no padrão internacional",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
              {
                now:
                  new Date(
                    "2026-07-23T14:00:00.000Z",
                  ),
                generateId:
                  () =>
                    "client-new",
              },
            )
  
          const result =
            createClient.execute(
              createValidInput(),
            )
  
          expect(
            result.client,
          ).toEqual({
            id: "client-new",
            type: "individual",
            name:
              "Rafael Barcelos",
            email:
              "rafael.novo@example.com",
            phone:
              "+5541999998877",
            document:
              "529.982.247-25",
            birthDate:
              "1996-01-10",
            companyName:
              undefined,
            tradeName:
              undefined,
            stateRegistration:
              undefined,
            address: {
              street:
                "Rua das Flores",
              number: "100",
              complement:
                "Apartamento 10",
              neighborhood:
                "Centro",
              city:
                "Curitiba",
              state: "PR",
              zipCode:
                "80000-000",
            },
            consultantId:
              mockClients[0]
                .consultantId,
            leadId: undefined,
            status: "active",
            tags: [
              "Alto potencial",
              "Investidor",
            ],
            notes:
              "Cliente cadastrado diretamente no CRM.",
            createdAt:
              "2026-07-23T14:00:00.000Z",
            updatedAt:
              "2026-07-23T14:00:00.000Z",
          })
  
          expect(
            crmRepository
              .getClientById(
                "client-new",
              ),
          ).toEqual(
            result.client,
          )
        },
      )
  
      it(
        "deve criar um cliente internacional quando o telefone possui sinal de mais",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
              {
                generateId:
                  () =>
                    "client-usa",
              },
            )
  
          const result =
            createClient.execute({
              ...createValidInput(),
              email:
                "cliente.usa@example.com",
              phone:
                "+1 (305) 555-1234",
              document:
                "987.654.321-00",
            })
  
          expect(
            result.client.phone,
          ).toBe(
            "+13055551234",
          )
        },
      )
  
      it(
        "deve criar um cliente internacional usando o código do país separado",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
              {
                generateId:
                  () =>
                    "client-portugal",
              },
            )
  
          const result =
            createClient.execute({
              ...createValidInput(),
              email:
                "cliente.portugal@example.com",
              phone:
                "912 345 678",
              phoneCountryCode:
                "351",
              document:
                "987.654.321-00",
            })
  
          expect(
            result.client.phone,
          ).toBe(
            "+351912345678",
          )
        },
      )
  
      it(
        "deve criar um cliente do tipo empresa",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
              {
                generateId:
                  () =>
                    "client-company",
              },
            )
  
          const result =
            createClient.execute({
              ...createValidInput(),
              type: "company",
              name:
                "Contato da empresa",
              document:
                "11.222.333/0001-81",
              companyName:
                "  ConsórcioOS Tecnologia Ltda  ",
              tradeName:
                "  ConsórcioOS  ",
              stateRegistration:
                "  123456789  ",
            })
  
          expect(
            result.client.type,
          ).toBe(
            "company",
          )
  
          expect(
            result.client.name,
          ).toBe(
            "ConsórcioOS Tecnologia Ltda",
          )
  
          expect(
            result.client.companyName,
          ).toBe(
            "ConsórcioOS Tecnologia Ltda",
          )
  
          expect(
            result.client.tradeName,
          ).toBe(
            "ConsórcioOS",
          )
        },
      )
  
      it(
        "deve rejeitar um nome vazio",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                name: "   ",
              }),
          ).toThrow(
            "O nome do cliente é obrigatório.",
          )
        },
      )
  
      it(
        "deve rejeitar um e-mail inválido",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                email:
                  "email-invalido",
              }),
          ).toThrow(
            "O e-mail informado é inválido.",
          )
        },
      )
  
      it(
        "deve rejeitar um telefone internacional curto demais",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                phone: "+1 123",
              }),
          ).toThrow(
            "O telefone internacional do cliente deve possuir entre 8 e 15 dígitos, incluindo o código do país.",
          )
        },
      )
  
      it(
        "deve rejeitar um telefone internacional longo demais",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                phone:
                  "+1234567890123456",
              }),
          ).toThrow(
            "O telefone internacional do cliente deve possuir entre 8 e 15 dígitos, incluindo o código do país.",
          )
        },
      )
  
      it(
        "deve rejeitar um código de país inválido",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                phone:
                  "912345678",
                phoneCountryCode:
                  "1234",
              }),
          ).toThrow(
            "O código do país do telefone deve possuir entre 1 e 3 dígitos.",
          )
        },
      )
  
      it(
        "deve rejeitar um CPF com quantidade inválida de dígitos",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                document:
                  "123.456.789",
              }),
          ).toThrow(
            "O CPF do cliente deve possuir 11 dígitos.",
          )
        },
      )
  
      it(
        "deve rejeitar um CNPJ com quantidade inválida de dígitos",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                type: "company",
                companyName:
                  "Empresa Teste",
                document:
                  "12.345.678/0001",
              }),
          ).toThrow(
            "O CNPJ do cliente deve possuir 14 dígitos.",
          )
        },
      )
  
      it(
        "deve exigir razão social para clientes do tipo empresa",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                type: "company",
                document:
                  "11.222.333/0001-81",
                companyName: "   ",
              }),
          ).toThrow(
            "A razão social é obrigatória para clientes do tipo empresa.",
          )
        },
      )
  
      it(
        "deve rejeitar um consultor inexistente",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                consultantId:
                  "consultant-inexistente",
              }),
          ).toThrow(
            'Consultor não encontrado para o ID "consultant-inexistente".',
          )
        },
      )
  
      it(
        "deve rejeitar um e-mail duplicado ignorando maiúsculas e espaços",
        () => {
          const existingClient =
            mockClients[0]
  
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                email:
                  `  ${existingClient.email.toUpperCase()}  `,
              }),
          ).toThrow(
            `Já existe um cliente cadastrado com o e-mail "${existingClient.email
              .trim()
              .toLowerCase()}".`,
          )
        },
      )
  
      it(
        "deve rejeitar um telefone brasileiro duplicado ignorando formatação",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          crmRepository.createClient({
            ...mockClients[0],
            id:
              "client-phone-test",
            name:
              "Cliente Telefone Teste",
            email:
              "telefone.teste@example.com",
            phone:
              "(41) 99999-8877",
            document:
              "111.222.333-44",
          })
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                email:
                  "outro.email@example.com",
                phone:
                  "+55 41 99999-8877",
                document:
                  "987.654.321-00",
              }),
          ).toThrow(
            "Já existe um cliente cadastrado com o telefone informado.",
          )
        },
      )
  
      it(
        "deve rejeitar um telefone internacional duplicado ignorando formatação",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          crmRepository.createClient({
            ...mockClients[0],
            id:
              "client-international-phone-test",
            name:
              "Cliente Internacional",
            email:
              "internacional.existente@example.com",
            phone:
              "+1 (305) 555-1234",
            document:
              "222.333.444-55",
          })
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                email:
                  "internacional.novo@example.com",
                phone:
                  "3055551234",
                phoneCountryCode:
                  "1",
                document:
                  "987.654.321-00",
              }),
          ).toThrow(
            "Já existe um cliente cadastrado com o telefone informado.",
          )
        },
      )
  
      it(
        "deve rejeitar um documento duplicado ignorando formatação",
        () => {
          const existingClient =
            mockClients[0]
  
          const normalizedDocument =
            existingClient.document
              .replace(
                /\D/g,
                "",
              )
  
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                type:
                  normalizedDocument
                    .length === 14
                    ? "company"
                    : "individual",
                name:
                  "Cliente duplicado",
                companyName:
                  normalizedDocument
                    .length === 14
                    ? "Empresa duplicada"
                    : undefined,
                document:
                  normalizedDocument,
              }),
          ).toThrow(
            "Já existe um cliente cadastrado com o documento informado.",
          )
        },
      )
  
      it(
        "deve rejeitar um endereço sem rua",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          const input =
            createValidInput()
  
          expect(
            () =>
              createClient.execute({
                ...input,
                address: {
                  ...input.address,
                  street: "   ",
                },
              }),
          ).toThrow(
            "A rua do cliente é obrigatória.",
          )
        },
      )
  
      it(
        "deve rejeitar uma sigla de estado inválida",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          const input =
            createValidInput()
  
          expect(
            () =>
              createClient.execute({
                ...input,
                address: {
                  ...input.address,
                  state: "Paraná",
                },
              }),
          ).toThrow(
            "O estado do cliente deve ser informado com uma sigla de duas letras.",
          )
        },
      )
  
      it(
        "deve rejeitar um CEP inválido",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          const input =
            createValidInput()
  
          expect(
            () =>
              createClient.execute({
                ...input,
                address: {
                  ...input.address,
                  zipCode: "123",
                },
              }),
          ).toThrow(
            "O CEP do cliente deve possuir 8 dígitos.",
          )
        },
      )
  
      it(
        "deve rejeitar uma data de nascimento inválida",
        () => {
          const crmRepository =
            new MockCrmRepository()
  
          const createClient =
            new CreateClient(
              crmRepository,
            )
  
          expect(
            () =>
              createClient.execute({
                ...createValidInput(),
                birthDate:
                  "data-invalida",
              }),
          ).toThrow(
            "A data de nascimento do cliente é inválida.",
          )
        },
      )
    },
  )