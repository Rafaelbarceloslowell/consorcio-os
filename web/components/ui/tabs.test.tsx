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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs";
  
  describe("Tabs", () => {
    it("renderiza o componente raiz", () => {
      const html =
        renderToStaticMarkup(
          <Tabs>
            Conteúdo
          </Tabs>,
        );
  
      expect(html).toContain(
        'data-slot="tabs-root"',
      );
  
      expect(html).toContain(
        "Conteúdo",
      );
    });
  
    it("aplica largura total por padrão", () => {
      const html =
        renderToStaticMarkup(
          <Tabs>
            Conteúdo
          </Tabs>,
        );
  
      expect(html).toContain(
        "w-full",
      );
    });
  
    it("permite adicionar classes ao componente raiz", () => {
      const html =
        renderToStaticMarkup(
          <Tabs className="custom-tabs">
            Conteúdo
          </Tabs>,
        );
  
      expect(html).toContain(
        "custom-tabs",
      );
  
      expect(html).toContain(
        "w-full",
      );
    });
  
    it("repassa propriedades nativas ao componente raiz", () => {
      const html =
        renderToStaticMarkup(
          <Tabs
            id="commercial-tabs"
            aria-label="Navegação comercial"
            data-testid="tabs-root"
          >
            Conteúdo
          </Tabs>,
        );
  
      expect(html).toContain(
        'id="commercial-tabs"',
      );
  
      expect(html).toContain(
        'aria-label="Navegação comercial"',
      );
  
      expect(html).toContain(
        'data-testid="tabs-root"',
      );
    });
  
    it("utiliza defaultValue para definir a aba inicial", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                Visão geral
              </TabsTrigger>
  
              <TabsTrigger value="pipeline">
                Pipeline
              </TabsTrigger>
            </TabsList>
  
            <TabsContent value="overview">
              Conteúdo geral
            </TabsContent>
  
            <TabsContent value="pipeline">
              Conteúdo do pipeline
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        "Conteúdo geral",
      );
  
      expect(html).not.toContain(
        "Conteúdo do pipeline",
      );
    });
  
    it("utiliza value controlado quando fornecido", () => {
      const html =
        renderToStaticMarkup(
          <Tabs
            value="pipeline"
            defaultValue="overview"
          >
            <TabsList>
              <TabsTrigger value="overview">
                Visão geral
              </TabsTrigger>
  
              <TabsTrigger value="pipeline">
                Pipeline
              </TabsTrigger>
            </TabsList>
  
            <TabsContent value="overview">
              Conteúdo geral
            </TabsContent>
  
            <TabsContent value="pipeline">
              Conteúdo do pipeline
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).not.toContain(
        "Conteúdo geral",
      );
  
      expect(html).toContain(
        "Conteúdo do pipeline",
      );
    });
  
    it("aceita callback de mudança de valor", () => {
      const onValueChange =
        vi.fn();
  
      expect(() =>
        renderToStaticMarkup(
          <Tabs
            defaultValue="overview"
            onValueChange={
              onValueChange
            }
          >
            <TabsList>
              <TabsTrigger value="overview">
                Visão geral
              </TabsTrigger>
            </TabsList>
          </Tabs>,
        ),
      ).not.toThrow();
    });
  });
  
  describe("TabsList", () => {
    it("renderiza a lista de abas", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsList>
              Lista
            </TabsList>
          </Tabs>,
        );
  
      expect(html).toContain(
        'data-slot="tabs-list"',
      );
  
      expect(html).toContain(
        "Lista",
      );
    });
  
    it("possui role tablist", () => {
      const html =
        renderToStaticMarkup(
          <Tabs>
            <TabsList />
          </Tabs>,
        );
  
      expect(html).toContain(
        'role="tablist"',
      );
    });
  
    it("aplica visual premium", () => {
      const html =
        renderToStaticMarkup(
          <Tabs>
            <TabsList />
          </Tabs>,
        );
  
      expect(html).toContain(
        "rounded-xl",
      );
  
      expect(html).toContain(
        "border-white/10",
      );
  
      expect(html).toContain(
        "bg-white/[0.03]",
      );
  
      expect(html).toContain(
        "p-1",
      );
    });
  
    it("permite adicionar classes customizadas", () => {
      const html =
        renderToStaticMarkup(
          <Tabs>
            <TabsList className="custom-list" />
          </Tabs>,
        );
  
      expect(html).toContain(
        "custom-list",
      );
  
      expect(html).toContain(
        "inline-flex",
      );
    });
  
    it("repassa propriedades nativas", () => {
      const html =
        renderToStaticMarkup(
          <Tabs>
            <TabsList
              id="dashboard-tabs-list"
              aria-label="Seções do dashboard"
            />
          </Tabs>,
        );
  
      expect(html).toContain(
        'id="dashboard-tabs-list"',
      );
  
      expect(html).toContain(
        'aria-label="Seções do dashboard"',
      );
    });
  
    it("aceita referência externa", () => {
      const ref =
        createRef<HTMLDivElement>();
  
      expect(() =>
        renderToStaticMarkup(
          <Tabs>
            <TabsList ref={ref} />
          </Tabs>,
        ),
      ).not.toThrow();
    });
  
    it("mantém o displayName correto", () => {
      expect(
        TabsList.displayName,
      ).toBe(
        "TabsList",
      );
    });
  });
  
  describe("TabsTrigger", () => {
    it("renderiza o gatilho da aba", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger value="overview">
              Visão geral
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).toContain(
        'data-slot="tabs-trigger"',
      );
  
      expect(html).toContain(
        "Visão geral",
      );
    });
  
    it("renderiza como botão", () => {
      const html =
        renderToStaticMarkup(
          <Tabs>
            <TabsTrigger value="overview">
              Visão geral
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).toContain(
        "<button",
      );
  
      expect(html).toContain(
        'type="button"',
      );
    });
  
    it("possui role tab", () => {
      const html =
        renderToStaticMarkup(
          <Tabs>
            <TabsTrigger value="overview">
              Visão geral
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).toContain(
        'role="tab"',
      );
    });
  
    it("aplica estado ativo", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger value="overview">
              Visão geral
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).toContain(
        'data-state="active"',
      );
  
      expect(html).toContain(
        'aria-selected="true"',
      );
  
      expect(html).toContain(
        "bg-white/[0.08]",
      );
  
      expect(html).toContain(
        "text-white",
      );
    });
  
    it("aplica estado inativo", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger value="pipeline">
              Pipeline
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).toContain(
        'data-state="inactive"',
      );
  
      expect(html).toContain(
        'aria-selected="false"',
      );
  
      expect(html).toContain(
        "text-neutral-400",
      );
  
      expect(html).toContain(
        "hover:bg-white/[0.04]",
      );
    });
  
    it("não utiliza foco azul", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger value="overview">
              Visão geral
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).not.toContain(
        "blue",
      );
  
      expect(html).not.toContain(
        "rgba(59,130,246",
      );
    });
  
    it("aplica elevação premium no estado ativo", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger value="overview">
              Visão geral
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).toContain(
        "shadow-[0_8px_20px_rgba(0,0,0,.25)]",
      );
    });
  
    it("permite adicionar classes customizadas", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger
              value="overview"
              className="custom-trigger"
            >
              Visão geral
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).toContain(
        "custom-trigger",
      );
  
      expect(html).toContain(
        "rounded-lg",
      );
    });
  
    it("repassa propriedades nativas", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger
              value="overview"
              id="overview-trigger"
              aria-controls="overview-panel"
              disabled
            >
              Visão geral
            </TabsTrigger>
          </Tabs>,
        );
  
      expect(html).toContain(
        'id="overview-trigger"',
      );
  
      expect(html).toContain(
        'aria-controls="overview-panel"',
      );
  
      expect(html).toContain(
        "disabled",
      );
    });
  
    it("aceita callback de clique", () => {
      const onClick =
        vi.fn();
  
      expect(() =>
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger
              value="overview"
              onClick={onClick}
            >
              Visão geral
            </TabsTrigger>
          </Tabs>,
        ),
      ).not.toThrow();
    });
  
    it("aceita referência externa", () => {
      const ref =
        createRef<HTMLButtonElement>();
  
      expect(() =>
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsTrigger
              ref={ref}
              value="overview"
            >
              Visão geral
            </TabsTrigger>
          </Tabs>,
        ),
      ).not.toThrow();
    });
  
    it("mantém o displayName correto", () => {
      expect(
        TabsTrigger.displayName,
      ).toBe(
        "TabsTrigger",
      );
    });
  
    it("lança erro quando usado fora de Tabs", () => {
      expect(() =>
        renderToStaticMarkup(
          <TabsTrigger value="overview">
            Visão geral
          </TabsTrigger>,
        ),
      ).toThrow(
        "Tabs components must be used inside <Tabs>.",
      );
    });
  });
  
  describe("TabsContent", () => {
    it("renderiza o conteúdo da aba ativa", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent value="overview">
              Conteúdo geral
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        'data-slot="tabs-content"',
      );
  
      expect(html).toContain(
        "Conteúdo geral",
      );
    });
  
    it("não renderiza o conteúdo da aba inativa", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent value="pipeline">
              Conteúdo do pipeline
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).not.toContain(
        "Conteúdo do pipeline",
      );
  
      expect(html).not.toContain(
        'data-slot="tabs-content"',
      );
    });
  
    it("possui role tabpanel", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent value="overview">
              Conteúdo
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        'role="tabpanel"',
      );
    });
  
    it("aplica estado ativo", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent value="overview">
              Conteúdo
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        'data-state="active"',
      );
    });
  
    it("aplica animação de entrada", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent value="overview">
              Conteúdo
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        "animate-in",
      );
  
      expect(html).toContain(
        "fade-in",
      );
  
      expect(html).toContain(
        "duration-200",
      );
    });
  
    it("aplica espaçamento superior", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent value="overview">
              Conteúdo
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        "mt-6",
      );
    });
  
    it("permite adicionar classes customizadas", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent
              value="overview"
              className="custom-content"
            >
              Conteúdo
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        "custom-content",
      );
  
      expect(html).toContain(
        "mt-6",
      );
    });
  
    it("repassa propriedades nativas", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent
              value="overview"
              id="overview-panel"
              aria-labelledby="overview-trigger"
              data-testid="overview-content"
            >
              Conteúdo
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        'id="overview-panel"',
      );
  
      expect(html).toContain(
        'aria-labelledby="overview-trigger"',
      );
  
      expect(html).toContain(
        'data-testid="overview-content"',
      );
    });
  
    it("aceita referência externa", () => {
      const ref =
        createRef<HTMLDivElement>();
  
      expect(() =>
        renderToStaticMarkup(
          <Tabs defaultValue="overview">
            <TabsContent
              ref={ref}
              value="overview"
            >
              Conteúdo
            </TabsContent>
          </Tabs>,
        ),
      ).not.toThrow();
    });
  
    it("mantém o displayName correto", () => {
      expect(
        TabsContent.displayName,
      ).toBe(
        "TabsContent",
      );
    });
  
    it("lança erro quando usado fora de Tabs", () => {
      expect(() =>
        renderToStaticMarkup(
          <TabsContent value="overview">
            Conteúdo
          </TabsContent>,
        ),
      ).toThrow(
        "Tabs components must be used inside <Tabs>.",
      );
    });
  });
  
  describe("Estrutura completa das Tabs", () => {
    it("renderiza a estrutura completa com aba ativa", () => {
      const html =
        renderToStaticMarkup(
          <Tabs
            defaultValue="overview"
            aria-label="Dashboard comercial"
          >
            <TabsList>
              <TabsTrigger value="overview">
                Visão geral
              </TabsTrigger>
  
              <TabsTrigger value="pipeline">
                Pipeline
              </TabsTrigger>
  
              <TabsTrigger value="tasks">
                Tarefas
              </TabsTrigger>
            </TabsList>
  
            <TabsContent value="overview">
              Métricas comerciais
            </TabsContent>
  
            <TabsContent value="pipeline">
              Funil de vendas
            </TabsContent>
  
            <TabsContent value="tasks">
              Próximas tarefas
            </TabsContent>
          </Tabs>,
        );
  
      expect(html).toContain(
        'data-slot="tabs-root"',
      );
  
      expect(html).toContain(
        'data-slot="tabs-list"',
      );
  
      expect(html).toContain(
        'data-slot="tabs-trigger"',
      );
  
      expect(html).toContain(
        'data-slot="tabs-content"',
      );
  
      expect(html).toContain(
        "Visão geral",
      );
  
      expect(html).toContain(
        "Pipeline",
      );
  
      expect(html).toContain(
        "Tarefas",
      );
  
      expect(html).toContain(
        "Métricas comerciais",
      );
  
      expect(html).not.toContain(
        "Funil de vendas",
      );
  
      expect(html).not.toContain(
        "Próximas tarefas",
      );
    });
  
    it("marca apenas uma aba como ativa", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="pipeline">
            <TabsList>
              <TabsTrigger value="overview">
                Visão geral
              </TabsTrigger>
  
              <TabsTrigger value="pipeline">
                Pipeline
              </TabsTrigger>
  
              <TabsTrigger value="tasks">
                Tarefas
              </TabsTrigger>
            </TabsList>
          </Tabs>,
        );
  
      const activeStates =
        html.match(
          /data-state="active"/g,
        ) ?? [];
  
      expect(
        activeStates,
      ).toHaveLength(1);
    });
  
    it("marca as demais abas como inativas", () => {
      const html =
        renderToStaticMarkup(
          <Tabs defaultValue="pipeline">
            <TabsList>
              <TabsTrigger value="overview">
                Visão geral
              </TabsTrigger>
  
              <TabsTrigger value="pipeline">
                Pipeline
              </TabsTrigger>
  
              <TabsTrigger value="tasks">
                Tarefas
              </TabsTrigger>
            </TabsList>
          </Tabs>,
        );
  
      const inactiveStates =
        html.match(
          /data-state="inactive"/g,
        ) ?? [];
  
      expect(
        inactiveStates,
      ).toHaveLength(2);
    });
  });