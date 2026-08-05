import { APIError } from "better-auth/api"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

import {
  getAuthConfigurationState,
} from "@/lib/auth/auth-configuration"

import {
  prisma,
} from "@/infrastructure/prisma/client"

function readRequiredEnvironmentVariable(
  name:
    | "BETTER_AUTH_SECRET"
    | "BETTER_AUTH_URL"
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET",
): string {
  const value =
    process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `A variavel de ambiente ${name} nao esta configurada.`,
    )
  }

  return value
}

function createAuth() {
  return betterAuth({
    appName: "Gorila OS",
    baseURL:
      readRequiredEnvironmentVariable(
        "BETTER_AUTH_URL",
      ),
    secret:
      readRequiredEnvironmentVariable(
        "BETTER_AUTH_SECRET",
      ),
    database: prismaAdapter(
      prisma,
      {
        provider: "postgresql",
      },
    ),
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      google: {
        clientId:
          readRequiredEnvironmentVariable(
            "GOOGLE_CLIENT_ID",
          ),
        clientSecret:
          readRequiredEnvironmentVariable(
            "GOOGLE_CLIENT_SECRET",
          ),
      },
    },
    user: {
      additionalFields: {
        workspaceId: {
          type: "string",
          required: false,
          input: false,
        },
        consultantId: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const consultants =
              await prisma.consultant.findMany({
                where: {
                  email: {
                    equals: user.email,
                    mode: "insensitive",
                  },
                  status: "ACTIVE",
                  workspace: {
                    status: "ACTIVE",
                  },
                },
                select: {
                  id: true,
                  workspaceId: true,
                },
                take: 2,
              })

            if (consultants.length === 0) {
              throw new APIError(
                "FORBIDDEN",
                {
                  message:
                    "Seu e-mail ainda nao possui acesso autorizado ao Gorila OS.",
                },
              )
            }

            if (consultants.length > 1) {
              throw new APIError(
                "FORBIDDEN",
                {
                  message:
                    "Seu e-mail esta vinculado a mais de uma empresa. Solicite a regularizacao do acesso.",
                },
              )
            }

            const consultant =
              consultants[0]

            return {
              data: {
                ...user,
                workspaceId:
                  consultant.workspaceId,
                consultantId:
                  consultant.id,
              },
            }
          },
        },
      },
    },
  })
}

type AuthInstance =
  ReturnType<typeof createAuth>

let authInstance:
  | AuthInstance
  | null = null

export function getAuth(): AuthInstance {
  if (authInstance !== null) {
    return authInstance
  }

  const configuration =
    getAuthConfigurationState()

  if (!configuration.configured) {
    throw new Error(
      `A autenticacao Google ainda nao esta configurada. Variaveis ausentes: ${configuration.missing.join(", ")}.`,
    )
  }

  const nextAuth =
    createAuth()

  authInstance =
    nextAuth

  return nextAuth
}
