# Gorila OS Brand

Esta pasta concentra a documentação institucional e os ativos oficiais da
identidade visual do Gorila OS.

Ela existe para garantir que produto, comunicação, materiais institucionais,
relatórios, exportações e futuras aplicações da marca utilizem uma referência
única, controlada e rastreável.

## Source of truth

A pasta `/brand` é a fonte oficial da identidade visual do Gorila OS.

A GorillaMark existente é a marca aprovada. Os documentos desta pasta não
autorizam sua reconstrução, simplificação, reinterpretação ou redesenho.

Na ausência de uma especificação técnica preenchida, devem ser utilizados
somente os arquivos-fonte oficialmente aprovados. Nenhum valor pode ser
deduzido visualmente a partir de mockups, capturas de tela ou arquivos
comprimidos.

## Estrutura de diretórios

```text
brand/
├── README.md
├── Brand-Book.md
├── GorillaMark-Design-Specification.md
├── assets/
│   ├── source/
│   ├── svg/
│   ├── png/
│   ├── favicon/
│   ├── pwa/
│   └── social/
├── colors/
│   └── palette.md
├── exports/
└── typography/
    └── typography.md
```

### Documentação

- `Brand-Book.md`: estrutura narrativa, estratégica e visual da marca.
- `GorillaMark-Design-Specification.md`: estrutura da especificação técnica da
  GorillaMark.
- `colors/palette.md`: registro controlado da paleta oficial.
- `typography/typography.md`: registro controlado do sistema tipográfico.

### Ativos

- `assets/source/`: arquivos mestres editáveis e aprovados. O futuro Master
  oficial deverá existir exclusivamente em
  `brand/assets/source/GorillaMark_Master.svg`.
- `assets/svg/`: exportações vetoriais oficiais.
- `assets/png/`: exportações rasterizadas oficiais.
- `assets/favicon/`: arquivos destinados a navegadores.
- `assets/pwa/`: ícones destinados à instalação da aplicação.
- `assets/social/`: ativos aprovados para compartilhamento e previews.
- `exports/`: pacotes versionados destinados à distribuição.

Pastas vazias representam contratos de organização. Elas não autorizam a
criação de ativos provisórios.

## Política de versionamento

A documentação e os ativos devem seguir o versionamento do repositório.

Cada alteração deve:

1. possuir origem identificável;
2. registrar a aprovação responsável;
3. descrever claramente o que mudou;
4. preservar versões anteriores no histórico;
5. atualizar documentos e exportações afetados no mesmo conjunto de mudanças;
6. evitar substituições silenciosas de arquivos oficiais.

Mudanças editoriais que não alterem a identidade podem ser revisadas
separadamente. Mudanças em desenho, proporção, cor, tipografia ou construção da
marca exigem aprovação formal antes de entrar nesta pasta.

Os nomes dos arquivos oficiais devem permanecer estáveis. Quando uma alteração
incompatível exigir nova versão de distribuição, a identificação da versão
deve ocorrer no pacote de exportação e no registro da mudança, não por cópias
ambíguas como `final`, `final-2` ou `novo`.

## Responsabilidades

### Responsável pela marca

- aprovar arquivos mestres;
- validar alterações conceituais ou visuais;
- confirmar versões, usos e exceções;
- fornecer especificações técnicas oficiais.

### Design

- preparar exportações a partir dos mestres aprovados;
- preservar proporções, curvas, cores, tipografia e efeitos;
- validar legibilidade, contraste e área de proteção;
- manter a documentação visual atualizada.

### Engenharia

- consumir somente ativos aprovados;
- preservar os arquivos sem reconstrução;
- garantir integração consistente entre temas e plataformas;
- evitar duplicações fora da estrutura oficial;
- validar formatos, desempenho e compatibilidade sem alterar o desenho.

### Produto e comunicação

- aplicar a marca conforme a documentação vigente;
- solicitar aprovação para casos não documentados;
- não criar variações locais ou temporárias.

## Fluxo dos ativos oficiais

```text
Arquivo mestre aprovado
        ↓
Validação do responsável pela marca
        ↓
Registro em assets/source
        ↓
Exportações controladas por finalidade
        ↓
Controle de qualidade
        ↓
Pacote em exports
        ↓
Integração no produto ou material
        ↓
Validação final
```

Nenhuma etapa de exportação pode modificar o desenho original. Ajustes de
formato, resolução ou compressão devem manter fidelidade visual e respeitar a
especificação oficial.

## Regras de contribuição

- Não reconstruir a GorillaMark a partir de imagens rasterizadas.
- Não vetorizar automaticamente mockups ou capturas de tela.
- Não preencher medidas ou valores por estimativa.
- Não adicionar cores sem aprovação.
- Não substituir tipografia por aproximação.
- Não criar ícones derivados sem especificação.
- Não publicar arquivos provisórios como oficiais.
- Não mover a fonte de verdade para pastas da aplicação.

Integrações do produto podem copiar os arquivos necessários para diretórios
públicos ou de build, mas a origem institucional permanece em `/brand`.

## Derivação a partir do Master SVG

Todos os ativos derivados deverão ser gerados exclusivamente a partir do
`brand/assets/source/GorillaMark_Master.svg` oficial, depois de sua aprovação
e validação técnica.

O Master SVG será a única fonte autorizada para produzir variações vetoriais,
arquivos raster, documentos, favicons, ícones de aplicação, ícones PWA e ativos
de compartilhamento.

O path canônico do Master é:

```text
brand/assets/source/GorillaMark_Master.svg
```

Nenhuma cópia desse arquivo em `assets/svg`, `exports` ou em diretórios da
aplicação poderá ser tratada como fonte de verdade.

### Paths oficiais previstos

| Classe | Path |
|---|---|
| Master SVG | `brand/assets/source/GorillaMark_Master.svg` |
| Variações SVG | `brand/assets/svg/` |
| Derivados PNG | `brand/assets/png/` |
| Favicon e ICO | `brand/assets/favicon/` |
| Apple Touch, Android e PWA | `brand/assets/pwa/` |
| Open Graph e Social Preview | `brand/assets/social/` |
| Pacotes e documentos distribuíveis | `brand/exports/` |

Nenhum arquivo raster poderá:

- servir como fonte para um novo ativo;
- ser vetorizado para reconstruir a GorillaMark;
- originar outra resolução por ampliação;
- substituir o Master SVG no pipeline;
- introduzir ajustes de desenho, cor, tipografia ou proporção;
- ser tratado como arquivo mestre, mesmo quando visualmente aprovado.

Mockups, capturas de tela, pranchas Light e Night e materiais de apresentação
são referências visuais oficiais, mas não são fontes técnicas de produção.

O pipeline oficial deverá seguir esta ordem:

1. aprovação da GorillaMark;
2. produção do Master SVG;
3. validação técnica;
4. geração automática de derivados;
5. distribuição oficial.

Os detalhes desse fluxo, a relação de ativos previstos e a estrutura dos
derivados estão documentados em
`GorillaMark-Design-Specification.md`.

Até que o Master SVG seja produzido e validado, as pastas de ativos devem
permanecer sem arquivos provisórios ou reconstruídos.

## Estado da documentação

Os documentos desta fundação contêm estruturas preparadas para preenchimento
futuro. Campos ainda não aprovados devem permanecer explicitamente marcados
como pendentes, sem valores inferidos.
