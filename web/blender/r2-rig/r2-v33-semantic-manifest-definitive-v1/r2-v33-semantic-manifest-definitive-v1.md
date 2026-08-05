# R2 AAA-Web — Manifesto Semântico Definitivo v1

## Resultado

- Componentes classificados: **110/110**
- Componentes pendentes: **0**
- Resíduos marcados para remoção: **17**
- Arquivo-base alterado: **não**

## Decisões por ação

| Ação | Componentes |
|---|---:|
| RETOPOLOGY | 48 |
| REBUILD | 43 |
| RIGID | 2 |
| DELETE | 17 |

## Risco técnico

| Risco | Componentes |
|---|---:|
| CRITICAL | 24 |
| HIGH | 63 |
| MEDIUM | 4 |
| LOW | 19 |

## Resíduos aprovados para remoção

`C025`, `C040`, `C041`, `C043`, `C055`, `C056`, `C060`, `C071`, `C072`, `C083`, `C084`, `C088`, `C090`, `C092`, `C099`, `C101`, `C102`

## Como as correções serão executadas

1. Criar uma nova cópia de trabalho; o v13 permanece intocado.
2. Remover somente os 17 resíduos classificados como DELETE.
3. Separar os conjuntos lógicos de roupa, cabeça, mãos, calçados e acessórios.
4. Executar retopologia nas articulações, roupa, mãos e rosto.
5. Reconstruir as cascas fragmentadas de pelo, bolsos, mãos e cordões.
6. Criar rig de deformação e controles profissionais.
7. Refazer pesos anatômicos e eliminar contaminações entre regiões.
8. Criar shape keys corretivas para face, ombros, axilas, cotovelos, virilha e joelhos.
9. Validar visualmente em poses extremas antes de aprovar cada etapa.

## Regra de governança

Nenhuma decisão deste manifesto altera automaticamente o modelo. As correções serão aplicadas somente em novas versões, com validação técnica e visual.

## Componentes

| ID | Nome semântico | Região | Ação | Risco | Confiança |
|---|---|---|---|---|---:|
| C000 | Painel externo traseiro esquerdo do capuz | HOOD | RETOPOLOGY | HIGH | 90% |
| C001 | Inserto central traseiro do capuz | HOOD | RETOPOLOGY | HIGH | 82% |
| C002 | Painel lateral direito do capuz | HOOD | RETOPOLOGY | HIGH | 88% |
| C003 | Casco traseiro esquerdo do moletom, incluindo transição para a manga | HOODIE_TORSO | RETOPOLOGY | HIGH | 94% |
| C004 | Painel central traseiro do tronco do moletom | HOODIE_TORSO | RETOPOLOGY | HIGH | 87% |
| C005 | Painel do ombro e manga superior direita do moletom | HOODIE_TORSO | RETOPOLOGY | HIGH | 93% |
| C006 | Painel traseiro da calça na coxa direita | PANTS | RETOPOLOGY | HIGH | 94% |
| C007 | Painel traseiro esquerdo do quadril e assento da calça | PANTS | RETOPOLOGY | HIGH | 92% |
| C008 | Faixa traseira direita da cintura e quadril da calça | PANTS | RETOPOLOGY | HIGH | 84% |
| C009 | Camada interna central de pelo da nuca e base posterior da cabeça, escondida pelo capuz | HEAD_NECK_FUR | REBUILD | HIGH | 88% |
| C010 | Painel traseiro e superior da manga direita | SLEEVE_RIGHT | RETOPOLOGY | HIGH | 96% |
| C011 | Painel esquerdo de transição entre capuz, pescoço e ombro | HOOD | RETOPOLOGY | HIGH | 91% |
| C012 | Painel direito de transição entre capuz, pescoço e ombro | HOOD | RETOPOLOGY | HIGH | 92% |
| C013 | Inserto central de pelo da parte posterior do crânio, sob o capuz | HEAD_NECK_FUR | REBUILD | HIGH | 91% |
| C014 | Inserto esquerdo de pelo da lateral posterior da cabeça, próximo à orelha | HEAD_NECK_FUR | REBUILD | HIGH | 93% |
| C015 | Camada externa de pelo do topo traseiro direito da cabeça | HEAD_NECK_FUR | REBUILD | HIGH | 82% |
| C016 | Cabedal e estrutura superior do calçado direito | SHOE_RIGHT | RETOPOLOGY | HIGH | 93% |
| C017 | Sola e base inferior do calçado direito | SHOE_RIGHT | RIGID | LOW | 96% |
| C018 | Camada central superior de pelo da cabeça | HEAD_NECK_FUR | REBUILD | HIGH | 79% |
| C019 | Painel da calça na canela direita | PANTS | RETOPOLOGY | HIGH | 97% |
| C020 | Faixa central traseira de pelo da cabeça | HEAD_NECK_FUR | REBUILD | HIGH | 94% |
| C021 | Casco traseiro e externo do calçado esquerdo, incluindo tornozelo | SHOE_LEFT | RETOPOLOGY | HIGH | 88% |
| C022 | Casco frontal e interno do calçado esquerdo, incluindo ponta do pé | SHOE_LEFT | RETOPOLOGY | HIGH | 89% |
| C023 | Painel da calça na canela esquerda | PANTS | RETOPOLOGY | HIGH | 97% |
| C024 | Camada de pelo da lateral direita da cabeça e face | HEAD_NECK_FUR | REBUILD | HIGH | 96% |
| C025 | Triângulo residual solto na região da cabeça | RESIDUAL | DELETE | LOW | 99% |
| C026 | Painel interno e frontal da coxa esquerda, atravessando a virilha | PANTS | RETOPOLOGY | HIGH | 95% |
| C027 | Painel externo da coxa esquerda | PANTS | RETOPOLOGY | HIGH | 96% |
| C028 | Pequena aba lateral direita da barra do moletom, junto à cintura | HOODIE_TORSO | REBUILD | HIGH | 92% |
| C029 | Painel frontal esquerdo da calça, da cintura à coxa | PANTS | RETOPOLOGY | HIGH | 91% |
| C030 | Painel lateral direito do moletom, da axila à cintura | HOODIE_TORSO | RETOPOLOGY | HIGH | 94% |
| C031 | Painel frontal superior da manga direita e ombro | SLEEVE_RIGHT | RETOPOLOGY | HIGH | 94% |
| C032 | Painel lateral externo da perna esquerda, atravessando joelho e canela | PANTS | RETOPOLOGY | HIGH | 88% |
| C033 | Painel frontal e interno da perna esquerda, atravessando joelho e canela | PANTS | RETOPOLOGY | HIGH | 86% |
| C034 | Tufo interno de pelo da lateral direita da nuca e pescoço, dentro do capuz | HEAD_NECK_FUR | REBUILD | HIGH | 95% |
| C035 | Casco principal da manga direita, do ombro ao antebraço | SLEEVE_RIGHT | RETOPOLOGY | HIGH | 98% |
| C036 | Painel traseiro e interno da manga direita | SLEEVE_RIGHT | RETOPOLOGY | HIGH | 93% |
| C037 | Painel frontal da perna direita, atravessando joelho e canela | PANTS | RETOPOLOGY | HIGH | 91% |
| C038 | Painel lateral e traseiro da perna direita, atravessando joelho e canela | PANTS | RETOPOLOGY | HIGH | 89% |
| C039 | Painel curvo da calça sobre o joelho direito | PANTS | RETOPOLOGY | HIGH | 94% |
| C040 | Triângulo residual solto na cabeça | RESIDUAL | DELETE | LOW | 99% |
| C041 | Triângulo residual solto no braço direito | RESIDUAL | DELETE | LOW | 99% |
| C042 | Painel frontal e lateral esquerdo do moletom, entre peito e cintura | HOODIE_TORSO | RETOPOLOGY | HIGH | 96% |
| C043 | Triângulo residual solto na cabeça | RESIDUAL | DELETE | LOW | 99% |
| C044 | Painel externo do bolso e quadril direito da calça | PANTS | REBUILD | HIGH | 88% |
| C045 | Painel principal externo da manga esquerda | SLEEVE_LEFT | RETOPOLOGY | HIGH | 97% |
| C046 | Painel interno e frontal da manga esquerda | SLEEVE_LEFT | RETOPOLOGY | HIGH | 95% |
| C047 | Inserto da axila esquerda, ligando manga e tronco | SLEEVE_LEFT | RETOPOLOGY | HIGH | 94% |
| C048 | Painel frontal e interno da coxa direita, atravessando a virilha | PANTS | RETOPOLOGY | HIGH | 97% |
| C049 | Faixa externa da manga no antebraço direito | SLEEVE_RIGHT | RETOPOLOGY | HIGH | 91% |
| C050 | Camada externa de pelo do punho e antebraço esquerdo | HAND_LEFT | REBUILD | CRITICAL | 92% |
| C051 | Painel ou bolso externo da coxa direita | PANTS | REBUILD | HIGH | 87% |
| C052 | Painel frontal direito do capuz, gola e ombro | HOOD | RETOPOLOGY | HIGH | 96% |
| C053 | Mão direita completa, incluindo palma e dedos | HAND_RIGHT | RETOPOLOGY | CRITICAL | 99% |
| C054 | Faixa inferior de pelo da mandíbula e pescoço | HEAD_NECK_FUR | REBUILD | HIGH | 88% |
| C055 | Fragmento residual oculto na costura interna da axila esquerda | RESIDUAL | DELETE | LOW | 98% |
| C056 | Triângulo residual solto no tronco | RESIDUAL | DELETE | LOW | 99% |
| C057 | Tufo de pelo da transição esquerda entre mandíbula, pescoço e clavícula | HEAD_NECK_FUR | REBUILD | HIGH | 97% |
| C058 | Camada externa de pelo do punho e antebraço direito | HAND_RIGHT | REBUILD | CRITICAL | 94% |
| C059 | Mão esquerda completa, incluindo palma e dedos | HAND_LEFT | RETOPOLOGY | CRITICAL | 99% |
| C060 | Triângulo residual solto na perna direita | RESIDUAL | DELETE | LOW | 99% |
| C061 | Painel lateral direito inferior do moletom, entre abdômen e cintura | HOODIE_TORSO | RETOPOLOGY | HIGH | 95% |
| C062 | Camada externa de pelo no dorso da mão e punho direito | HAND_RIGHT | REBUILD | CRITICAL | 90% |
| C063 | Faixa de pelo na transição entre punho e polegar direito | HAND_RIGHT | REBUILD | CRITICAL | 85% |
| C064 | Pequeno acabamento do bolso lateral direito da calça | PANTS | REBUILD | HIGH | 82% |
| C065 | Faixa de pelo frontal da gola e clavícula esquerda | HEAD_NECK_FUR | REBUILD | HIGH | 92% |
| C066 | Faixa de pelo sob o punho direito, na transição entre antebraço e mão | HAND_RIGHT | REBUILD | CRITICAL | 97% |
| C067 | Camada triangular de pelo do braço superior direito | ARM_FUR_RIGHT | REBUILD | HIGH | 90% |
| C068 | Painel frontal superior esquerdo do moletom, ligando peito e ombro | HOODIE_TORSO | RETOPOLOGY | HIGH | 94% |
| C069 | Camada dorsal de pele e pelo da base do polegar direito | HAND_RIGHT | REBUILD | CRITICAL | 98% |
| C070 | Camada palmar de pele e pelo da base do polegar direito | HAND_RIGHT | REBUILD | CRITICAL | 98% |
| C071 | Triângulo residual solto no braço esquerdo | RESIDUAL | DELETE | LOW | 99% |
| C072 | Triângulo residual solto no pé esquerdo | RESIDUAL | DELETE | LOW | 99% |
| C073 | Sola e base inferior do calçado esquerdo | SHOE_LEFT | RIGID | LOW | 97% |
| C074 | Microcamada lateral de pele e pelo da articulação inicial do polegar direito | HAND_RIGHT | REBUILD | CRITICAL | 94% |
| C075 | Painel frontal esquerdo do peito e abdômen superior do moletom | HOODIE_TORSO | RETOPOLOGY | HIGH | 96% |
| C076 | Faixa frontal direita da cintura e transição entre moletom e calça | PANTS | RETOPOLOGY | HIGH | 91% |
| C077 | Painel frontal superior direito do moletom, peito, ombro e axila | HOODIE_TORSO | RETOPOLOGY | HIGH | 98% |
| C078 | Camada externa dos dedos e dorso da mão direita | HAND_RIGHT | REBUILD | CRITICAL | 93% |
| C079 | Camada externa dos dedos e dorso da mão esquerda | HAND_LEFT | REBUILD | CRITICAL | 93% |
| C080 | Painel frontal central da barra inferior do moletom, sobre a virilha | HOODIE_TORSO | RETOPOLOGY | HIGH | 88% |
| C081 | Camada externa do polegar esquerdo e transição para o punho | HAND_LEFT | REBUILD | CRITICAL | 91% |
| C082 | Camada externa de pelo da mão e punho direito, incorretamente pesada na coxa | HAND_RIGHT | REBUILD | CRITICAL | 94% |
| C083 | Fragmento residual do polegar esquerdo | RESIDUAL | DELETE | LOW | 97% |
| C084 | Fragmento poligonal residual do polegar esquerdo | RESIDUAL | DELETE | LOW | 98% |
| C085 | Camada de pelo da gola, clavícula e lateral direita do pescoço | HEAD_NECK_FUR | REBUILD | HIGH | 94% |
| C086 | Casco principal frontal da face, focinho e mandíbula | FACE | RETOPOLOGY | CRITICAL | 99% |
| C087 | Camada externa da mão esquerda e dos dedos | HAND_LEFT | REBUILD | CRITICAL | 96% |
| C088 | Triângulo residual do polegar esquerdo | RESIDUAL | DELETE | LOW | 99% |
| C089 | Pele da base entre polegar e indicador direitos | HAND_RIGHT | RETOPOLOGY | CRITICAL | 96% |
| C090 | Triângulo residual entre os dedos médio e indicador esquerdos | RESIDUAL | DELETE | LOW | 99% |
| C091 | Grande camada externa da mão direita, envolvendo palma, dedos e polegar | HAND_RIGHT | REBUILD | CRITICAL | 98% |
| C092 | Triângulo residual solto no antebraço direito | RESIDUAL | DELETE | LOW | 99% |
| C093 | Faixa vertical de pelo da lateral esquerda do pescoço e mandíbula | HEAD_NECK_FUR | REBUILD | HIGH | 91% |
| C094 | Faixa vertical de pelo da lateral direita do pescoço e mandíbula | HEAD_NECK_FUR | REBUILD | HIGH | 92% |
| C095 | Camada externa distal do polegar esquerdo | HAND_LEFT | REBUILD | CRITICAL | 82% |
| C096 | Camada externa proximal e base do polegar esquerdo | HAND_LEFT | REBUILD | CRITICAL | 86% |
| C097 | Fragmento de pele entre polegar e indicador direitos | HAND_RIGHT | REBUILD | CRITICAL | 88% |
| C098 | Segunda camada da base entre polegar e indicador direitos | HAND_RIGHT | REBUILD | CRITICAL | 90% |
| C099 | Triângulo residual solto no indicador esquerdo | RESIDUAL | DELETE | LOW | 99% |
| C100 | Pequena placa de unha ou garra do indicador esquerdo | HAND_LEFT | REBUILD | CRITICAL | 74% |
| C101 | Fragmento plano residual na região da cabeça | RESIDUAL | DELETE | LOW | 97% |
| C102 | Triângulo residual solto no antebraço esquerdo | RESIDUAL | DELETE | LOW | 99% |
| C103 | Camada externa da base e lateral do polegar esquerdo | HAND_LEFT | REBUILD | CRITICAL | 96% |
| C104 | Painel central frontal esquerdo do moletom, peito e abdômen | HOODIE_TORSO | RETOPOLOGY | HIGH | 94% |
| C105 | Painel central frontal direito do moletom, peito e abdômen | HOODIE_TORSO | RETOPOLOGY | HIGH | 93% |
| C106 | Segmento inferior do cordão direito do capuz | HOOD_ACCESSORY_RIGHT | REBUILD | MEDIUM | 82% |
| C107 | Segmento inferior do cordão esquerdo do capuz | HOOD_ACCESSORY_LEFT | REBUILD | MEDIUM | 84% |
| C108 | Ponteira do cordão direito do capuz | HOOD_ACCESSORY_RIGHT | REBUILD | MEDIUM | 91% |
| C109 | Ponteira do cordão esquerdo do capuz | HOOD_ACCESSORY_LEFT | REBUILD | MEDIUM | 92% |
