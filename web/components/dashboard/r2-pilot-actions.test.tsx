// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import type {
  GorilaR2PilotAction,
} from "@/types/dashboard"

import {
  R2PilotActions,
} from "./r2-pilot-actions"

const refresh = vi.fn()

vi.mock(
  "next/navigation",
  () => ({
    useRouter: () => ({
      refresh,
    }),
  }),
)

const action: GorilaR2PilotAction = {
  recommendationId: "recommendation-1",
  journeyId: "journey-1",
  journeyTitle: "Oportunidade Marina",
  opportunityHref:
    "/opportunities/journey-1",
  actionType: "SEND_MESSAGE",
  title: "Retomar contato",
  description: null,
  reason: "O cliente aguarda retorno.",
  priority: "HIGH",
  confidence: 0.92,
}

describe(
  "R2PilotActions",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          new Response(
            JSON.stringify({
              message:
                "Recomendação aceita e registrada.",
            }),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          ),
        ),
      )
    })

    it(
      "abre a oportunidade real",
      () => {
        render(
          <R2PilotActions
            workspaceId="workspace-1"
            consultantId="consultant-1"
            action={action}
          />,
        )

        expect(
          screen.getByRole("link", {
            name: "Abrir oportunidade",
          }),
        ).toHaveAttribute(
          "href",
          "/opportunities/journey-1",
        )
      },
    )

    it.each([
      [
        "Aceitar recomendação",
        "ACCEPT",
        undefined,
      ],
      [
        "Fazer amanhã",
        "POSTPONE",
        1440,
      ],
      [
        "Descartar",
        "REJECT",
        undefined,
      ],
    ] as const)(
      "registra a decisão %s e atualiza o dashboard",
      async (
        buttonName,
        decision,
        postponeMinutes,
      ) => {
        render(
          <R2PilotActions
            workspaceId="workspace-1"
            consultantId="consultant-1"
            action={action}
          />,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: buttonName,
          }),
        )

        await waitFor(() => {
          expect(fetch).toHaveBeenCalledTimes(1)
        })

        expect(fetch).toHaveBeenCalledWith(
          "/api/r2/recommendations/recommendation-1/decision",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
              workspaceId: "workspace-1",
              consultantId: "consultant-1",
              decision,
              postponeMinutes,
            }),
          }),
        )

        await waitFor(() => {
          expect(refresh).toHaveBeenCalledTimes(1)
        })
      },
    )

    it(
      "mostra erro sem esconder a recomendação",
      async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(async () =>
            new Response(
              JSON.stringify({
                error:
                  "A recomendação já foi decidida.",
              }),
              {
                status: 409,
                headers: {
                  "Content-Type":
                    "application/json",
                },
              },
            ),
          ),
        )

        render(
          <R2PilotActions
            workspaceId="workspace-1"
            consultantId="consultant-1"
            action={action}
          />,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Aceitar recomendação",
          }),
        )

        expect(
          await screen.findByText(
            "A recomendação já foi decidida.",
          ),
        ).toBeInTheDocument()

        expect(refresh).not.toHaveBeenCalled()
        expect(
          screen.getByRole("link", {
            name: "Abrir oportunidade",
          }),
        ).toBeInTheDocument()
      },
    )
  },
)
