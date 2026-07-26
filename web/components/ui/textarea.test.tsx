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
    Textarea,
  } from "@/components/ui/textarea";
  
  describe("Textarea", () => {
    it("renderiza o campo multilinha", () => {
      const html = renderToStaticMarkup(
        <Textarea
          name="notes"
          placeholder="Digite uma observação"
        />,
      );
  
      expect(html).toContain(
        'data-slot="textarea"',
      );
  
      expect(html).toContain(
        'name="notes"',
      );
  
      expect(html).toContain(
        'placeholder="Digite uma observação"',
      );
    });
  
    it("gera um identificador automaticamente", () => {
      const html = renderToStaticMarkup(
        <Textarea />,
      );
  
      expect(html).toMatch(
        /id="[^"]+"/,
      );
    });
  
    it("utiliza o identificador recebido", () => {
      const html = renderToStaticMarkup(
        <Textarea id="commercial-notes" />,
      );
  
      expect(html).toContain(
        'id="commercial-notes"',
      );
    });
  
    it("aplica os estilos visuais padrão", () => {
      const html = renderToStaticMarkup(
        <Textarea />,
      );
  
      expect(html).toContain(
        "min-h-32",
      );
  
      expect(html).toContain(
        "resize-y",
      );
  
      expect(html).toContain(
        "w-full",
      );
  
      expect(html).toContain(
        "--textarea-background:var(--gorila-material-inset)",
      );
  
      expect(html).toContain(
        "--textarea-text:var(--gorila-material-text)",
      );
    });
  
    it("não utiliza foco azul", () => {
      const html = renderToStaticMarkup(
        <Textarea />,
      );
  
      expect(html).not.toContain(
        "rgba(59, 130, 246",
      );
  
      expect(html).not.toContain(
        "blue",
      );
  
      expect(html).toContain(
        "--textarea-border-focus:var(--gorila-green-bright)",
      );
    });
  
    it("aplica o estado de erro", () => {
      const html = renderToStaticMarkup(
        <Textarea error />,
      );
  
      expect(html).toContain(
        'data-error="true"',
      );
  
      expect(html).toContain(
        'aria-invalid="true"',
      );
  
      expect(html).toContain(
        "--textarea-border:rgba(248,113,113,.55)",
      );
    });
  
    it("aplica erro automaticamente com mensagem", () => {
      const html = renderToStaticMarkup(
        <Textarea
          errorMessage="Observação obrigatória"
        />,
      );
  
      expect(html).toContain(
        'data-error="true"',
      );
  
      expect(html).toContain(
        'aria-invalid="true"',
      );
  
      expect(html).toContain(
        "Observação obrigatória",
      );
    });
  
    it("renderiza a mensagem de erro acessível", () => {
      const html = renderToStaticMarkup(
        <Textarea
          id="meeting-notes"
          errorMessage="Informe o resumo da reunião"
        />,
      );
  
      expect(html).toContain(
        'aria-describedby="meeting-notes-error"',
      );
  
      expect(html).toContain(
        'id="meeting-notes-error"',
      );
  
      expect(html).toContain(
        'role="alert"',
      );
  
      expect(html).toContain(
        'data-slot="textarea-error"',
      );
  
      expect(html).toContain(
        "Informe o resumo da reunião",
      );
    });
  
    it("não renderiza mensagem de erro quando ausente", () => {
      const html = renderToStaticMarkup(
        <Textarea />,
      );
  
      expect(html).not.toContain(
        'data-slot="textarea-error"',
      );
  
      expect(html).not.toContain(
        'role="alert"',
      );
    });
  
    it("preserva o estado desabilitado", () => {
      const html = renderToStaticMarkup(
        <Textarea disabled />,
      );
  
      expect(html).toContain(
        "disabled",
      );
  
      expect(html).toContain(
        "disabled:cursor-not-allowed",
      );
  
      expect(html).toContain(
        "disabled:opacity-45",
      );
    });
  
    it("preserva o modo somente leitura", () => {
      const html = renderToStaticMarkup(
        <Textarea readOnly />,
      );
  
      expect(html).toContain(
        "readonly",
      );
  
      expect(html).toContain(
        "read-only:cursor-default",
      );
  
      expect(html).toContain(
        "read-only:bg-[var(--textarea-background-readonly)]",
      );
  
      expect(html).not.toContain(
        "read-only:bg-slate-50",
      );
    });
  
    it("permite adicionar classes ao textarea", () => {
      const html = renderToStaticMarkup(
        <Textarea className="custom-textarea" />,
      );
  
      expect(html).toContain(
        "custom-textarea",
      );
  
      expect(html).toContain(
        "min-h-32",
      );
    });
  
    it("permite adicionar classes ao container", () => {
      const html = renderToStaticMarkup(
        <Textarea
          containerClassName="custom-container"
        />,
      );
  
      expect(html).toContain(
        "custom-container",
      );
  
      expect(html).toContain(
        'data-slot="textarea-container"',
      );
    });
  
    it("permite sobrescrever estilos", () => {
      const html = renderToStaticMarkup(
        <Textarea
          style={{
            minHeight: 200,
          }}
        />,
      );
  
      expect(html).toContain(
        "min-height:200px",
      );
    });
  
    it("repassa propriedades nativas", () => {
      const html = renderToStaticMarkup(
        <Textarea
          name="description"
          rows={6}
          maxLength={500}
          aria-label="Descrição da proposta"
        />,
      );
  
      expect(html).toContain(
        'name="description"',
      );
  
      expect(html).toContain(
        'rows="6"',
      );
  
      expect(html).toContain(
        'maxLength="500"',
      );
  
      expect(html).toContain(
        'aria-label="Descrição da proposta"',
      );
    });
  
    it("aceita valor padrão", () => {
      const html = renderToStaticMarkup(
        <Textarea
          defaultValue="Cliente interessado em imóvel"
        />,
      );
  
      expect(html).toContain(
        "Cliente interessado em imóvel",
      );
    });
  
    it("mantém o displayName correto", () => {
      expect(
        Textarea.displayName,
      ).toBe(
        "Textarea",
      );
    });
  
    it("aceita referência externa", () => {
      const ref =
        createRef<HTMLTextAreaElement>();
  
      expect(() =>
        renderToStaticMarkup(
          <Textarea ref={ref} />,
        ),
      ).not.toThrow();
    });
  });
