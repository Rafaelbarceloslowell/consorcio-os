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
    vi,
  } from "vitest";
  
  import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  
  describe("Dialog", () => {
    it("não renderiza quando está fechado", () => {
      const html =
        renderToStaticMarkup(
          <Dialog
            open={false}
            onOpenChange={vi.fn()}
          >
            <DialogContent>
              Conteúdo
            </DialogContent>
          </Dialog>,
        );
  
      expect(html).toBe("");
    });
  
    it("renderiza quando está aberto", () => {
      const html =
        renderToStaticMarkup(
          <Dialog
            open
            onOpenChange={vi.fn()}
          >
            <DialogContent>
              Conteúdo
            </DialogContent>
          </Dialog>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-root"',
      );
  
      expect(html).toContain(
        'data-state="open"',
      );
  
      expect(html).toContain(
        "Conteúdo",
      );
    });
  
    it("renderiza o overlay premium", () => {
      const html =
        renderToStaticMarkup(
          <Dialog
            open
            onOpenChange={vi.fn()}
          >
            <DialogContent>
              Conteúdo
            </DialogContent>
          </Dialog>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-overlay"',
      );
  
      expect(html).toContain(
        "bg-black/72",
      );
  
      expect(html).toContain(
        "backdrop-blur-md",
      );
    });
  
    it("renderiza a camada de interação", () => {
      const html =
        renderToStaticMarkup(
          <Dialog
            open
            onOpenChange={vi.fn()}
          >
            <DialogContent>
              Conteúdo
            </DialogContent>
          </Dialog>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-interaction-layer"',
      );
    });
  
    it("permite adicionar classes ao root", () => {
      const html =
        renderToStaticMarkup(
          <Dialog
            open
            onOpenChange={vi.fn()}
            className="custom-dialog-root"
          >
            <DialogContent>
              Conteúdo
            </DialogContent>
          </Dialog>,
        );
  
      expect(html).toContain(
        "custom-dialog-root",
      );
  
      expect(html).toContain(
        'data-slot="dialog-root"',
      );
    });
  });
  
  describe("DialogContent", () => {
    it("renderiza o conteúdo principal", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo principal
          </DialogContent>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-content"',
      );
  
      expect(html).toContain(
        "Conteúdo principal",
      );
    });
  
    it("possui acessibilidade de diálogo", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'role="dialog"',
      );
  
      expect(html).toContain(
        'aria-modal="true"',
      );
  
      expect(html).toContain(
        'tabindex="-1"',
      );
    });
  
    it("gera identificador automaticamente", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toMatch(
        /id="[^"]+"/,
      );
    });
  
    it("utiliza o identificador recebido", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent id="proposal-dialog">
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'id="proposal-dialog"',
      );
    });
  
    it("renderiza título automático", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent title="Nova proposta">
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        "Nova proposta",
      );
  
      expect(html).toContain(
        'data-slot="dialog-title"',
      );
  
      expect(html).toContain(
        'aria-labelledby="',
      );
    });
  
    it("renderiza descrição automática", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent
            description="Preencha os dados da proposta."
          >
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        "Preencha os dados da proposta.",
      );
  
      expect(html).toContain(
        'data-slot="dialog-description"',
      );
  
      expect(html).toContain(
        'aria-describedby="',
      );
    });
  
    it("associa título e descrição aos IDs corretos", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent
            id="lead-dialog"
            title="Novo lead"
            description="Cadastre um novo lead."
          >
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'aria-labelledby="lead-dialog-title"',
      );
  
      expect(html).toContain(
        'aria-describedby="lead-dialog-description"',
      );
  
      expect(html).toContain(
        'id="lead-dialog-title"',
      );
  
      expect(html).toContain(
        'id="lead-dialog-description"',
      );
    });
  
    it("não adiciona aria-labelledby sem título", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).not.toContain(
        "aria-labelledby",
      );
    });
  
    it("não adiciona aria-describedby sem descrição", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).not.toContain(
        "aria-describedby",
      );
    });
  
    it("renderiza botão de fechar por padrão", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-close"',
      );
  
      expect(html).toContain(
        'aria-label="Fechar diálogo"',
      );
  
      expect(html).toContain(
        'type="button"',
      );
    });
  
    it("permite ocultar o botão de fechar", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent
            showCloseButton={false}
          >
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).not.toContain(
        'data-slot="dialog-close"',
      );
  
      expect(html).not.toContain(
        'aria-label="Fechar diálogo"',
      );
    });
  
    it("renderiza o ícone de fechar", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'viewBox="0 0 24 24"',
      );
  
      expect(html).toContain(
        "M6 6l12 12M18 6 6 18",
      );
    });
  
    it("renderiza footer automático", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent
            footer={
              <button type="button">
                Salvar
              </button>
            }
          >
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-footer"',
      );
  
      expect(html).toContain(
        "Salvar",
      );
    });
  
    it("não renderiza footer quando ausente", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).not.toContain(
        'data-slot="dialog-footer"',
      );
    });
  
    it("usa tamanho médio por padrão", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'data-size="md"',
      );
  
      expect(html).toContain(
        "max-w-xl",
      );
    });
  
    it("aplica tamanho pequeno", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent size="sm">
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'data-size="sm"',
      );
  
      expect(html).toContain(
        "max-w-md",
      );
    });
  
    it("aplica tamanho grande", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent size="lg">
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'data-size="lg"',
      );
  
      expect(html).toContain(
        "max-w-3xl",
      );
    });
  
    it("aplica tamanho extragrande", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent size="xl">
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'data-size="xl"',
      );
  
      expect(html).toContain(
        "max-w-5xl",
      );
    });
  
    it("aplica tamanho completo", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent size="full">
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'data-size="full"',
      );
  
      expect(html).toContain(
        "max-w-[calc(100vw-2rem)]",
      );
    });
  
    it("aplica os estilos premium", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        "--dialog-background:rgba(18,18,18,.96)",
      );
  
      expect(html).toContain(
        "--dialog-border:rgba(255,255,255,.10)",
      );
  
      expect(html).toContain(
        "--dialog-text:#F5F3EE",
      );
  
      expect(html).toContain(
        "--dialog-muted:#989898",
      );
    });
  
    it("não utiliza identidade visual azul", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent>
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).not.toContain(
        "blue",
      );
  
      expect(html).not.toContain(
        "rgba(59,130,246",
      );
    });
  
    it("permite adicionar classes customizadas", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent className="custom-content">
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        "custom-content",
      );
  
      expect(html).toContain(
        "max-h-[calc(100vh-2rem)]",
      );
    });
  
    it("permite sobrescrever estilos", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent
            style={{
              minHeight: 420,
            }}
          >
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        "min-height:420px",
      );
    });
  
    it("repassa propriedades nativas", () => {
      const html =
        renderToStaticMarkup(
          <DialogContent
            aria-label="Modal de cadastro"
            data-testid="dialog-content"
          >
            Conteúdo
          </DialogContent>,
        );
  
      expect(html).toContain(
        'aria-label="Modal de cadastro"',
      );
  
      expect(html).toContain(
        'data-testid="dialog-content"',
      );
    });
  
    it("aceita referência externa", () => {
      const ref =
        createRef<HTMLElement>();
  
      expect(() =>
        renderToStaticMarkup(
          <DialogContent ref={ref}>
            Conteúdo
          </DialogContent>,
        ),
      ).not.toThrow();
    });
  
    it("mantém o displayName correto", () => {
      expect(
        DialogContent.displayName,
      ).toBe(
        "DialogContent",
      );
    });
  });
  
  describe("Subcomponentes do Dialog", () => {
    it("renderiza o header", () => {
      const html =
        renderToStaticMarkup(
          <DialogHeader>
            Cabeçalho
          </DialogHeader>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-header"',
      );
  
      expect(html).toContain(
        "Cabeçalho",
      );
  
      expect(html).toContain(
        "border-white/[0.07]",
      );
    });
  
    it("renderiza o title", () => {
      const html =
        renderToStaticMarkup(
          <DialogTitle>
            Título do diálogo
          </DialogTitle>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-title"',
      );
  
      expect(html).toContain(
        "Título do diálogo",
      );
  
      expect(html).toContain(
        "tracking-[-0.02em]",
      );
    });
  
    it("renderiza a description", () => {
      const html =
        renderToStaticMarkup(
          <DialogDescription>
            Descrição do diálogo
          </DialogDescription>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-description"',
      );
  
      expect(html).toContain(
        "Descrição do diálogo",
      );
  
      expect(html).toContain(
        "leading-relaxed",
      );
    });
  
    it("renderiza o body", () => {
      const html =
        renderToStaticMarkup(
          <DialogBody>
            Corpo do diálogo
          </DialogBody>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-body"',
      );
  
      expect(html).toContain(
        "Corpo do diálogo",
      );
  
      expect(html).toContain(
        "overflow-y-auto",
      );
    });
  
    it("renderiza o footer", () => {
      const html =
        renderToStaticMarkup(
          <DialogFooter>
            Rodapé do diálogo
          </DialogFooter>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-footer"',
      );
  
      expect(html).toContain(
        "Rodapé do diálogo",
      );
  
      expect(html).toContain(
        "sm:justify-end",
      );
    });
  
    it("permite classes customizadas nos subcomponentes", () => {
      const headerHtml =
        renderToStaticMarkup(
          <DialogHeader className="custom-header">
            Header
          </DialogHeader>,
        );
  
      const titleHtml =
        renderToStaticMarkup(
          <DialogTitle className="custom-title">
            Title
          </DialogTitle>,
        );
  
      const descriptionHtml =
        renderToStaticMarkup(
          <DialogDescription className="custom-description">
            Description
          </DialogDescription>,
        );
  
      const bodyHtml =
        renderToStaticMarkup(
          <DialogBody className="custom-body">
            Body
          </DialogBody>,
        );
  
      const footerHtml =
        renderToStaticMarkup(
          <DialogFooter className="custom-footer">
            Footer
          </DialogFooter>,
        );
  
      expect(headerHtml).toContain(
        "custom-header",
      );
  
      expect(titleHtml).toContain(
        "custom-title",
      );
  
      expect(descriptionHtml).toContain(
        "custom-description",
      );
  
      expect(bodyHtml).toContain(
        "custom-body",
      );
  
      expect(footerHtml).toContain(
        "custom-footer",
      );
    });
  
    it("mantém os displayNames corretos", () => {
      expect(
        DialogHeader.displayName,
      ).toBe(
        "DialogHeader",
      );
  
      expect(
        DialogTitle.displayName,
      ).toBe(
        "DialogTitle",
      );
  
      expect(
        DialogDescription.displayName,
      ).toBe(
        "DialogDescription",
      );
  
      expect(
        DialogBody.displayName,
      ).toBe(
        "DialogBody",
      );
  
      expect(
        DialogFooter.displayName,
      ).toBe(
        "DialogFooter",
      );
    });
  
    it("aceita referências externas nos subcomponentes", () => {
      const headerRef =
        createRef<HTMLElement>();
  
      const titleRef =
        createRef<HTMLHeadingElement>();
  
      const descriptionRef =
        createRef<HTMLParagraphElement>();
  
      const bodyRef =
        createRef<HTMLDivElement>();
  
      const footerRef =
        createRef<HTMLElement>();
  
      expect(() =>
        renderToStaticMarkup(
          <>
            <DialogHeader ref={headerRef}>
              Header
            </DialogHeader>
  
            <DialogTitle ref={titleRef}>
              Title
            </DialogTitle>
  
            <DialogDescription
              ref={descriptionRef}
            >
              Description
            </DialogDescription>
  
            <DialogBody ref={bodyRef}>
              Body
            </DialogBody>
  
            <DialogFooter ref={footerRef}>
              Footer
            </DialogFooter>
          </>,
        ),
      ).not.toThrow();
    });
  
    it("renderiza a estrutura completa", () => {
      const html =
        renderToStaticMarkup(
          <Dialog
            open
            onOpenChange={vi.fn()}
          >
            <DialogContent
              id="complete-dialog"
              title="Confirmar venda"
              description="Revise os dados antes de concluir."
              footer={
                <>
                  <button type="button">
                    Cancelar
                  </button>
  
                  <button type="button">
                    Confirmar
                  </button>
                </>
              }
            >
              <DialogBody>
                Dados da venda
              </DialogBody>
            </DialogContent>
          </Dialog>,
        );
  
      expect(html).toContain(
        'data-slot="dialog-root"',
      );
  
      expect(html).toContain(
        'data-slot="dialog-overlay"',
      );
  
      expect(html).toContain(
        'data-slot="dialog-content"',
      );
  
      expect(html).toContain(
        'data-slot="dialog-header"',
      );
  
      expect(html).toContain(
        'data-slot="dialog-title"',
      );
  
      expect(html).toContain(
        'data-slot="dialog-description"',
      );
  
      expect(html).toContain(
        'data-slot="dialog-body"',
      );
  
      expect(html).toContain(
        'data-slot="dialog-footer"',
      );
  
      expect(html).toContain(
        "Confirmar venda",
      );
  
      expect(html).toContain(
        "Dados da venda",
      );
  
      expect(html).toContain(
        "Cancelar",
      );
  
      expect(html).toContain(
        "Confirmar",
      );
    });
  });