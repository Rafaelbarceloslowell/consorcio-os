import {
  renderToStaticMarkup,
} from "react-dom/server";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

describe("Card", () => {
  it("renderiza o card com conteúdo", () => {
    const html = renderToStaticMarkup(
      <Card>
        Conteúdo do card
      </Card>,
    );

    expect(html).toContain('data-slot="card"');
    expect(html).toContain("Conteúdo do card");
  });

  it("utiliza os estilos padrão", () => {
    const html = renderToStaticMarkup(
      <Card>
        Padrão
      </Card>,
    );

    expect(html).not.toContain('data-glass="true"');
    expect(html).not.toContain('data-hover="true"');
    expect(html).toContain("flex");
    expect(html).toContain("flex-col");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("border");
    expect(html).toContain("--card-bg");
    expect(html).toContain("--card-border");
    expect(html).toContain("--card-shadow");
  });

  it("aplica o modo glass", () => {
    const html = renderToStaticMarkup(
      <Card glass>
        Glass
      </Card>,
    );

    expect(html).toContain('data-glass="true"');
    expect(html).toContain("backdrop-filter:blur(20px)");
    expect(html).toContain("-webkit-backdrop-filter:blur(20px)");
  });

  it("aplica o comportamento de hover", () => {
    const html = renderToStaticMarkup(
      <Card hover>
        Interativo
      </Card>,
    );

    expect(html).toContain('data-hover="true"');

    expect(html).toContain(
      "hover:border-[var(--card-border-hover)]",
    );

    expect(html).toContain(
      "hover:shadow-[var(--card-shadow-hover)]",
    );

    expect(html).not.toContain("hover:-translate-y-1");
  });

  it("permite adicionar classes personalizadas", () => {
    const html = renderToStaticMarkup(
      <Card className="custom-card">
        Personalizado
      </Card>,
    );

    expect(html).toContain("custom-card");
    expect(html).toContain("flex-col");
  });

  it("repassa propriedades nativas", () => {
    const html = renderToStaticMarkup(
      <Card
        id="sales-card"
        aria-label="Resumo de vendas"
        title="Vendas"
      >
        Resultado
      </Card>,
    );

    expect(html).toContain('id="sales-card"');
    expect(html).toContain(
      'aria-label="Resumo de vendas"',
    );
    expect(html).toContain('title="Vendas"');
  });

  it("permite sobrescrever estilos", () => {
    const html = renderToStaticMarkup(
      <Card
        style={{
          marginTop: 16,
        }}
      >
        Estilizado
      </Card>,
    );

    expect(html).toContain("margin-top:16px");
    expect(html).toContain("--card-radius");
  });
});

describe("CardHeader", () => {
  it("renderiza o cabeçalho", () => {
    const html = renderToStaticMarkup(
      <CardHeader>
        Cabeçalho
      </CardHeader>,
    );

    expect(html).toContain('data-slot="card-header"');
    expect(html).toContain("Cabeçalho");
    expect(html).toContain("gap-5");
    expect(html).toContain("px-7");
    expect(html).toContain("py-6");

    expect(html).toContain(
      "border-[var(--card-divider)]",
    );
  });

  it("aceita classes personalizadas", () => {
    const html = renderToStaticMarkup(
      <CardHeader className="custom-header">
        Cabeçalho
      </CardHeader>,
    );

    expect(html).toContain("custom-header");
  });
});

describe("CardTitle", () => {
  it("renderiza o título", () => {
    const html = renderToStaticMarkup(
      <CardTitle>
        Vendas do mês
      </CardTitle>,
    );

    expect(html).toContain('data-slot="card-title"');
    expect(html).toContain("Vendas do mês");
    expect(html).toContain("leading-tight");
    expect(html).toContain("tracking-[-0.02em]");
    expect(html).toContain("var(--card-title)");
  });

  it("permite sobrescrever estilos do título", () => {
    const html = renderToStaticMarkup(
      <CardTitle
        style={{
          textTransform: "uppercase",
        }}
      >
        Pipeline
      </CardTitle>,
    );

    expect(html).toContain(
      "text-transform:uppercase",
    );
  });
});

describe("CardDescription", () => {
  it("renderiza a descrição", () => {
    const html = renderToStaticMarkup(
      <CardDescription>
        Acompanhe os principais resultados.
      </CardDescription>,
    );

    expect(html).toContain(
      'data-slot="card-description"',
    );

    expect(html).toContain(
      "Acompanhe os principais resultados.",
    );

    expect(html).toContain("mt-2");
    expect(html).toContain("max-w-2xl");
    expect(html).toContain("leading-relaxed");
    expect(html).toContain(
      "var(--card-description)",
    );
  });
});

describe("CardContent", () => {
  it("renderiza o conteúdo com espaçamento", () => {
    const html = renderToStaticMarkup(
      <CardContent>
        Conteúdo principal
      </CardContent>,
    );

    expect(html).toContain(
      'data-slot="card-content"',
    );

    expect(html).toContain("Conteúdo principal");
    expect(html).toContain("flex-1");
    expect(html).toContain("px-7");
    expect(html).toContain("py-6");
  });

  it("aceita classes personalizadas", () => {
    const html = renderToStaticMarkup(
      <CardContent className="custom-content">
        Conteúdo
      </CardContent>,
    );

    expect(html).toContain("custom-content");
  });
});

describe("CardFooter", () => {
  it("renderiza o rodapé", () => {
    const html = renderToStaticMarkup(
      <CardFooter>
        Ações
      </CardFooter>,
    );

    expect(html).toContain('data-slot="card-footer"');
    expect(html).toContain("Ações");
    expect(html).toContain("justify-end");
    expect(html).toContain("gap-3");
    expect(html).toContain("px-7");
    expect(html).toContain("py-5");

    expect(html).toContain(
      "border-[var(--card-divider)]",
    );
  });

  it("repassa propriedades nativas", () => {
    const html = renderToStaticMarkup(
      <CardFooter
        id="card-actions"
        aria-label="Ações do card"
      >
        Ações
      </CardFooter>,
    );

    expect(html).toContain('id="card-actions"');

    expect(html).toContain(
      'aria-label="Ações do card"',
    );
  });
});

describe("Card completo", () => {
  it("renderiza todas as partes em conjunto", () => {
    const html = renderToStaticMarkup(
      <Card glass hover>
        <CardHeader>
          <div>
            <CardTitle>
              Pipeline comercial
            </CardTitle>

            <CardDescription>
              Acompanhe as oportunidades.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          R$ 1.000.000,00
        </CardContent>

        <CardFooter>
          Ver detalhes
        </CardFooter>
      </Card>,
    );

    expect(html).toContain('data-glass="true"');
    expect(html).toContain('data-hover="true"');
    expect(html).toContain(
      'data-slot="card-header"',
    );
    expect(html).toContain(
      'data-slot="card-title"',
    );
    expect(html).toContain(
      'data-slot="card-description"',
    );
    expect(html).toContain(
      'data-slot="card-content"',
    );
    expect(html).toContain(
      'data-slot="card-footer"',
    );
    expect(html).toContain(
      "Pipeline comercial",
    );
    expect(html).toContain(
      "R$ 1.000.000,00",
    );
  });
});