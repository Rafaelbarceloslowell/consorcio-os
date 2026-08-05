// @vitest-environment jsdom

import {
  render,
  screen,
  within,
} from "@testing-library/react"
import {
  describe,
  expect,
  it,
} from "vitest"

import {
  OpportunityBriefing,
} from "./opportunity-briefing"

const briefing = {
  summary: "Janaina é um lead reativado de Data Crazy.",
  attentionPoint: "Situação atual registrada: pesquisando opções.",
  conversationFocus: "Entender prioridade, prazo e segurança para avançar.",
  recommendedNextStep: "Comece pela pergunta de Situação.",
}

describe(
  "OpportunityBriefing",
  () => {
    it(
      "renderiza quatro pontos em uma região acessível",
      () => {
        render(
          <OpportunityBriefing
            briefing={briefing}
          />,
        )

        const region = screen.getByRole(
          "region",
          {
            name: "Briefing da oportunidade",
          },
        )

        expect(region).toBeInTheDocument()
        expect(
          within(region).getByText("Resumo do caso"),
        ).toBeInTheDocument()
        expect(
          within(region).getByText("Ponto de atenção"),
        ).toBeInTheDocument()
        expect(
          within(region).getByText("Foco da conversa"),
        ).toBeInTheDocument()
        expect(
          within(region).getByText("Próximo movimento"),
        ).toBeInTheDocument()
      },
    )

    it(
      "exibe o conteúdo comercial recebido sem editar ou enviar",
      () => {
        render(
          <OpportunityBriefing
            briefing={briefing}
          />,
        )

        expect(
          screen.getByText(briefing.summary),
        ).toBeInTheDocument()
        expect(
          screen.getByText(briefing.recommendedNextStep),
        ).toBeInTheDocument()
        expect(
          screen.queryByRole("button"),
        ).not.toBeInTheDocument()
        expect(
          screen.queryByRole("textbox"),
        ).not.toBeInTheDocument()
      },
    )

    it(
      "identifica o briefing como preparação antes do contato",
      () => {
        render(
          <OpportunityBriefing
            briefing={briefing}
          />,
        )

        expect(
          screen.getByText("Antes do contato"),
        ).toBeInTheDocument()
      },
    )
  },
)
