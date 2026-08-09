import {
  executeR2NotificationAction,
  R2NotificationNotFoundError,
  type R2NotificationAction,
} from "@/application/execution/r2-notification-actions"
import { getApiCommercialContext } from "@/lib/auth/get-authenticated-commercial-context"

export const dynamic = "force-dynamic"

type RouteContext = Readonly<{ params: Promise<{ notificationId: string }> }>

function parseAction(value: unknown): R2NotificationAction | null {
  if (!value || typeof value !== "object") return null
  const body = value as Record<string, unknown>
  if (body.type === "READ") return { type: "READ" }
  if (body.type === "SNOOZE" && (body.minutes === 10 || body.minutes === 30)) {
    return { type: "SNOOZE", minutes: body.minutes }
  }
  if (body.type === "CLAIM" && Number.isInteger(body.deliveryVersion) && Number(body.deliveryVersion) > 0) {
    return { type: "CLAIM", deliveryVersion: Number(body.deliveryVersion) }
  }
  return null
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const authenticated = await getApiCommercialContext()
  if (authenticated instanceof Response) return authenticated

  const action = parseAction(await request.json().catch(() => null))
  if (!action) {
    return Response.json({ error: "Ação de notificação inválida." }, { status: 400 })
  }

  const { notificationId } = await context.params
  try {
    const result = await executeR2NotificationAction({
      workspaceId: authenticated.workspaceId,
      consultantId: authenticated.consultantId,
      notificationId,
      action,
    })
    return Response.json(result, { headers: { "Cache-Control": "no-store" } })
  } catch (cause) {
    if (cause instanceof R2NotificationNotFoundError) {
      return Response.json({ error: cause.message }, { status: 404 })
    }
    throw cause
  }
}
