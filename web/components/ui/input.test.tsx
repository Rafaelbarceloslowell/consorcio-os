import {
    createRef,
  } from "react";
  
  import {
    renderToStaticMarkup,
  } from "react-dom/server";
  
  import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    Input,
  } from "@/components/ui/input";
  
  describe("Input", () => {
    it("renderiza o campo de entrada", () => {
      const html = renderToStaticMarkup(
        <Input
          name="clientName"
          placeholder="Nome do cliente"
        />,
      );
  
      expect(html).toContain('data-slot="input"');
      expect(html).toContain('name="clientName"');
      expect(html).toContain(
        'placeholder="Nome do cliente"',
      );
    });
  
    it("gera um identificador automaticamente", () => {
      const html = renderToStaticMarkup(
        <Input />,
      );
  
      expect(html).toMatch(/id="[^"]+"/);
    });
  
    it("utiliza o identificador recebido", () => {
      const html = renderToStaticMarkup(
        <Input id="proposal-value" />,
      );
  
      expect(html).toContain(
        'id="proposal-value"',
      );
    });
  
    it("aplica os estilos visuais padrão", () => {
      const html = renderToStaticMarkup(
        <Input />,
      );
  
      expect(html).toContain("h-11");
      expect(html).toContain("w-full");
      expect(html).toContain("border");
      expect(html).toContain("outline-none");
      expect(html).toContain(
        "--input-background:var(--gorila-material-inset)",
      );
      expect(html).toContain(
        "--input-text:var(--gorila-material-text)",
      );
    });
  
    it("não utiliza foco azul", () => {
      const html = renderToStaticMarkup(
        <Input />,
      );
  
      expect(html).not.toContain(
        "rgba(59, 130, 246",
      );
      expect(html).not.toContain(
        "blue",
      );
      expect(html).toContain(
        "--input-border-focus:var(--gorila-green-bright)",
      );
    });
  
    it("renderiza o ícone esquerdo", () => {
      const html = renderToStaticMarkup(
        <Input
          leftIcon={
            <svg data-testid="left-icon" />
          }
        />,
      );
  
      expect(html).toContain(
        'data-slot="input-left-icon"',
      );
      expect(html).toContain(
        'data-testid="left-icon"',
      );
      expect(html).toContain("pl-10");
    });
  
    it("renderiza o ícone direito", () => {
      const html = renderToStaticMarkup(
        <Input
          rightIcon={
            <svg data-testid="right-icon" />
          }
        />,
      );
  
      expect(html).toContain(
        'data-slot="input-right-icon"',
      );
      expect(html).toContain(
        'data-testid="right-icon"',
      );
      expect(html).toContain("pr-10");
    });
  
    it("renderiza os dois ícones simultaneamente", () => {
      const html = renderToStaticMarkup(
        <Input
          leftIcon={
            <svg data-testid="left-icon" />
          }
          rightIcon={
            <svg data-testid="right-icon" />
          }
        />,
      );
  
      expect(html).toContain(
        'data-testid="left-icon"',
      );
      expect(html).toContain(
        'data-testid="right-icon"',
      );
      expect(html).toContain("pl-10");
      expect(html).toContain("pr-10");
    });
  
    it("aplica o estado de erro", () => {
      const html = renderToStaticMarkup(
        <Input error />,
      );
  
      expect(html).toContain(
        'data-error="true"',
      );
      expect(html).toContain(
        'aria-invalid="true"',
      );
      expect(html).toContain(
        "--input-border:rgba(248, 113, 113, 0.55)",
      );
    });
  
    it("aplica erro automaticamente com mensagem", () => {
      const html = renderToStaticMarkup(
        <Input errorMessage="Campo obrigatório" />,
      );
  
      expect(html).toContain(
        'data-error="true"',
      );
      expect(html).toContain(
        'aria-invalid="true"',
      );
      expect(html).toContain(
        "Campo obrigatório",
      );
    });
  
    it("renderiza a mensagem de erro acessível", () => {
      const html = renderToStaticMarkup(
        <Input
          id="client-document"
          errorMessage="Documento inválido"
        />,
      );
  
      expect(html).toContain(
        'aria-describedby="client-document-error"',
      );
      expect(html).toContain(
        'id="client-document-error"',
      );
      expect(html).toContain('role="alert"');
      expect(html).toContain(
        'data-slot="input-error"',
      );
      expect(html).toContain(
        "Documento inválido",
      );
    });
  
    it("não renderiza mensagem de erro quando ausente", () => {
      const html = renderToStaticMarkup(
        <Input />,
      );
  
      expect(html).not.toContain(
        'data-slot="input-error"',
      );
      expect(html).not.toContain(
        'role="alert"',
      );
    });
  
    it("aplica o estado de carregamento", () => {
      const html = renderToStaticMarkup(
        <Input loading />,
      );
  
      expect(html).toContain(
        'data-loading="true"',
      );
      expect(html).toContain(
        'data-slot="input-loading"',
      );
      expect(html).toContain(
        "animate-spin",
      );
      expect(html).toContain("disabled");
    });
  
    it("prioriza o carregamento sobre o ícone direito", () => {
      const html = renderToStaticMarkup(
        <Input
          loading
          rightIcon={
            <svg data-testid="right-icon" />
          }
        />,
      );
  
      expect(html).toContain(
        'data-slot="input-loading"',
      );
      expect(html).not.toContain(
        'data-slot="input-right-icon"',
      );
      expect(html).not.toContain(
        'data-testid="right-icon"',
      );
    });
  
    it("preserva o estado desabilitado", () => {
      const html = renderToStaticMarkup(
        <Input disabled />,
      );
  
      expect(html).toContain("disabled");
      expect(html).toContain(
        "disabled:cursor-not-allowed",
      );
      expect(html).toContain(
        "disabled:opacity-45",
      );
    });
  
    it("preserva o modo somente leitura", () => {
      const html = renderToStaticMarkup(
        <Input readOnly />,
      );
  
      expect(html).toContain("readonly");
      expect(html).toContain(
        "read-only:cursor-default",
      );
      expect(html).toContain(
        "read-only:bg-[var(--input-background-readonly)]",
      );
      expect(html).not.toContain(
        "read-only:bg-slate-50",
      );
    });
  
    it("permite adicionar classes ao input", () => {
      const html = renderToStaticMarkup(
        <Input className="custom-input" />,
      );
  
      expect(html).toContain(
        "custom-input",
      );
      expect(html).toContain("h-11");
    });
  
    it("permite adicionar classes ao container", () => {
      const html = renderToStaticMarkup(
        <Input
          containerClassName="custom-container"
        />,
      );
  
      expect(html).toContain(
        "custom-container",
      );
      expect(html).toContain(
        'data-slot="input-container"',
      );
    });
  
    it("permite sobrescrever estilos", () => {
      const html = renderToStaticMarkup(
        <Input
          style={{
            minHeight: 48,
          }}
        />,
      );
  
      expect(html).toContain(
        "min-height:48px",
      );
    });
  
    it("repassa propriedades nativas", () => {
      const html = renderToStaticMarkup(
        <Input
          type="email"
          name="email"
          autoComplete="email"
          aria-label="E-mail do cliente"
        />,
      );
  
      expect(html).toContain(
        'type="email"',
      );
      expect(html).toContain(
        'name="email"',
      );
      expect(html).toContain(
        'autoComplete="email"',
      );
      expect(html).toContain(
        'aria-label="E-mail do cliente"',
      );
    });
  
    it("aceita valor padrão", () => {
      const html = renderToStaticMarkup(
        <Input defaultValue="Rafael" />,
      );
  
      expect(html).toContain(
        'value="Rafael"',
      );
    });
  
    it("mantém o displayName correto", () => {
      expect(Input.displayName).toBe("Input");
    });
  
    it("aceita referência externa", () => {
      const ref = createRef<HTMLInputElement>();
  
      expect(() =>
        renderToStaticMarkup(
          <Input ref={ref} />,
        ),
      ).not.toThrow();
    });
  });
