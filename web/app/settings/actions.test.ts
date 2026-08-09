import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  findWorkspace: vi.fn(),
  updateWorkspace: vi.fn(),
  updateConsultant: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock(
  "@/infrastructure/prisma/client",
  () => ({
    prisma: {
      workspace: {
        findFirst:
          mocks.findWorkspace,
        updateMany:
          mocks.updateWorkspace,
      },
      consultant: {
        updateMany:
          mocks.updateConsultant,
      },
    },
  }),
)

vi.mock(
  "next/cache",
  () => ({
    revalidatePath:
      mocks.revalidatePath,
  }),
)

import {
  updateConsultantGoalsAction,
  updateConsultantProfileAction,
  updateWorkspaceSettingsAction,
} from "./actions"

function data(
  values:
    Record<string, string>,
): FormData {
  const formData =
    new FormData()

  for (
    const [name, value]
    of Object.entries(values)
  ) {
    formData.set(
      name,
      value,
    )
  }

  return formData
}

describe(
  "settings actions",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      mocks.findWorkspace
        .mockResolvedValue({
          id: "workspace-1",
        })
      mocks.updateWorkspace
        .mockResolvedValue({
          count: 1,
        })
      mocks.updateConsultant
        .mockResolvedValue({
          count: 1,
        })
    })

    it(
      "atualiza somente o workspace autorizado",
      async () => {
        await updateWorkspaceSettingsAction(
          data({
            workspaceId:
              "workspace-1",
            name:
              "Seal’s Consultoria",
          }),
        )

        expect(
          mocks.updateWorkspace,
        ).toHaveBeenCalledWith({
          where: {
            id: "workspace-1",
            slug:
              "consorcio-os",
          },
          data: {
            name:
              "Seal’s Consultoria",
          },
        })
      },
    )

    it(
      "atualiza perfil e preserva campos opcionais vazios",
      async () => {
        await updateConsultantProfileAction(
          data({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            name:
              "Rafael Ramos Barcelos",
            email:
              "rafaelbconsorcio@gmail.com",
            phone: "",
            team: "",
            region: "",
          }),
        )

        expect(
          mocks.updateConsultant,
        ).toHaveBeenCalledWith({
          where: {
            id: "consultant-1",
            workspaceId:
              "workspace-1",
          },
          data: {
            name:
              "Rafael Ramos Barcelos",
            email:
              "rafaelbconsorcio@gmail.com",
            phone: "",
            team: "",
            region: "",
          },
        })
      },
    )

    it(
      "rejeita e-mail inválido",
      async () => {
        await expect(
          updateConsultantProfileAction(
            data({
              workspaceId:
                "workspace-1",
              consultantId:
                "consultant-1",
              name:
                "Rafael Ramos Barcelos",
              email:
                "rafael-invalido",
              phone:
                "+5541999999999",
              team: "",
              region: "Paraná",
            }),
          ),
        ).rejects.toThrow(
          "O e-mail é inválido.",
        )

        expect(
          mocks.updateConsultant,
        ).not.toHaveBeenCalled()
      },
    )

    it(
      "mantém a meta pessoal de leads em zero quando depende da distribuição",
      async () => {
        await updateConsultantGoalsAction(
          data({
            workspaceId:
              "workspace-1",
            consultantId:
              "consultant-1",
            monthlySalesTarget:
              "10.000.000,00",
            monthlyLeadsTarget:
              "0",
          }),
        )

        expect(
          mocks.updateConsultant,
        ).toHaveBeenCalledWith({
          where: {
            id: "consultant-1",
            workspaceId:
              "workspace-1",
          },
          data: {
            monthlySalesTarget:
              "10000000.00",
            monthlyLeadsTarget:
              0,
          },
        })
      },
    )

    it(
      "bloqueia workspace não autorizado",
      async () => {
        mocks.findWorkspace
          .mockResolvedValue(null)

        await expect(
          updateWorkspaceSettingsAction(
            data({
              workspaceId:
                "workspace-2",
              name: "Empresa",
            }),
          ),
        ).rejects.toThrow(
          "Workspace não autorizado.",
        )

        expect(
          mocks.updateWorkspace,
        ).not.toHaveBeenCalled()
      },
    )
  },
)
