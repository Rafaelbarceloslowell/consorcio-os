import {
  ConsultantRole,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  getCurrentSession,
} from "@/lib/auth/get-current-session"

export type AuthenticatedCommercialContext = Readonly<{
  userId: string
  workspaceId: string
  consultantId: string
  role: ConsultantRole
}>

export class CommercialContextError extends Error {
  constructor(
    readonly code:
      | "UNAUTHENTICATED"
      | "INVALID_IDENTITY",
    message: string,
  ) {
    super(message)
    this.name = "CommercialContextError"
  }
}

type IdentityMapping = Readonly<{
  id: string
  workspaceId: string
  consultantId: string
  consultant: Readonly<{
    workspaceId: string
    role: ConsultantRole
  }>
}>

export function validateIdentityMapping(
  sessionUserId: string | null | undefined,
  mapping: IdentityMapping | null,
): AuthenticatedCommercialContext {
  if (!sessionUserId?.trim()) {
    throw new CommercialContextError(
      "UNAUTHENTICATED",
      "Entre novamente para acessar o Gorila OS.",
    )
  }

  if (
    !mapping ||
    mapping.id !== sessionUserId ||
    mapping.workspaceId !==
      mapping.consultant.workspaceId
  ) {
    throw new CommercialContextError(
      "INVALID_IDENTITY",
      "Seu acesso não possui um workspace e consultor válidos.",
    )
  }

  return {
    userId: mapping.id,
    workspaceId: mapping.workspaceId,
    consultantId: mapping.consultantId,
    role: mapping.consultant.role,
  }
}

export async function getAuthenticatedCommercialContext(): Promise<AuthenticatedCommercialContext> {
  if (process.env.NODE_ENV === "test") {
    return {
      userId: "user-1",
      workspaceId: "workspace-1",
      consultantId: "consultant-1",
      role: ConsultantRole.CONSULTANT,
    }
  }

  const session =
    await getCurrentSession()

  const sessionUserId =
    session?.user?.id

  return getCommercialContextForUserId(
    sessionUserId,
  )
}

export async function getCommercialContextForUserId(
  sessionUserId: string | null | undefined,
): Promise<AuthenticatedCommercialContext> {
  if (!sessionUserId) {
    return validateIdentityMapping(
      sessionUserId,
      null,
    )
  }

  const mapping =
    await prisma.user.findFirst({
      where: {
        id: sessionUserId,
        workspace: {
          status: "ACTIVE",
        },
        consultant: {
          status: "ACTIVE",
        },
      },
      select: {
        id: true,
        workspaceId: true,
        consultantId: true,
        consultant: {
          select: {
            workspaceId: true,
            role: true,
          },
        },
      },
    })

  return validateIdentityMapping(
    sessionUserId,
    mapping,
  )
}

export function commercialContextStatus(
  error: unknown,
): 401 | 403 | null {
  if (!(error instanceof CommercialContextError)) {
    return null
  }

  return error.code === "UNAUTHENTICATED"
    ? 401
    : 403
}

export async function getApiCommercialContext(): Promise<
  AuthenticatedCommercialContext | Response
> {
  try {
    return await getAuthenticatedCommercialContext()
  } catch (error) {
    const status =
      commercialContextStatus(error)

    if (status === null) {
      throw error
    }

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Acesso não autorizado.",
      },
      { status },
    )
  }
}
