import {
  executeOpportunityCommand,
  getOpportunityExecutionView,
  type ExecutionCommand,
} from "@/application/execution/r2-execution-service"
import { getApiCommercialContext } from "@/lib/auth/get-authenticated-commercial-context"

type RouteContext = Readonly<{
  params: Promise<{ opportunityId: string }>
}>

export const dynamic = "force-dynamic"

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

async function contextAndId(context: RouteContext) {
  const authenticated = await getApiCommercialContext()
  if (authenticated instanceof Response) {
    return { ok: false, response: authenticated } as const
  }

  const opportunityId = (await context.params).opportunityId.trim()
  if (!opportunityId) {
    return { ok: false, response: json({ error: "opportunityId is required." }, 400) } as const
  }

  return { ok: true, authenticated, opportunityId } as const
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const resolved = await contextAndId(context)
  if (!resolved.ok) {
    return resolved.response
  }

  try {
    return json(await getOpportunityExecutionView({
      workspaceId: resolved.authenticated.workspaceId,
      opportunityId: resolved.opportunityId,
    }))
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Não foi possível carregar a execução comercial." }, 404)
  }
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const resolved = await contextAndId(context)
  if (!resolved.ok) {
    return resolved.response
  }

  let command: ExecutionCommand
  try {
    command = await request.json() as ExecutionCommand
  } catch {
    return json({ error: "O comando de execução é inválido." }, 400)
  }

  if (!command || typeof command !== "object" || !("type" in command)) {
    return json({ error: "O tipo do comando é obrigatório." }, 400)
  }

  try {
    return json(await executeOpportunityCommand({
      workspaceId: resolved.authenticated.workspaceId,
      opportunityId: resolved.opportunityId,
      consultantId: resolved.authenticated.consultantId,
      command,
    }))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível executar a ação comercial."
    const status = /já processada|outra requisição/i.test(message) ? 409 : 400
    return json({ error: message }, status)
  }
}
