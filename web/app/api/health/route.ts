import {
  Prisma,
} from "@/lib/generated/prisma/client"

import {
  prisma,
} from "@/infrastructure/prisma/client"

const READINESS_TIMEOUT_MS = 3_000

function response(
  body: unknown,
  status = 200,
): Response {
  return Response.json(
    body,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )
}

async function checkDatabase(): Promise<void> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  try {
    await Promise.race([
      prisma.$queryRaw(
        Prisma.sql`SELECT 1`,
      ),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(
            new Error("readiness timeout"),
          ),
          READINESS_TIMEOUT_MS,
        )
      }),
    ])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
): Promise<Response> {
  const check =
    new URL(request.url)
      .searchParams
      .get("check") ?? "liveness"

  if (check === "liveness") {
    return response({
      status: "ok",
      check: "liveness",
    })
  }

  if (check !== "readiness") {
    return response(
      {
        status: "invalid_request",
        error:
          "check deve ser liveness ou readiness.",
      },
      400,
    )
  }

  try {
    await checkDatabase()

    return response({
      status: "ready",
      check: "readiness",
      database: "available",
    })
  } catch {
    return response(
      {
        status: "not_ready",
        check: "readiness",
        database: "unavailable",
      },
      503,
    )
  }
}
