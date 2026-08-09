import { getR2DailyMission } from "@/application/execution/r2-daily-mission"
import { getApiCommercialContext } from "@/lib/auth/get-authenticated-commercial-context"

export const dynamic = "force-dynamic"

export async function GET(): Promise<Response> {
  const authenticated = await getApiCommercialContext()
  if (authenticated instanceof Response) {
    return authenticated
  }

  return Response.json(
    await getR2DailyMission({
      workspaceId: authenticated.workspaceId,
      consultantId: authenticated.consultantId,
    }),
    { headers: { "Cache-Control": "no-store" } },
  )
}
