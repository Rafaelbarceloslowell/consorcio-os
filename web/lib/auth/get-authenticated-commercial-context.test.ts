import {
  ConsultantRole,
} from "@/lib/generated/prisma/client"

import {
  CommercialContextError,
  commercialContextStatus,
  validateIdentityMapping,
} from "@/lib/auth/get-authenticated-commercial-context"

describe("authenticated commercial context", () => {
  const mapping = {
    id: "user-1",
    workspaceId: "workspace-1",
    consultantId: "consultant-1",
    consultant: {
      workspaceId: "workspace-1",
      role: ConsultantRole.CONSULTANT,
    },
  }

  it("deriva workspace e consultor do usuário autenticado", () => {
    expect(
      validateIdentityMapping(
        "user-1",
        mapping,
      ),
    ).toEqual({
      userId: "user-1",
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      role: ConsultantRole.CONSULTANT,
    })
  })

  it("rejeita sessão ausente", () => {
    expect(() =>
      validateIdentityMapping(
        null,
        null,
      ),
    ).toThrowError(
      new CommercialContextError(
        "UNAUTHENTICATED",
        "Entre novamente para acessar o Gorila OS.",
      ),
    )
  })

  it("rejeita vínculo entre workspaces incompatíveis", () => {
    expect(() =>
      validateIdentityMapping(
        "user-1",
        {
          ...mapping,
          consultant: {
            ...mapping.consultant,
            workspaceId: "workspace-2",
          },
        },
      ),
    ).toThrowError(/workspace e consultor válidos/)
  })

  it("traduz falhas de contexto para status HTTP seguros", () => {
    expect(
      commercialContextStatus(
        new CommercialContextError(
          "UNAUTHENTICATED",
          "unauthenticated",
        ),
      ),
    ).toBe(401)
    expect(
      commercialContextStatus(
        new CommercialContextError(
          "INVALID_IDENTITY",
          "invalid",
        ),
      ),
    ).toBe(403)
    expect(
      commercialContextStatus(
        new Error("other"),
      ),
    ).toBeNull()
  })
})
