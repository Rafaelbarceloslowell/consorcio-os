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
  OpportunitySuggestedQuestions,
} from "./opportunity-suggested-questions"

const questions = [
  {
    kind: "situation" as const,
    label: "Situação",
    question: "O que mudou no seu planejamento desde o último atendimento?",
  },
  {
    kind: "problem" as const,
    label: "Problema",
    question: "Qual é hoje o principal obstáculo para avançar?",
  },
  {
    kind: "implication" as const,
    label: "Implicação",
    question: "Qual impacto esse adiamento teria para você?",
  },
  {
    kind: "need_payoff" as const,
    label: "Próximo passo",
    question: "O que precisa acontecer para você avançar com segurança?",
  },
]

describe(
  "OpportunitySuggestedQuestions",
  () => {
    it(
      "renderiza quatro perguntas SPIN em uma região acessível",
      () => {
        render(
          <OpportunitySuggestedQuestions
            questions={questions}
          />,
        )

        const region = screen.getByRole(
          "region",
          {
            name: "Perguntas sugeridas pelo R2",
          },
        )

        expect(region).toBeInTheDocument()
        expect(
          within(region).getAllByRole("listitem"),
        ).toHaveLength(4)
        expect(
          within(region).getByText("Situação"),
        ).toBeInTheDocument()
        expect(
          within(region).getByText("Problema"),
        ).toBeInTheDocument()
        expect(
          within(region).getByText("Implicação"),
        ).toBeInTheDocument()
        expect(
          within(region).getByText("Próximo passo"),
        ).toBeInTheDocument()
      },
    )

    it(
      "orienta o consultor a fazer uma pergunta por vez",
      () => {
        render(
          <OpportunitySuggestedQuestions
            questions={questions}
          />,
        )

        expect(
          screen.getByText(
            /faça uma pergunta por vez/i,
          ),
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
      "não renderiza seção quando não há perguntas",
      () => {
        const { container } = render(
          <OpportunitySuggestedQuestions
            questions={[]}
          />,
        )

        expect(container).toBeEmptyDOMElement()
      },
    )
  },
)
