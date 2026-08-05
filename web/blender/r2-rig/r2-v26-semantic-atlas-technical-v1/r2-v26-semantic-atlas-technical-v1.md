# r2-v26-semantic-atlas-technical-v1

## Status

**Tipo:** atlas técnico read-only  
**Classificação semântica:** ainda não executada  
**Fonte:** `r2-rig-v13-weights-refined.blend`  
**SHA-256 da fonte:** `392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1`  
**Blender:** 4.5.10 LTS

Este pacote registra os 110 componentes conectados com IDs estáveis.
Os campos semânticos permanecem vazios de propósito e só serão
preenchidos após inspeção visual individual.

## Resumo

| Métrica | Valor |
|---|---:|
| Componentes | 110 |
| Vértices | 197505 |
| Arestas | 573879 |
| Faces | 376007 |
| Triângulos derivados | 376007 |
| Vértices com mais de 4 influências | 0 |
| Vértices sem peso | 0 |
| Vértices com soma de pesos divergente | 0 |
| Componentes com alerta de peso cruzado | 0 |

## Método de identificação

O `component_id` é determinado pela descoberta de componentes
conectados em ordem crescente do menor índice de vértice.
A `stable_key` combina o ID com o menor índice de vértice.

A lateralidade é geométrica e provisória:

- X positivo: LEFT;
- X negativo: RIGHT;
- limites atravessando X=0: CENTER.

Ela não substitui a identificação visual.

## 20 maiores componentes por vértices

| ID | Stable key | Lado provisório | Vértices | Faces | Grupos dominantes |
|---:|---|---|---:|---:|---|
| 3 | `C003-V002278` | CENTER | 11724 | 22878 | upper_arm.L:3560.307967|spine_02:3555.856382|chest:3528.000155|forearm.L:882.167407|clavicle.L:197.668086 |
| 35 | `C035-V047387` | RIGHT | 6623 | 12802 | forearm.R:3864.107652|upper_arm.R:2176.733466|chest:339.896327|spine_02:132.158185|clavicle.R:110.104428 |
| 26 | `C026-V035853` | CENTER | 6251 | 12068 | thigh.L:5336.240770|pelvis:910.549155|spine_01:4.210072 |
| 16 | `C016-V025517` | RIGHT | 6237 | 12025 | foot.R:3476.619888|shin.R:2419.716120|toe.R:340.664000 |
| 24 | `C024-V031619` | RIGHT | 6043 | 11569 | head:6026.393809|neck:16.606189 |
| 53 | `C053-V074931` | RIGHT | 5654 | 10866 | forearm.R:2311.925071|pinky_01.R:764.374219|pinky_02.R:575.828478|thumb_02.R:501.055570|index_01.R:438.905159|pinky_03.R:431.077241|hand.R:339.099931|thumb_01.R:199.486018 |
| 0 | `C000-V000000` | CENTER | 5639 | 10896 | head:2354.746516|clavicle.L:1641.841698|upper_arm.L:916.217868|neck:392.055836|chest:242.070202|spine_02:92.067884 |
| 59 | `C059-V089359` | LEFT | 5347 | 10236 | forearm.L:1876.182740|pinky_01.L:692.959405|pinky_03.L:530.977589|hand.L:489.665028|pinky_02.L:489.616354|thumb_02.L:447.031276|index_01.L:347.977397|thumb_01.L:149.865136 |
| 48 | `C048-V068836` | CENTER | 5289 | 10194 | thigh.R:3499.727584|spine_01:850.086090|pelvis:735.019458|spine_02:204.166883 |
| 4 | `C004-V002555` | CENTER | 5100 | 9856 | spine_02:3005.916606|chest:2044.885540|clavicle.R:44.248128|upper_arm.R:4.949726 |
| 22 | `C022-V028563` | LEFT | 4915 | 9452 | foot.L:3426.866025|shin.L:1059.840978|toe.L:428.292999 |
| 21 | `C021-V028545` | LEFT | 4756 | 9134 | foot.L:2947.435258|shin.L:1808.564761 |
| 17 | `C017-V025520` | RIGHT | 4674 | 9046 | foot.R:4051.113333|toe.R:417.888000|shin.R:204.998669 |
| 20 | `C020-V028460` | CENTER | 4604 | 8824 | head:4604.000000 |
| 7 | `C007-V010972` | CENTER | 4587 | 8837 | thigh.L:1814.228970|spine_01:1662.207690|spine_02:839.015506|pelvis:269.594332|thumb_01.L:1.953503 |
| 29 | `C029-V039824` | LEFT | 4347 | 8302 | thigh.L:2635.759714|spine_02:945.551331|spine_01:765.476744|index_03.L:0.212216 |
| 19 | `C019-V027428` | RIGHT | 4201 | 8084 | shin.R:3458.660815|thigh.R:742.339188 |
| 45 | `C045-V059882` | LEFT | 4025 | 7711 | forearm.L:2304.970225|upper_arm.L:953.269350|chest:429.545565|clavicle.L:170.176140|spine_02:167.038735 |
| 23 | `C023-V028676` | LEFT | 4018 | 7704 | shin.L:3392.815143|thigh.L:625.184858 |
| 11 | `C011-V018149` | LEFT | 4015 | 7678 | clavicle.L:1564.161203|upper_arm.L:1290.693462|head:993.527701|neck:97.720775|chest:49.608348|spine_02:19.288512 |

## Componentes com flags técnicas

Total: **47** de **110**.

As flags são sinais para inspeção. Elas não definem a ação
`PRESERVE`, `RETOPOLOGY`, `REBUILD` ou `RIGID`.

## Próxima etapa

Gerar pranchas visuais numeradas dos 110 componentes e preencher
o nome semântico, a região, a família de material, o tipo de
deformação, o risco e a ação recomendada.
