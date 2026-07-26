import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  IconContainer,
  iconContainerVariants,
} from "@/components/ui/icon-container"

describe("IconContainer", () => {
  it("renderiza o conteúdo recebido", () => {
    const html = renderToStaticMarkup(
      <IconContainer>
        <svg data-testid="test-icon" />
      </IconContainer>
    )

    expect(html).toContain('data-slot="icon-container"')
    expect(html).toContain('data-testid="test-icon"')
  })

  it("utiliza as variantes padrão", () => {
    const html = renderToStaticMarkup(
      <IconContainer>
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-size="md"')
    expect(html).toContain('data-tone="default"')
    expect(html).not.toContain('data-interactive="true"')

    expect(html).toContain("size-12")
    expect(html).toContain("rounded-2xl")
    expect(html).toContain("border-[var(--gorila-material-border)]")
    expect(html).toContain("bg-[var(--gorila-surface-subtle)]")
    expect(html).toContain("text-[var(--gorila-material-text)]")
  })

  it("aplica o tamanho pequeno", () => {
    const html = renderToStaticMarkup(
      <IconContainer size="sm">
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-size="sm"')
    expect(html).toContain("size-9")
    expect(html).toContain("rounded-xl")
    expect(html).toContain("[&amp;&gt;svg]:size-4")
  })

  it("aplica o tamanho médio", () => {
    const html = renderToStaticMarkup(
      <IconContainer size="md">
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-size="md"')
    expect(html).toContain("size-12")
    expect(html).toContain("rounded-2xl")
    expect(html).toContain("[&amp;&gt;svg]:size-5")
  })

  it("aplica o tamanho grande", () => {
    const html = renderToStaticMarkup(
      <IconContainer size="lg">
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-size="lg"')
    expect(html).toContain("size-14")
    expect(html).toContain("rounded-2xl")
    expect(html).toContain("[&amp;&gt;svg]:size-6")
  })

  it("aplica o tom de sucesso", () => {
    const html = renderToStaticMarkup(
      <IconContainer tone="success">
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-tone="success"')
    expect(html).toContain("border-[var(--gorila-green-bright)]/25")
    expect(html).toContain("bg-[var(--gorila-green-soft)]")
    expect(html).toContain("text-[var(--gorila-green-bright)]")
  })

  it("aplica o tom de aviso", () => {
    const html = renderToStaticMarkup(
      <IconContainer tone="warning">
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-tone="warning"')
    expect(html).toContain("border-[var(--gorila-material-border-strong)]")
    expect(html).toContain("bg-[var(--gorila-material-inset)]")
    expect(html).toContain("text-[var(--gorila-material-text)]")
  })

  it("aplica o tom de perigo", () => {
    const html = renderToStaticMarkup(
      <IconContainer tone="danger">
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-tone="danger"')
    expect(html).toContain("border-[var(--gorila-material-border-strong)]")
    expect(html).toContain("bg-[var(--gorila-material-inset)]")
    expect(html).toContain("text-[var(--gorila-material-text)]")
  })

  it("aplica o tom informativo", () => {
    const html = renderToStaticMarkup(
      <IconContainer tone="info">
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-tone="info"')
    expect(html).toContain("border-[var(--gorila-green-bright)]/20")
    expect(html).toContain("bg-[var(--gorila-green-soft)]")
    expect(html).toContain("text-[var(--gorila-green-bright)]")
  })

  it("aplica as classes interativas", () => {
    const html = renderToStaticMarkup(
      <IconContainer interactive>
        <svg />
      </IconContainer>
    )

    expect(html).toContain('data-interactive="true"')
    expect(html).toContain("group-hover:scale-105")
    expect(html).toContain("group-active:scale-100")
  })

  it("permite adicionar classes personalizadas", () => {
    const html = renderToStaticMarkup(
      <IconContainer className="custom-icon-container">
        <svg />
      </IconContainer>
    )

    expect(html).toContain("custom-icon-container")
    expect(html).toContain("inline-flex")
    expect(html).toContain("items-center")
    expect(html).toContain("justify-center")
  })

  it("repassa propriedades nativas da div", () => {
    const html = renderToStaticMarkup(
      <IconContainer
        id="customer-icon"
        aria-label="Ícone do cliente"
        title="Cliente"
      >
        <svg />
      </IconContainer>
    )

    expect(html).toContain('id="customer-icon"')
    expect(html).toContain('aria-label="Ícone do cliente"')
    expect(html).toContain('title="Cliente"')
  })

  it("gera diretamente as classes das variantes", () => {
    const classes = iconContainerVariants({
      size: "lg",
      tone: "success",
      interactive: true,
    })

    expect(classes).toContain("size-14")
    expect(classes).toContain("border-[var(--gorila-green-bright)]/25")
    expect(classes).toContain("group-hover:scale-105")
  })
})
