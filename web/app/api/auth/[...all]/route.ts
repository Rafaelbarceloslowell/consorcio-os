import {
  toNextJsHandler,
} from "better-auth/next-js"

import {
  getAuthConfigurationState,
} from "@/lib/auth/auth-configuration"

import {
  getAuth,
} from "@/lib/auth/auth"

function unavailableResponse() {
  return Response.json(
    {
      error:
        "AUTH_NOT_CONFIGURED",
      message:
        "A autenticacao Google ainda aguarda configuracao.",
    },
    {
      status: 503,
    },
  )
}

function getHandlers() {
  const configuration =
    getAuthConfigurationState()

  if (!configuration.configured) {
    return null
  }

  return toNextJsHandler(
    getAuth().handler,
  )
}

export async function GET(
  request: Request,
) {
  const handlers =
    getHandlers()

  if (!handlers) {
    return unavailableResponse()
  }

  return handlers.GET(request)
}

export async function POST(
  request: Request,
) {
  const handlers =
    getHandlers()

  if (!handlers) {
    return unavailableResponse()
  }

  return handlers.POST(request)
}
