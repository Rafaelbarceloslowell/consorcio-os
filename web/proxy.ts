import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  prisma,
} from "@/infrastructure/prisma/client"

import {
  getAuth,
} from "@/lib/auth/auth"

import {
  getAuthConfigurationState,
} from "@/lib/auth/auth-configuration"

import {
  CommercialContextError,
  getCommercialContextForUserId,
} from "@/lib/auth/get-authenticated-commercial-context"

const publicPaths = new Set([
  "/acesso-negado",
  "/api/health",
  "/cadastro",
  "/login",
])

function redirectTo(
  request: NextRequest,
  path: string,
): NextResponse {
  return NextResponse.redirect(
    new URL(path, request.url),
  )
}

export async function proxy(
  request: NextRequest,
): Promise<NextResponse> {
  if (
    publicPaths.has(request.nextUrl.pathname) ||
    request.nextUrl.pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next()
  }

  if (!getAuthConfigurationState().configured) {
    return redirectTo(
      request,
      "/login",
    )
  }

  const session =
    await getAuth().api.getSession({
      headers: request.headers,
    })

  if (!session?.user?.id) {
    return redirectTo(
      request,
      "/login",
    )
  }

  try {
    const context =
      await getCommercialContextForUserId(
        session.user.id,
      )

    const pilotWorkspace =
      await prisma.workspace.findUnique({
        where: {
          slug:
            process.env.WORKSPACE_SLUG?.trim() ||
            "consorcio-os",
        },
        select: {
          id: true,
        },
      })

    if (
      !pilotWorkspace ||
      pilotWorkspace.id !== context.workspaceId
    ) {
      return redirectTo(
        request,
        "/acesso-negado",
      )
    }
  } catch (error) {
    if (error instanceof CommercialContextError) {
      return redirectTo(
        request,
        "/acesso-negado",
      )
    }

    throw error
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|opengraph-image).*)",
  ],
}
