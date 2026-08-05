# R2 AAA-Web — Especificação Técnica v1.0

## 1. Status do documento

**Projeto:** GorilaR2 AAA-Web  
**Documento:** Especificação técnica de produção do personagem  
**Versão:** 1.0  
**Status:** baseline técnica controlada  
**Formato final:** GLB baseado em glTF 2.0  
**Runtime principal:** Three.js no GorilaOS  
**Ferramenta de autoria:** Blender 4.5 LTS

Esta especificação define os critérios obrigatórios para transformar a referência atual do GorilaR2 em um personagem com qualidade visual AAA adaptada à execução em navegadores.

Este documento não declara que o personagem já atingiu qualidade AAA. Ele define como essa qualidade será construída, medida e aprovada.

---

## 2. Princípio central

O projeto será dividido em duas camadas oficiais.

### 2.1 R2_Master

Arquivo de autoria e preservação.

O R2_Master deve conter:

- geometria de referência;
- geometria reconstruída;
- retopologia;
- rig de controle;
- rig de deformação;
- pesos anatômicos;
- Shape Keys corretivas;
- materiais de autoria;
- texturas-fonte;
- biblioteca completa de poses;
- biblioteca completa de animações;
- coleções de exportação;
- documentação de decisões técnicas.

O R2_Master não será usado diretamente pelo navegador.

### 2.2 R2_Web

Derivado otimizado para execução em tempo real.

O R2_Web deve conter apenas:

- geometria aprovada para runtime;
- esqueleto de deformação;
- pesos necessários;
- Morph Targets necessários;
- materiais compatíveis com glTF;
- texturas otimizadas;
- animações aprovadas;
- metadados indispensáveis;
- nenhuma estrutura de autoria desnecessária.

O R2_Web nunca será considerado fonte principal.

Alterações visuais ou estruturais devem nascer no R2_Master e depois ser exportadas novamente.

---

## 3. Governança e proteção dos arquivos

### 3.1 Arquivo-base confiável

O arquivo-base atualmente aprovado como referência é:

`blender/r2-rig/r2-rig-v13-weights-refined.blend`

SHA-256 aprovado:

`392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1`

### 3.2 Arquivos experimentais existentes

Os seguintes arquivos podem ser usados como evidência técnica, mas não como nova fonte principal:

- `r2-rig-v18-single-component-cage.blend`
- `r2-rig-v23-surface-deform-proxy.blend`
- `r2-rig-v24-celebration-validation.blend`

O v24 foi reprovado visualmente devido a deformações graves.

### 3.3 Regras obrigatórias

- Nenhum arquivo existente será sobrescrito.
- Cada alteração persistida criará uma versão nova.
- O v13 permanecerá read-only.
- Nenhum resultado será aprovado apenas por métricas.
- Toda aprovação de deformação exigirá inspeção visual.
- Experimentos reprovados não serão promovidos silenciosamente.
- Scripts devem registrar arquivo-fonte, arquivo-destino e resultado.
- A ausência de erro técnico não significa aprovação visual.
- A existência de um GLB válido não significa que o personagem está pronto.

---

## 4. Baseline estrutural confirmada

A auditoria read-only do v13 confirmou:

| Item | Estado |
|---|---:|
| Objetos de malha | 1 |
| Objetos de armature | 1 |
| Vértices | 197.505 |
| Arestas | 573.879 |
| Faces | 376.007 |
| Componentes conectados | 110 |
| Ossos | 51 |
| Grupos de vértices | 50 |
| UV Maps | 0 |
| Materiais | 0 |
| Imagens | 0 |
| Shape Keys corretivas | 0 |
| Actions | 0 |
| NLA Tracks | 0 |
| Bibliotecas externas | 0 |

A malha atual deve ser tratada como referência geométrica e não como modelo web final.

---

## 5. Problemas conhecidos

Os relatórios forenses existentes demonstram:

- deformações extremas em componentes críticos;
- alongamento excessivo de arestas;
- crescimento excessivo de áreas de faces;
- contaminação de pesos entre regiões não anatômicas;
- componentes do lado esquerdo influenciados por grupos incorretos;
- componentes do lado direito influenciados por grupos incorretos;
- componentes centrais influenciados por membros;
- estruturas rígidas deformando como tecido;
- regiões de articulação sem topologia adequada;
- dependência excessiva de pesos para compensar a geometria;
- ausência de Shape Keys corretivas;
- ausência de separação semântica das 110 ilhas.

Mesh Deform e Surface Deform não fazem parte do pipeline oficial.

Essas técnicas podem permanecer documentadas como experimentos reprovados, mas não serão usadas como fundação do novo personagem.

---

## 6. Atlas semântico obrigatório

Antes de qualquer retopologia, as 110 ilhas devem receber identificação estável.

Cada componente deverá possuir:

| Campo | Descrição |
|---|---|
| component_id | Identificador técnico original |
| semantic_name | Nome compreensível da peça |
| region | Cabeça, tronco, braço, mão, perna ou acessório |
| side | LEFT, RIGHT ou CENTER |
| material_family | Pele, pelo, tecido, olho, boca ou rígido |
| deformation_type | SOFT, RIGID, HYBRID ou STATIC |
| current_vertex_count | Quantidade atual de vértices |
| current_weights | Principais grupos de peso |
| risk_level | LOW, MEDIUM, HIGH ou CRITICAL |
| action | PRESERVE, RETOPOLOGY, REBUILD ou RIGID |
| evidence | Evidência visual e métrica |
| target_parent | Osso ou região de destino |
| notes | Observações de produção |

Nenhuma ilha poderá ser excluída, unida ou reconstruída sem estar identificada no atlas.

---

## 7. Classificação de produção

### 7.1 PRESERVE

Usada quando:

- a silhueta está correta;
- a densidade é justificável;
- a topologia não prejudica a deformação;
- o componente pode ser otimizado sem reconstrução;
- a peça mantém o padrão visual oficial do R2.

### 7.2 RETOPOLOGY

Usada quando:

- a forma deve ser preservada;
- a distribuição de loops é inadequada;
- a articulação apresenta colapso;
- existe densidade excessiva;
- a geometria pode ser reconstruída sobre a superfície original.

### 7.3 REBUILD

Usada quando:

- a peça não possui topologia recuperável;
- há interpenetração estrutural;
- a forma não corresponde ao design aprovado;
- a peça exige nova construção;
- a geometria atual impede animação de qualidade.

### 7.4 RIGID

Usada quando:

- a peça não deve deformar como tecido ou músculo;
- o movimento correto é realizado por parent direto;
- a peça deve receber peso integral de um único osso;
- a peça deve acompanhar outra estrutura rígida.

A classificação final dependerá de inspeção visual do componente isolado.

---

## 8. Estrutura recomendada do R2_Master

```text
R2_MASTER
├── 00_REFERENCE
├── 01_SOURCE_V13
├── 02_SEMANTIC_COMPONENTS
├── 03_RETOPOLOGY
├── 04_REBUILT_PARTS
├── 05_RIGID_PARTS
├── 06_RIG_CONTROL
├── 07_RIG_DEFORMATION
├── 08_SHAPE_KEYS
├── 09_MATERIALS
├── 10_TEXTURE_BAKE
├── 11_POSE_LIBRARY
├── 12_ANIMATION_LIBRARY
├── 13_EXPORT_HIGH
├── 14_EXPORT_MEDIUM
├── 15_EXPORT_LOW
└── 99_ARCHIVE
```

Objetos de referência devem permanecer ocultos para render e desabilitados para exportação.

---

## 9. Requisitos de geometria

### 9.1 Regras gerais

- Modelagem preferencialmente em quads nas regiões deformáveis.
- Triângulos podem existir quando controlados e afastados de articulações críticas.
- N-gons não podem chegar ao ativo final.
- Normais devem ser coerentes.
- Arestas duplicadas devem ser removidas.
- Vértices soltos devem ser removidos ou justificados.
- Faces internas invisíveis devem ser removidas quando não forem necessárias.
- Interseções devem ser avaliadas visualmente.
- A densidade deve acompanhar a importância visual da região.
- A silhueta possui prioridade sobre microdetalhes geométricos.

### 9.2 Regiões deformáveis críticas

Exigem loops anatômicos próprios:

- pescoço;
- mandíbula;
- ombros;
- axilas;
- cotovelos;
- antebraços;
- punhos;
- palmas;
- polegares;
- articulações dos dedos;
- coluna;
- quadris;
- virilha;
- joelhos;
- tornozelos;
- pés;
- dedos dos pés.

### 9.3 Elementos rígidos

Elementos rígidos devem:

- permanecer separados quando isso reduzir deformações;
- possuir parent ou peso integral claramente definido;
- não receber suavização cruzada desnecessária;
- manter volume e espessura durante todas as poses.

---

## 10. Rig de controle e rig de deformação

### 10.1 Rig de controle

O rig de controle é exclusivo do R2_Master.

Pode conter:

- IK;
- FK;
- alternância IK/FK;
- controles de coluna;
- controle de quadril;
- controles de mãos;
- controles de dedos;
- controles faciais;
- constraints;
- drivers;
- widgets;
- controles auxiliares;
- bones de mecânica.

O rig de controle não será exportado diretamente para o GLB.

### 10.2 Rig de deformação

O rig de deformação será a única estrutura óssea exportável.

Requisitos:

- hierarquia estável;
- nomes consistentes;
- escala uniforme;
- ausência de shear;
- ausência de transformações não resolvidas;
- bind pose documentada;
- apenas ossos necessários à deformação;
- deform bones claramente separados dos control bones;
- máximo projetado de 64 ossos de deformação no R2_Web;
- nenhum osso órfão;
- nenhum osso duplicado por acidente.

### 10.3 Convenção de nomes

```text
root
pelvis
spine_01
spine_02
chest
neck
head
clavicle.L
upper_arm.L
forearm.L
hand.L
clavicle.R
upper_arm.R
forearm.R
hand.R
thigh.L
shin.L
foot.L
toe.L
thigh.R
shin.R
foot.R
toe.R
```

Novos nomes devem seguir a mesma convenção de lateralidade `.L` e `.R`.

---

## 11. Pesos anatômicos

### 11.1 Regras obrigatórias

- Máximo de 4 influências por vértice no R2_Web.
- Pesos normalizados.
- Nenhum peso negativo.
- Nenhuma influência residual invisível.
- Nenhum lado esquerdo influenciado por osso direito sem justificativa.
- Nenhum lado direito influenciado por osso esquerdo sem justificativa.
- Peças rígidas devem usar influência integral quando adequado.
- Dedos devem ser tratados individualmente.
- Ombros não devem depender apenas do upper arm.
- Quadris não devem depender apenas da coxa.
- Pescoço e cabeça não devem contaminar clavículas.
- Polegares não devem controlar peças distantes.
- Pesos automáticos podem servir apenas como ponto inicial.

### 11.2 Aprovação

Uma região somente será aprovada quando:

- mantiver volume;
- não apresentar esmagamento;
- não apresentar estiramento visível;
- não produzir quinas artificiais;
- não gerar buracos;
- não gerar interpenetração grave;
- não movimentar componentes semanticamente incorretos.

---

## 12. Shape Keys corretivas

As Shape Keys não substituirão uma topologia correta.

Elas serão usadas para corrigir situações específicas, como:

- ombro elevado;
- braço projetado para frente;
- braço projetado para trás;
- braço acima da cabeça;
- cotovelo flexionado;
- punho flexionado;
- fechamento da mão;
- abertura do polegar;
- quadril flexionado;
- perna elevada;
- joelho flexionado;
- tornozelo flexionado;
- rotação do pescoço;
- inclinação da cabeça;
- compressão controlada do tronco.

Shape Keys controladas por drivers no R2_Master deverão ser convertidas para comportamento compatível com o runtime antes da exportação.

---

## 13. Sistema facial

O rosto precisa transmitir inteligência, força e simpatia.

O conjunto facial mínimo deverá contemplar:

- neutral;
- blink left;
- blink right;
- blink both;
- look left;
- look right;
- look up;
- look down;
- brow up;
- brow down;
- focused;
- concerned;
- friendly smile;
- confident smile;
- alert;
- thinking;
- speaking;
- mouth closed;
- mouth open;
- jaw open.

A implementação poderá combinar:

- Morph Targets;
- bones faciais;
- rotação dos olhos;
- materiais emissivos controlados;
- animações procedurais no Three.js.

A solução final será escolhida por qualidade visual, custo de runtime e compatibilidade de exportação.

---

## 14. Materiais

### 14.1 Fluxo oficial

O R2_Web utilizará materiais PBR metal/rough compatíveis com glTF.

Famílias previstas:

- pele;
- pelo;
- moletom;
- olhos;
- boca e dentes;
- detalhes tecnológicos;
- logotipos e patches.

### 14.2 Limites

- Evitar materiais duplicados.
- Evitar um material por componente.
- Reduzir mudanças de material.
- Usar atlas quando não prejudicar resolução.
- Extensões avançadas só serão usadas após teste de compatibilidade.
- Transparência será limitada a casos indispensáveis.
- Nenhum material dependerá de nodes exclusivos do Blender.

---

## 15. Pelo

O sistema de pelo do Blender não será exportado diretamente como solução principal do runtime.

A aparência de pelo deverá combinar:

- normal map;
- roughness;
- variação de base color;
- ambient occlusion;
- detalhe direcional;
- geometria controlada na silhueta;
- hair cards apenas onde forem visualmente necessárias.

O pelo não poderá transformar o personagem em plástico liso nem causar custo desproporcional.

A aprovação será visual em enquadramentos reais do GorilaOS.

---

## 16. UV e texturas

### 16.1 UV

O R2_Web deverá possuir UV Maps estáveis.

Requisitos:

- ausência de sobreposição acidental;
- sobreposição espelhada somente quando documentada;
- densidade de texel coerente;
- maior prioridade para rosto e mãos;
- padding suficiente entre ilhas;
- orientação consistente quando possível;
- nenhum UV degenerado;
- nenhum UV fora do espaço esperado sem justificativa.

### 16.2 Mapas previstos

- Base Color;
- Normal;
- Roughness;
- Metallic quando necessário;
- Ambient Occlusion;
- Emissive quando necessário.

### 16.3 Compressão

KTX2/Basis Universal é o destino preferencial para texturas de produção, condicionado à validação completa no Three.js.

PNG e JPEG poderão existir durante autoria e diagnóstico.

---

## 17. Orçamentos do R2_Web

Os limites abaixo são metas de engenharia do projeto, não garantias universais de desempenho.

### 17.1 R2_Web High

| Métrica | Limite |
|---|---:|
| Triângulos renderizados | 90.000 |
| Vértices após exportação | 120.000 |
| Ossos de deformação | 64 |
| Influências por vértice | 4 |
| Materiais | 6 |
| Draw calls do personagem | 8 |
| Resolução máxima por textura | 2.048 px |
| Payload de rede desejado | 15 MB |
| Payload de rede máximo | 20 MB |

### 17.2 R2_Web Medium

| Métrica | Limite |
|---|---:|
| Triângulos renderizados | 60.000 |
| Vértices após exportação | 85.000 |
| Ossos de deformação | 64 |
| Influências por vértice | 4 |
| Materiais | 5 |
| Draw calls do personagem | 6 |
| Resolução máxima por textura | 2.048 px |
| Payload de rede desejado | 10 MB |
| Payload de rede máximo | 12 MB |

### 17.3 R2_Web Low

| Métrica | Limite |
|---|---:|
| Triângulos renderizados | 35.000 |
| Vértices após exportação | 50.000 |
| Ossos de deformação | 64 |
| Influências por vértice | 4 |
| Materiais | 4 |
| Draw calls do personagem | 5 |
| Resolução máxima por textura | 1.024 px |
| Payload de rede desejado | 6 MB |
| Payload de rede máximo | 8 MB |

High, Medium e Low devem ser exportados como ativos separados para evitar carregar LODs desnecessários.

Os limites poderão ser ajustados somente com benchmark documentado e nova versão desta especificação.

---

## 18. Biblioteca mínima de poses

### 18.1 Poses técnicas

- bind pose;
- A-pose;
- T-pose;
- braços a 45 graus;
- braços a 90 graus;
- braços acima da cabeça;
- braços à frente;
- braços cruzados;
- cotovelos totalmente flexionados;
- punhos flexionados;
- mãos abertas;
- punhos fechados;
- polegares levantados;
- perna elevada;
- joelho flexionado;
- agachamento parcial;
- rotação máxima segura do pescoço;
- inclinação máxima segura da cabeça.

### 18.2 Poses de personalidade

- neutral;
- attentive;
- thinking;
- explaining;
- warning;
- confident;
- approving;
- celebrating;
- empathetic;
- focused.

---

## 19. Biblioteca mínima de animações

```text
R2_Idle_Default
R2_Idle_Attentive
R2_Idle_Thinking
R2_Greeting
R2_Speaking
R2_Listening
R2_Approve
R2_ThumbsUp
R2_Warning
R2_Concerned
R2_Explain
R2_Celebrate
R2_ReturnToIdle
```

Requisitos:

- início e fim controlados;
- loops sem salto;
- root motion somente quando explicitamente necessário;
- nomes estáveis;
- duração documentada;
- ausência de keyframes inúteis;
- curvas simplificadas sem perder qualidade;
- transições testadas no AnimationMixer;
- nenhuma dependência de constraint não exportada.

---

## 20. Exportação GLB

### 20.1 Conteúdo permitido

- meshes aprovadas;
- armature de deformação;
- skinning;
- Morph Targets necessários;
- materiais aprovados;
- texturas aprovadas;
- animações aprovadas;
- propriedades customizadas indispensáveis.

### 20.2 Conteúdo proibido

- câmeras de autoria;
- luzes de autoria;
- rig de controle;
- widgets;
- objetos de referência;
- proxies experimentais;
- malhas ocultas acidentais;
- materiais de teste;
- ações descartadas;
- bones auxiliares não utilizados;
- bibliotecas externas quebradas.

### 20.3 Configuração

- formato GLB;
- glTF 2.0;
- exportação de objetos selecionados;
- Y-Up conforme o formato;
- UVs;
- normais;
- tangentes quando necessárias;
- skinning;
- Morph Targets aprovados;
- animações aprovadas;
- nenhuma aplicação destrutiva na fonte principal.

### 20.4 Compressão

A ordem preferencial de avaliação será:

1. GLB sem compressão para diagnóstico;
2. Meshopt para geometria;
3. KTX2 para texturas;
4. Draco apenas se demonstrar vantagem no caso real;
5. comparação visual e de carregamento;
6. seleção baseada em benchmark.

Nenhuma compressão será aprovada se introduzir defeitos visuais.

---

## 21. Validação técnica

Cada candidato a R2_Web deverá passar por:

- glTF Validator;
- verificação de erros e warnings;
- inspeção da hierarquia;
- contagem de triângulos;
- contagem de vértices após exportação;
- contagem de materiais;
- contagem de draw calls;
- contagem de ossos;
- máximo de influências por vértice;
- verificação de Morph Targets;
- verificação dos Animation Clips;
- verificação de texturas;
- verificação de caminhos externos;
- verificação de escala;
- verificação de bounding box;
- carregamento real pelo GLTFLoader;
- descarte e liberação correta de recursos.

O GLB final deverá possuir zero erros de especificação.

Warnings deverão ser explicados e aprovados individualmente.

---

## 22. Validação visual

A aprovação visual é obrigatória.

Cada versão deverá ser avaliada em:

- frente;
- costas;
- lado esquerdo;
- lado direito;
- três quartos frontal;
- três quartos traseiro;
- close do rosto;
- close das mãos;
- pose neutra;
- poses técnicas;
- poses de personalidade;
- animações em movimento;
- enquadramento real do dashboard;
- fundo claro;
- fundo escuro.

Itens observados:

- silhueta;
- proporção;
- volume;
- deformação;
- leitura facial;
- aparência do pelo;
- tecido;
- mãos;
- olhos;
- identidade da marca;
- interpenetrações;
- tremulação;
- sombras;
- artefatos de compressão.

Métricas aprovadas não anulam reprovação visual.

---

## 23. Validação de desempenho

### 23.1 Desktop

Meta:

- experiência estável no dashboard;
- preferência por 55 FPS ou mais após aquecimento;
- ausência de pausas graves durante troca de animação;
- carregamento sem bloquear a interface;
- memória liberada ao desmontar o componente.

### 23.2 Mobile

Meta:

- mínimo operacional de 30 FPS na versão apropriada;
- uso automático do R2_Web Low quando necessário;
- redução de texturas;
- redução de animações simultâneas;
- ausência de travamentos;
- fallback visual quando WebGL ou recursos necessários falharem.

O desempenho será medido na aplicação real, não apenas no Blender.

---

## 24. Integração com o GorilaOS

O runtime deverá permitir:

- carregamento assíncrono;
- estado de loading;
- fallback estático;
- tratamento de erro;
- seleção de qualidade;
- controle de mood;
- controle de Animation Clips;
- transição entre estados;
- sincronização com o comportamento do R2;
- pausa quando fora de visão;
- descarte de geometria;
- descarte de materiais;
- descarte de texturas;
- prevenção de múltiplas instâncias desnecessárias.

Estados previstos:

```text
idle
attentive
thinking
speaking
approving
warning
concerned
celebrating
error
offline
```

---

## 25. Sequência oficial de produção

1. Auditoria read-only.
2. Especificação R2 AAA-Web.
3. Atlas semântico das 110 ilhas.
4. Classificação PRESERVE, RETOPOLOGY, REBUILD e RIGID.
5. Separação lógica.
6. Retopologia das articulações.
7. Construção do novo rig de controle.
8. Construção do rig de deformação.
9. Pesos anatômicos por região.
10. Shape Keys corretivas.
11. Sistema facial.
12. Materiais e pelo.
13. UV e texturas.
14. Biblioteca completa de poses.
15. Biblioteca de animações.
16. Criação dos níveis High, Medium e Low.
17. Exportação GLB.
18. Validação glTF.
19. Integração Three.js.
20. Benchmark.
21. Aprovação visual final.

Nenhuma fase deve saltar silenciosamente a fase anterior.

---

## 26. Critérios de reprovação imediata

Uma versão será reprovada quando apresentar:

- deformação grave;
- alteração indevida da identidade visual;
- perda importante de silhueta;
- colapso de articulação;
- mão ou dedo quebrado;
- olho deslocado;
- componente rígido deformando;
- peso cruzado sem justificativa;
- interpenetração grave;
- arquivos-fonte sobrescritos;
- exportação sem rastreabilidade;
- erro do glTF Validator;
- dependência externa quebrada;
- falha de carregamento;
- vazamento significativo de recursos;
- desempenho abaixo do mínimo sem fallback;
- aprovação baseada apenas em métricas.

---

## 27. Definition of Done

O GorilaR2 AAA-Web somente será considerado pronto quando:

- o R2_Master estiver organizado e versionado;
- as 110 ilhas estiverem semanticamente identificadas;
- cada componente possuir classificação;
- articulações críticas possuírem topologia adequada;
- rig de controle e deformação estiverem separados;
- pesos anatômicos estiverem aprovados;
- Shape Keys corretivas estiverem aprovadas;
- sistema facial estiver funcional;
- materiais estiverem compatíveis com glTF;
- pelo estiver visualmente convincente;
- poses técnicas estiverem aprovadas;
- animações estiverem aprovadas;
- R2_Web High, Medium e Low estiverem disponíveis;
- GLBs possuírem zero erros de especificação;
- integração Three.js estiver funcional;
- benchmark desktop estiver aprovado;
- benchmark mobile estiver aprovado;
- comparação visual estiver aprovada;
- nenhum arquivo histórico tiver sido sobrescrito.

---

## 28. Regra final

Qualidade AAA-Web não significa apenas alta contagem de polígonos.

Neste projeto, qualidade AAA-Web significa:

- identidade visual preservada;
- silhueta forte;
- anatomia convincente;
- deformação controlada;
- expressão clara;
- materiais consistentes;
- animação com personalidade;
- desempenho adequado ao navegador;
- pipeline rastreável;
- validação técnica;
- aprovação visual humana.

Nenhuma métrica isolada poderá declarar o GorilaR2 pronto.
