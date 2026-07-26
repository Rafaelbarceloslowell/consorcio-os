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
    Select,
  } from "@/components/ui/select";
  
  describe("Select", () => {
    it("renderiza o campo de seleção", () => {
      const html = renderToStaticMarkup(
        <Select name="status">
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'data-slot="select"',
      );
  
      expect(html).toContain(
        'name="status"',
      );
  
      expect(html).toContain(
        "Ativo",
      );
    });
  
    it("gera um identificador automaticamente", () => {
      const html = renderToStaticMarkup(
        <Select>
          <option value="1">
            Opção
          </option>
        </Select>,
      );
  
      expect(html).toMatch(
        /id="[^"]+"/,
      );
    });
  
    it("utiliza o identificador recebido", () => {
      const html = renderToStaticMarkup(
        <Select id="proposal-status">
          <option value="sent">
            Enviada
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'id="proposal-status"',
      );
    });
  
    it("aplica os estilos visuais padrão", () => {
      const html = renderToStaticMarkup(
        <Select>
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        "h-11",
      );
  
      expect(html).toContain(
        "appearance-none",
      );
  
      expect(html).toContain(
        "pr-10",
      );
  
      expect(html).toContain(
        "--select-background:var(--gorila-material-inset)",
      );
  
      expect(html).toContain(
        "--select-text:var(--gorila-material-text)",
      );
    });
  
    it("não utiliza foco azul", () => {
      const html = renderToStaticMarkup(
        <Select>
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).not.toContain(
        "rgba(59, 130, 246",
      );
  
      expect(html).not.toContain(
        "blue",
      );
  
      expect(html).toContain(
        "--select-border-focus:var(--gorila-green-bright)",
      );
    });
  
    it("renderiza o placeholder", () => {
      const html = renderToStaticMarkup(
        <Select placeholder="Selecione uma opção">
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        "Selecione uma opção",
      );
  
      expect(html).toContain(
        '<option value="" disabled="">',
      );
    });
  
    it("não renderiza placeholder quando ausente", () => {
      const html = renderToStaticMarkup(
        <Select>
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).not.toContain(
        "Selecione uma opção",
      );
    });
  
    it("renderiza as opções recebidas", () => {
      const html = renderToStaticMarkup(
        <Select>
          <option value="new">
            Novo
          </option>
  
          <option value="qualified">
            Qualificado
          </option>
  
          <option value="converted">
            Convertido
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'value="new"',
      );
  
      expect(html).toContain(
        "Novo",
      );
  
      expect(html).toContain(
        'value="qualified"',
      );
  
      expect(html).toContain(
        "Qualificado",
      );
  
      expect(html).toContain(
        'value="converted"',
      );
  
      expect(html).toContain(
        "Convertido",
      );
    });
  
    it("renderiza o ícone de seta", () => {
      const html = renderToStaticMarkup(
        <Select>
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'data-slot="select-icon"',
      );
  
      expect(html).toContain(
        'viewBox="0 0 24 24"',
      );
  
      expect(html).toContain(
        "m7 10 5 5 5-5",
      );
    });
  
    it("aplica o estado de erro", () => {
      const html = renderToStaticMarkup(
        <Select error>
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'data-error="true"',
      );
  
      expect(html).toContain(
        'aria-invalid="true"',
      );
  
      expect(html).toContain(
        "--select-border:rgba(248,113,113,.55)",
      );
    });
  
    it("aplica erro automaticamente com mensagem", () => {
      const html = renderToStaticMarkup(
        <Select errorMessage="Seleção obrigatória">
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'data-error="true"',
      );
  
      expect(html).toContain(
        'aria-invalid="true"',
      );
  
      expect(html).toContain(
        "Seleção obrigatória",
      );
    });
  
    it("renderiza a mensagem de erro acessível", () => {
      const html = renderToStaticMarkup(
        <Select
          id="journey-state"
          errorMessage="Selecione o estado da jornada"
        >
          <option value="new">
            Novo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'aria-describedby="journey-state-error"',
      );
  
      expect(html).toContain(
        'id="journey-state-error"',
      );
  
      expect(html).toContain(
        'role="alert"',
      );
  
      expect(html).toContain(
        'data-slot="select-error"',
      );
  
      expect(html).toContain(
        "Selecione o estado da jornada",
      );
    });
  
    it("não renderiza mensagem de erro quando ausente", () => {
      const html = renderToStaticMarkup(
        <Select>
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).not.toContain(
        'data-slot="select-error"',
      );
  
      expect(html).not.toContain(
        'role="alert"',
      );
    });
  
    it("preserva o estado desabilitado", () => {
      const html = renderToStaticMarkup(
        <Select disabled>
          <option value="active">
            Ativo
          </option>
        </Select>,
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
  
    it("aplica o modo somente leitura", () => {
      const html = renderToStaticMarkup(
        <Select readOnly>
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'data-readonly="true"',
      );
  
      expect(html).toContain(
        'aria-readonly="true"',
      );
  
      expect(html).toContain(
        "cursor-default",
      );
  
      expect(html).toContain(
        "bg-[var(--select-background-readonly)]",
      );
    });
  
    it("não aplica modo somente leitura por padrão", () => {
      const html = renderToStaticMarkup(
        <Select>
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).not.toContain(
        'data-readonly="true"',
      );
  
      expect(html).not.toContain(
        'aria-readonly="true"',
      );
    });
  
    it("permite adicionar classes ao select", () => {
      const html = renderToStaticMarkup(
        <Select className="custom-select">
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        "custom-select",
      );
  
      expect(html).toContain(
        "appearance-none",
      );
    });
  
    it("permite adicionar classes ao container", () => {
      const html = renderToStaticMarkup(
        <Select
          containerClassName="custom-container"
        >
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        "custom-container",
      );
  
      expect(html).toContain(
        'data-slot="select-container"',
      );
    });
  
    it("permite sobrescrever estilos", () => {
      const html = renderToStaticMarkup(
        <Select
          style={{
            minHeight: 48,
          }}
        >
          <option value="active">
            Ativo
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        "min-height:48px",
      );
    });
  
    it("repassa propriedades nativas", () => {
      const html = renderToStaticMarkup(
        <Select
          name="proposalStatus"
          required
          aria-label="Status da proposta"
        >
          <option value="draft">
            Rascunho
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        'name="proposalStatus"',
      );
  
      expect(html).toContain(
        "required",
      );
  
      expect(html).toContain(
        'aria-label="Status da proposta"',
      );
    });
  
    it("aceita valor padrão", () => {
      const html = renderToStaticMarkup(
        <Select defaultValue="qualified">
          <option value="new">
            Novo
          </option>
  
          <option value="qualified">
            Qualificado
          </option>
        </Select>,
      );
  
      expect(html).toContain(
        '<option value="qualified" selected="">',
      );
    });
  
    it("mantém o displayName correto", () => {
      expect(
        Select.displayName,
      ).toBe(
        "Select",
      );
    });
  
    it("aceita referência externa", () => {
      const ref =
        createRef<HTMLSelectElement>();
  
      expect(() =>
        renderToStaticMarkup(
          <Select ref={ref}>
            <option value="active">
              Ativo
            </option>
          </Select>,
        ),
      ).not.toThrow();
    });
  });
