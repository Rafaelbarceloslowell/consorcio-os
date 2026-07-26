import {
    renderToStaticMarkup,
  } from "react-dom/server";
  
  import {
    describe,
    expect,
    it,
  } from "vitest";
  
  import {
    Badge,
    badgeVariants,
  } from "@/components/ui/badge";
  
  describe("Badge", () => {
    it("renderiza o conteúdo recebido", () => {
      const html = renderToStaticMarkup(
        <Badge>
          Novo
        </Badge>,
      );
  
      expect(html).toContain('data-slot="badge"');
      expect(html).toContain("Novo");
    });
  
    it("utiliza as variantes padrão", () => {
      const html = renderToStaticMarkup(
        <Badge>
          Padrão
        </Badge>,
      );
  
      expect(html).toContain('data-variant="default"');
      expect(html).toContain('data-size="md"');
      expect(html).not.toContain('data-dot="true"');
  
      expect(html).toContain("border-[var(--gorila-material-border)]");
      expect(html).toContain("bg-[var(--gorila-surface-subtle)]");
      expect(html).toContain("text-[var(--gorila-material-text-soft)]");
    });
  
    it("aplica a variante success", () => {
      const html = renderToStaticMarkup(
        <Badge variant="success">
          Contemplado
        </Badge>,
      );
  
      expect(html).toContain('data-variant="success"');
      expect(html).toContain("border-[var(--gorila-green-bright)]/25");
      expect(html).toContain("bg-[var(--gorila-green-soft)]");
      expect(html).toContain("text-[var(--gorila-green-bright)]");
    });
  
    it("aplica a variante warning", () => {
      const html = renderToStaticMarkup(
        <Badge variant="warning">
          Pendente
        </Badge>,
      );
  
      expect(html).toContain('data-variant="warning"');
      expect(html).toContain("border-[var(--gorila-material-border-strong)]");
      expect(html).toContain("bg-[var(--gorila-material-inset)]");
      expect(html).toContain("text-[var(--gorila-material-text)]");
    });
  
    it("aplica a variante danger", () => {
      const html = renderToStaticMarkup(
        <Badge variant="danger">
          Cancelado
        </Badge>,
      );
  
      expect(html).toContain('data-variant="danger"');
      expect(html).toContain("border-[var(--gorila-material-border-strong)]");
      expect(html).toContain("bg-[var(--gorila-material-inset)]");
      expect(html).toContain("text-[var(--gorila-material-text)]");
    });
  
    it("aplica a variante info", () => {
      const html = renderToStaticMarkup(
        <Badge variant="info">
          Em análise
        </Badge>,
      );
  
      expect(html).toContain('data-variant="info"');
      expect(html).toContain("border-[var(--gorila-green-bright)]/20");
      expect(html).toContain("bg-[var(--gorila-green-soft)]");
      expect(html).toContain("text-[var(--gorila-green-bright)]");
    });
  
    it("aplica a variante neutral", () => {
      const html = renderToStaticMarkup(
        <Badge variant="neutral">
          Arquivado
        </Badge>,
      );
  
      expect(html).toContain('data-variant="neutral"');
      expect(html).toContain("border-[var(--gorila-material-border)]");
      expect(html).toContain("bg-[var(--gorila-surface-subtle)]");
      expect(html).toContain("text-[var(--gorila-material-text-muted)]");
    });
  
    it("aplica a variante premium", () => {
      const html = renderToStaticMarkup(
        <Badge variant="premium">
          Gorila OS
        </Badge>,
      );
  
      expect(html).toContain('data-variant="premium"');
      expect(html).toContain("border-[var(--gorila-green-bright)]/30");
      expect(html).toContain("bg-[var(--gorila-green-soft)]");
      expect(html).toContain("text-[var(--gorila-material-text)]");
    });
  
    it("aplica o tamanho pequeno", () => {
      const html = renderToStaticMarkup(
        <Badge size="sm">
          Pequeno
        </Badge>,
      );
  
      expect(html).toContain('data-size="sm"');
      expect(html).toContain("h-5");
      expect(html).toContain("rounded-md");
      expect(html).toContain("text-[11px]");
    });
  
    it("aplica o tamanho médio", () => {
      const html = renderToStaticMarkup(
        <Badge size="md">
          Médio
        </Badge>,
      );
  
      expect(html).toContain('data-size="md"');
      expect(html).toContain("h-6");
      expect(html).toContain("rounded-lg");
      expect(html).toContain("text-xs");
    });
  
    it("aplica o tamanho grande", () => {
      const html = renderToStaticMarkup(
        <Badge size="lg">
          Grande
        </Badge>,
      );
  
      expect(html).toContain('data-size="lg"');
      expect(html).toContain("h-7");
      expect(html).toContain("rounded-lg");
      expect(html).toContain("text-sm");
    });
  
    it("aplica o indicador visual em ponto", () => {
      const html = renderToStaticMarkup(
        <Badge
          variant="warning"
          dot
        >
          Aguardando
        </Badge>,
      );
  
      expect(html).toContain('data-dot="true"');
      expect(html).toContain("before:size-1.5");
      expect(html).toContain("before:rounded-full");
      expect(html).toContain("before:bg-current");
    });
  
    it("renderiza ícones recebidos", () => {
      const html = renderToStaticMarkup(
        <Badge variant="success">
          <svg data-testid="status-icon" />
          Ativo
        </Badge>,
      );
  
      expect(html).toContain('data-testid="status-icon"');
      expect(html).toContain("Ativo");
      expect(html).toContain("[&amp;_svg]:shrink-0");
    });
  
    it("permite adicionar classes personalizadas", () => {
      const html = renderToStaticMarkup(
        <Badge className="custom-badge">
          Personalizado
        </Badge>,
      );
  
      expect(html).toContain("custom-badge");
      expect(html).toContain("inline-flex");
      expect(html).toContain("items-center");
    });
  
    it("repassa propriedades nativas do span", () => {
      const html = renderToStaticMarkup(
        <Badge
          id="proposal-status"
          aria-label="Status da proposta"
          title="Proposta enviada"
        >
          Enviada
        </Badge>,
      );
  
      expect(html).toContain('id="proposal-status"');
      expect(html).toContain(
        'aria-label="Status da proposta"',
      );
      expect(html).toContain(
        'title="Proposta enviada"',
      );
    });
  
    it("gera diretamente as classes das variantes", () => {
      const classes = badgeVariants({
        variant: "success",
        size: "lg",
        dot: true,
      });
  
      expect(classes).toContain("border-[var(--gorila-green-bright)]/25");
      expect(classes).toContain("h-7");
      expect(classes).toContain("before:size-1.5");
    });
  });
