// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react"

import {
  Activity,
} from "lucide-react"

import {
  describe,
  expect,
  it,
} from "vitest"

import {
  StatCard,
} from "./stat-card"

describe("StatCard", () => {
  it("deve renderizar o cartão como um artigo", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        description="Leads adicionados à operação"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByRole("article")
    ).toBeInTheDocument()
  })

  it("deve renderizar o título", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Novas oportunidades",
      })
    ).toBeInTheDocument()
  })

  it("deve renderizar a descrição quando informada", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        description="Leads adicionados à operação"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByText(
        "Leads adicionados à operação"
      )
    ).toBeInTheDocument()
  })

  it("não deve renderizar descrição quando ela não for informada", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.queryByText(
        "Leads adicionados à operação"
      )
    ).not.toBeInTheDocument()
  })

  it("deve renderizar o valor", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByText("12")
    ).toBeInTheDocument()
  })

  it("deve renderizar valores monetários", () => {
    render(
      <StatCard
        title="Produção no mês"
        value="R$ 1.850.000"
        icon={Activity}
      />
    )

    expect(
      screen.getByText(
        "R$ 1.850.000"
      )
    ).toBeInTheDocument()
  })

  it("deve renderizar valores zerados", () => {
    render(
      <StatCard
        title="Ações pendentes"
        value="0"
        icon={Activity}
      />
    )

    expect(
      screen.getByText("0")
    ).toBeInTheDocument()
  })

  it("deve renderizar o ícone recebido", () => {
    const {
      container,
    } = render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      container.querySelector("svg")
    ).toBeInTheDocument()
  })

  it("deve aplicar o tamanho correto ao ícone", () => {
    const {
      container,
    } = render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      container.querySelector("svg")
    ).toHaveClass(
      "size-[18px]"
    )
  })

  it("deve renderizar os dois elementos decorativos como ocultos para leitores de tela", () => {
    const {
      container,
    } = render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      container.querySelectorAll(
        'div[aria-hidden="true"]'
      )
    ).toHaveLength(2)
  })

  it("deve manter o ícone oculto para leitores de tela", () => {
    const {
      container,
    } = render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      container.querySelector("svg")
    ).toHaveAttribute(
      "aria-hidden",
      "true"
    )
  })

  it("deve aplicar a classe personalizada do ícone", () => {
    const {
      container,
    } = render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
        iconClassName="custom-icon-class"
      />
    )

    const icon =
      container.querySelector("svg")

    const iconContainer =
      icon?.parentElement

    expect(iconContainer).toHaveClass(
      "custom-icon-class"
    )
  })

  it("deve preservar as classes padrão do contêiner do ícone", () => {
    const {
      container,
    } = render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    const icon =
      container.querySelector("svg")

    const iconContainer =
      icon?.parentElement

    expect(iconContainer).toHaveClass(
      "flex",
      "size-11",
      "shrink-0",
      "items-center",
      "justify-center",
      "rounded-2xl",
      "border",
      "border-white/[0.08]",
      "bg-white/[0.04]",
      "text-[#D6DBE3]"
    )
  })

  it("deve aplicar a classe personalizada do destaque superior", () => {
    const {
      container,
    } = render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
        accentClassName="custom-accent-class"
      />
    )

    const accent =
      container.querySelector(
        ".custom-accent-class"
      )

    expect(accent).toBeInTheDocument()
  })

  it("deve preservar as classes padrão do destaque superior", () => {
    const {
      container,
    } = render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
        accentClassName="custom-accent-class"
      />
    )

    const accent =
      container.querySelector(
        ".custom-accent-class"
      )

    expect(accent).toHaveClass(
      "pointer-events-none",
      "absolute",
      "left-0",
      "top-0",
      "h-px",
      "w-3/4",
      "bg-gradient-to-r"
    )
  })

  it("deve aplicar a estrutura visual premium ao cartão", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByRole("article")
    ).toHaveClass(
      "group",
      "relative",
      "min-h-[178px]",
      "overflow-hidden",
      "rounded-[22px]",
      "border",
      "border-white/[0.06]",
      "bg-[#15191F]/88",
      "p-5",
      "backdrop-blur-xl"
    )
  })

  it("deve aplicar transição suave ao cartão", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByRole("article")
    ).toHaveClass(
      "transition-[border-color,background-color,box-shadow,transform]",
      "duration-200",
      "ease-out"
    )
  })

  it("deve aplicar relevo no hover sem usar azul", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    const card =
      screen.getByRole("article")

    expect(card).toHaveClass(
      "hover:-translate-y-1",
      "hover:border-white/[0.10]",
      "hover:bg-[#15191F]/88"
    )

    expect(
      card.className.toLowerCase()
    ).not.toContain("blue")
  })

  it("deve retornar o cartão à posição original ao ser pressionado", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByRole("article")
    ).toHaveClass(
      "active:translate-y-0"
    )
  })

  it("deve aplicar tipografia premium ao título", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Novas oportunidades",
      })
    ).toHaveClass(
      "text-sm",
      "font-medium",
      "text-[#D6DBE3]"
    )
  })

  it("deve aplicar tipografia discreta à descrição", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        description="Leads adicionados à operação"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByText(
        "Leads adicionados à operação"
      )
    ).toHaveClass(
      "mt-1",
      "text-xs",
      "leading-5",
      "text-[#697384]"
    )
  })

  it("deve aplicar tipografia de destaque ao valor", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    expect(
      screen.getByText("12")
    ).toHaveClass(
      "block",
      "break-words",
      "text-[30px]",
      "font-semibold",
      "leading-none",
      "tracking-[-0.055em]",
      "text-[#F5F7FA]",
      "sm:text-[32px]"
    )
  })

  it("deve manter o valor alinhado na parte inferior do cartão", () => {
    render(
      <StatCard
        title="Novas oportunidades"
        value="12"
        icon={Activity}
      />
    )

    const value =
      screen.getByText("12")

    expect(
      value.parentElement
    ).toHaveClass(
      "mt-auto",
      "pt-6"
    )
  })

  it("deve aceitar títulos e valores extensos", () => {
    render(
      <StatCard
        title="Produção comercial acumulada no mês"
        description="Volume total das vendas realizadas na operação"
        value="R$ 12.500.000"
        icon={Activity}
      />
    )

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Produção comercial acumulada no mês",
      })
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        "Volume total das vendas realizadas na operação"
      )
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        "R$ 12.500.000"
      )
    ).toBeInTheDocument()
  })
})
