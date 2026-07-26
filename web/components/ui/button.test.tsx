import {
  renderToStaticMarkup,
} from "react-dom/server";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  Button,
  buttonVariants,
} from "@/components/ui/button";

describe("Button", () => {
  it("renderiza o conteúdo recebido", () => {
    const html = renderToStaticMarkup(
      <Button>
        Continuar
      </Button>,
    );

    expect(html).toContain('data-slot="button"');
    expect(html).toContain("Continuar");
  });

  it("utiliza as variantes padrão", () => {
    const html = renderToStaticMarkup(
      <Button>
        Confirmar
      </Button>,
    );

    expect(html).toContain('data-variant="default"');
    expect(html).toContain('data-size="default"');
    expect(html).not.toContain('data-full-width="true"');
    expect(html).not.toContain('data-loading="true"');

    expect(html).toContain(
      "bg-[var(--button-primary-bg)]",
    );

    expect(html).toContain(
      "text-[var(--button-primary-text)]",
    );
  });

  it("aplica a variante primary", () => {
    const html = renderToStaticMarkup(
      <Button variant="primary">
        Salvar
      </Button>,
    );

    expect(html).toContain('data-variant="primary"');

    expect(html).toContain(
      "bg-[var(--button-primary-bg)]",
    );

    expect(html).toContain(
      "hover:bg-[var(--button-primary-hover)]",
    );
  });

  it("aplica a variante secondary", () => {
    const html = renderToStaticMarkup(
      <Button variant="secondary">
        Voltar
      </Button>,
    );

    expect(html).toContain('data-variant="secondary"');

    expect(html).toContain(
      "bg-[var(--button-secondary-bg)]",
    );

    expect(html).toContain(
      "text-[var(--button-secondary-text)]",
    );
  });

  it("aplica a variante outline", () => {
    const html = renderToStaticMarkup(
      <Button variant="outline">
        Detalhes
      </Button>,
    );

    expect(html).toContain('data-variant="outline"');

    expect(html).toContain(
      "border-[var(--button-outline-border)]",
    );

    expect(html).toContain(
      "bg-[var(--button-outline-bg)]",
    );
  });

  it("aplica a variante ghost", () => {
    const html = renderToStaticMarkup(
      <Button variant="ghost">
        Cancelar
      </Button>,
    );

    expect(html).toContain('data-variant="ghost"');
    expect(html).toContain("bg-transparent");

    expect(html).toContain(
      "text-[var(--button-ghost-text)]",
    );
  });

  it("aplica as variantes de perigo", () => {
    const destructiveHtml = renderToStaticMarkup(
      <Button variant="destructive">
        Excluir
      </Button>,
    );

    const dangerHtml = renderToStaticMarkup(
      <Button variant="danger">
        Remover
      </Button>,
    );

    expect(destructiveHtml).toContain(
      'data-variant="destructive"',
    );

    expect(dangerHtml).toContain(
      'data-variant="danger"',
    );

    expect(destructiveHtml).toContain(
      "bg-[var(--button-danger-bg)]",
    );

    expect(dangerHtml).toContain(
      "bg-[var(--button-danger-bg)]",
    );
  });

  it("aplica a variante link", () => {
    const html = renderToStaticMarkup(
      <Button variant="link">
        Saiba mais
      </Button>,
    );

    expect(html).toContain('data-variant="link"');
    expect(html).toContain("underline-offset-4");
    expect(html).toContain("hover:underline");

    expect(html).toContain(
      "text-[var(--button-link-text)]",
    );
  });

  it("aplica os tamanhos disponíveis", () => {
    const xsHtml = renderToStaticMarkup(
      <Button size="xs">
        XS
      </Button>,
    );

    const smHtml = renderToStaticMarkup(
      <Button size="sm">
        SM
      </Button>,
    );

    const mdHtml = renderToStaticMarkup(
      <Button size="md">
        MD
      </Button>,
    );

    const lgHtml = renderToStaticMarkup(
      <Button size="lg">
        LG
      </Button>,
    );

    expect(xsHtml).toContain('data-size="xs"');
    expect(xsHtml).toContain("h-7");

    expect(smHtml).toContain('data-size="sm"');
    expect(smHtml).toContain("h-8");

    expect(mdHtml).toContain('data-size="md"');
    expect(mdHtml).toContain("h-10");

    expect(lgHtml).toContain('data-size="lg"');
    expect(lgHtml).toContain("h-12");
  });

  it("aplica os tamanhos de ícone", () => {
    const iconHtml = renderToStaticMarkup(
      <Button
        size="icon"
        aria-label="Abrir menu"
      >
        <svg />
      </Button>,
    );

    const iconSmallHtml = renderToStaticMarkup(
      <Button
        size="icon-sm"
        aria-label="Fechar"
      >
        <svg />
      </Button>,
    );

    const iconLargeHtml = renderToStaticMarkup(
      <Button
        size="icon-lg"
        aria-label="Adicionar"
      >
        <svg />
      </Button>,
    );

    expect(iconHtml).toContain('data-size="icon"');
    expect(iconHtml).toContain("size-10");

    expect(iconSmallHtml).toContain(
      'data-size="icon-sm"',
    );

    expect(iconSmallHtml).toContain("size-8");

    expect(iconLargeHtml).toContain(
      'data-size="icon-lg"',
    );

    expect(iconLargeHtml).toContain("size-12");
  });

  it("aplica largura total", () => {
    const html = renderToStaticMarkup(
      <Button fullWidth>
        Entrar
      </Button>,
    );

    expect(html).toContain(
      'data-full-width="true"',
    );

    expect(html).toContain("w-full");
  });

  it("renderiza o estado de carregamento", () => {
    const html = renderToStaticMarkup(
      <Button
        loading
        loadingText="Salvando..."
      >
        Salvar
      </Button>,
    );

    expect(html).toContain('data-loading="true"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Salvando...");
    expect(html).not.toContain(">Salvar<");
    expect(html).toContain("animate-spin");
    expect(html).toContain("disabled");
  });

  it("mantém o conteúdo original durante o carregamento sem loadingText", () => {
    const html = renderToStaticMarkup(
      <Button loading>
        Processando
      </Button>,
    );

    expect(html).toContain("Processando");
    expect(html).toContain("animate-spin");
    expect(html).toContain("disabled");
  });

  it("respeita o estado desabilitado", () => {
    const html = renderToStaticMarkup(
      <Button disabled>
        Indisponível
      </Button>,
    );

    expect(html).toContain("disabled");

    expect(html).toContain(
      "disabled:pointer-events-none",
    );

    expect(html).toContain(
      "disabled:opacity-45",
    );
  });

  it("permite adicionar classes personalizadas", () => {
    const html = renderToStaticMarkup(
      <Button className="custom-button">
        Personalizado
      </Button>,
    );

    expect(html).toContain("custom-button");
    expect(html).toContain("inline-flex");
    expect(html).toContain("items-center");
    expect(html).toContain("justify-center");
  });

  it("repassa propriedades nativas", () => {
    const html = renderToStaticMarkup(
      <Button
        id="save-button"
        name="save"
        type="submit"
        aria-label="Salvar cliente"
        title="Salvar"
      >
        Salvar
      </Button>,
    );

    expect(html).toContain('id="save-button"');
    expect(html).toContain('name="save"');
    expect(html).toContain('type="submit"');

    expect(html).toContain(
      'aria-label="Salvar cliente"',
    );

    expect(html).toContain('title="Salvar"');
  });

  it("permite sobrescrever estilos", () => {
    const html = renderToStaticMarkup(
      <Button
        style={{
          marginTop: 12,
        }}
      >
        Estilizado
      </Button>,
    );

    expect(html).toContain("margin-top:12px");
    expect(html).toContain("--button-primary-bg");
  });

  it("gera diretamente as classes das variantes", () => {
    const classes = buttonVariants({
      variant: "secondary",
      size: "lg",
      fullWidth: true,
    });

    expect(classes).toContain(
      "bg-[var(--button-secondary-bg)]",
    );

    expect(classes).toContain("h-12");
    expect(classes).toContain("w-full");

    expect(classes).toContain(
      "hover:shadow-[var(--button-hover-shadow)]",
    );
  });
});