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
  GorilaR2PendingAction,
} from "@/types/dashboard"

import {
  R2PendingActionControls,
} from "./r2-pending-action-controls"

const refresh = vi.fn()

vi.mock(
  "next/navigation",
  () => ({
    useRouter: () => ({
      refresh,
    }),
  }),
)

const action: GorilaR2PendingAction = {
  actionId: "action-1",
  journeyId: "journey-1",
  journeyTitle: "Oportunidade Rosecleia",
  opportunityHref:
    "/opportunities/journey-1",
  actionType: "SEND_MESSAGE",
  status: "PENDING",
  title: "Retomar contato com Rosecleia",
  description:
    "Entre em contato e registre o resultado.",
  scheduledFor:
    "2026-08-04T00:34:35.923Z",
}

describe(
  "R2PendingActionControls",
  () => {
    beforeEach(() => {
      vi.clearAllMocks()
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          new Response(
            JSON.stringify({
              message:
                "Contato registrado e ação concluída.",
              followUpTaskId: null,
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
      "mantém a oportunidade disponível e exige o registro do resultado",
      () => {
        render(
          <R2PendingActionControls
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

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar resultado",
          }),
        )

        expect(
          screen.getByRole("dialog", {
            name: "Como foi o contato?",
          }),
        ).toBeInTheDocument()

        expect(
          screen.getByRole("button", {
            name: "Registrar e concluir",
          }),
        ).toBeInTheDocument()
      },
    )

    it(
      "registra o contato e conclui a ação",
      async () => {
        render(
          <R2PendingActionControls
            workspaceId="workspace-1"
            consultantId="consultant-1"
            action={action}
          />,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar resultado",
          }),
        )

        fireEvent.change(
          screen.getByLabelText(
            "Resultado do contato",
          ),
          {
            target: {
              value: "INTERESTED",
            },
          },
        )

        fireEvent.change(
          screen.getByPlaceholderText(
            /cliente pediu simulação/i,
          ),
          {
            target: {
              value:
                "Cliente pediu uma nova simulação.",
            },
          },
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar e concluir",
          }),
        )

        await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith(
            "/api/r2/actions/action-1/complete",
            expect.objectContaining({
              method: "POST",
              body: JSON.stringify({
                workspaceId: "workspace-1",
                consultantId:
                  "consultant-1",
                contactMade: true,
                outcome: "INTERESTED",
                notes:
                  "Cliente pediu uma nova simulação.",
                nextFollowUpAt: null,
              }),
            }),
          )
        })

        await waitFor(() => {
          expect(refresh).toHaveBeenCalledTimes(1)
        })
      },
    )

    it(
      "exige uma data para acompanhamento",
      () => {
        render(
          <R2PendingActionControls
            workspaceId="workspace-1"
            consultantId="consultant-1"
            action={action}
          />,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar resultado",
          }),
        )

        fireEvent.change(
          screen.getByLabelText(
            "Resultado do contato",
          ),
          {
            target: {
              value: "FOLLOW_UP",
            },
          },
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar e concluir",
          }),
        )

        expect(
          screen.getByText(
            "Informe a data do próximo retorno.",
          ),
        ).toBeInTheDocument()

        expect(fetch).not.toHaveBeenCalled()
        expect(refresh).not.toHaveBeenCalled()
      },
    )

    it(
      "registra não respondeu sem exigir horário manual",
      async () => {
        render(
          <R2PendingActionControls
            workspaceId="workspace-1"
            consultantId="consultant-1"
            action={action}
          />,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar resultado",
          }),
        )

        fireEvent.change(
          screen.getByLabelText(
            "Resultado do contato",
          ),
          {
            target: {
              value: "NO_ANSWER",
            },
          },
        )

        expect(
          screen.getByTestId(
            "automatic-no-answer-call",
          ),
        ).toHaveTextContent(
          "Ligação automática em 5 minutos",
        )

        expect(
          screen.queryByLabelText(
            "Próximo retorno",
          ),
        ).not.toBeInTheDocument()

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar e concluir",
          }),
        )

        await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith(
            "/api/r2/actions/action-1/complete",
            expect.objectContaining({
              method: "POST",
              body: JSON.stringify({
                workspaceId: "workspace-1",
                consultantId:
                  "consultant-1",
                contactMade: false,
                outcome: "NO_ANSWER",
                notes: null,
                nextFollowUpAt: null,
              }),
            }),
          )
        })

        await waitFor(() => {
          expect(refresh).toHaveBeenCalledTimes(1)
        })
      },
    )

    it(
      "envia a data e permite a criação automática da próxima tarefa",
      async () => {
        render(
          <R2PendingActionControls
            workspaceId="workspace-1"
            consultantId="consultant-1"
            action={action}
          />,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar resultado",
          }),
        )

        fireEvent.change(
          screen.getByLabelText(
            "Resultado do contato",
          ),
          {
            target: {
              value: "FOLLOW_UP",
            },
          },
        )

        fireEvent.change(
          screen.getByLabelText(
            "Próximo retorno",
          ),
          {
            target: {
              value: "2026-08-05T10:30",
            },
          },
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar e concluir",
          }),
        )

        await waitFor(() => {
          const call =
            vi.mocked(fetch).mock.calls[0]

          expect(call?.[0]).toBe(
            "/api/r2/actions/action-1/complete",
          )

          const requestInit =
            call?.[1] as RequestInit

          const body =
            JSON.parse(
              String(
                requestInit.body,
              ),
            )

          expect(body).toMatchObject({
            workspaceId: "workspace-1",
            consultantId:
              "consultant-1",
            contactMade: true,
            outcome: "FOLLOW_UP",
            notes: null,
          })

          expect(
            typeof body.nextFollowUpAt,
          ).toBe("string")
        })
      },
    )

    it(
      "mantém o formulário aberto quando o registro falha",
      async () => {
        vi.stubGlobal(
          "fetch",
          vi.fn(async () =>
            new Response(
              JSON.stringify({
                error:
                  "Não foi possível registrar o resultado.",
              }),
              {
                status: 500,
                headers: {
                  "Content-Type":
                    "application/json",
                },
              },
            ),
          ),
        )

        render(
          <R2PendingActionControls
            workspaceId="workspace-1"
            consultantId="consultant-1"
            action={action}
          />,
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar resultado",
          }),
        )

        fireEvent.click(
          screen.getByRole("button", {
            name: "Registrar e concluir",
          }),
        )

        expect(
          await screen.findByText(
            "Não foi possível registrar o resultado.",
          ),
        ).toBeInTheDocument()

        expect(
          screen.getByRole("dialog", {
            name: "Como foi o contato?",
          }),
        ).toBeInTheDocument()

        expect(refresh).not.toHaveBeenCalled()
      },
    )
  },
)
