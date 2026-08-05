# R2 Retopology Autonomous Pipeline Final Report

## Resultado executivo

- `ExecutionStatus=COMPLETED`
- `TechnicalVerdict=APROVADO`
- `RetopologySequenceComplete=True`
- `NoFurtherSafeCandidate=True`
- Versão oficial final: **V57**
- Blend oficial: `C:\Projetos\consorcio-os\web\blender\r2-rig\r2-v57-negative-x-middle-mid-depth-retopology-v1\r2-rig-v57-negative-x-middle-mid-depth-retopology-v1.blend`
- SHA-256: `63F7F71988B171A37DF9A09EC8F957729DEF6D35E2D0C093A73577702F892752`
- Versões oficiais aprovadas: 18 (`V40`–`V57`)
- Regiões tratadas: 17 (`V41`–`V57`)
- Próxima fase: `HEAD_CONSOLIDATION_AND_RIG_PREPARATION`

## 1–4. Versão final e versões criadas nesta execução

O pipeline partiu da V56 congelada e criou somente a **V57**. A candidata V58 foi analisada, certificada e testada em runtime, porém rejeitada antes da publicação. Nenhuma versão oficial foi sobrescrita e nenhum número foi pulado.

## 5. Certificados

| Versão | CertificateSHA256 |
|---|---|
| V41 | `78D2C46923463B71D0A8F98BDB0498E99BB8AFBFB8819117032CFC3DC30DFEF9` |
| V42 | `1D465B23325EEC346DF80CFA9F7DE0D5C90C57A8C331E0D81B86F3C4A5423293` |
| V43 | `C4230A2AFF0409F6EDD2C0CF9CE1E1E46C674ED28C388B547C5E0BA1EA9240C3` |
| V44 | `CC4B8B697AA0F12E6C80300834F20583FE0155AE014F6C4F71931763F778104F` |
| V45 | `8ABE1B4C9D342E7265C0A6AB6165844B2D377EFEC5FB9BB5736B6A46E149175D` |
| V46 | `FB1D86A05F80354D47AEF1ECCAF38DE0B550AAC5EB98EC0936E481F3066D4F91` |
| V47 | `7AF3EDB58E6F264C516448AB74247E8B764E5241198182D25DADAEF01C8BBD4D` |
| V48 | `4471A2E53831FDC49ACB3D67F86578F8F4F691A5B40C9D1D16C3C3F17BA7723B` |
| V49 | `352F30CE4083F5ECF27DDD30BC04B031BA9422FE0A6E74434EFD6E339B3FCC73` |
| V50 | `C2A806BA227677094A6F1EF89350EE359FACCC14597EB8349616A5E420B0335D` |
| V51 | `28D1F975D533859065182CCE8D0AA9EEEF48A2982D2CA447FF0E2BC1F9A13FBB` |
| V52 | `2817F14960D179E770E2FB904B4ABFF9BB249DD487D5EE84F1E4CA57717CECF9` |
| V53 | `1C9E85F92FDADB404AC8955F70041746287F85E36660793F3EA699F3047E4CBD` |
| V54 | `A06D99BC26D6F32D2DEA1E748863E164FD7AF788FBA869040E625770E8DAEA6C` |
| V55 | `5D2F5654268FF1506B34C924CB5ECC15C61A3AB4A43DA9CE3BA9160ADB30EB67` |
| V56 | `0EAF9F46BE19E0E720CF362A40B9EFC9B7EBB13EEA21F0B5F3735F90D9C4F043` |
| V57 | `9A60D374659F7383911397DC8C928BD7FE64736940FAB0C5C5B0EA567ADB2A5A` |

O certificado read-only V58 (`AAB88D5B1291A3B2BA7419D6A5BA0689BB4BC01CEB64DB592C8E53FA841E6260`) é evidência diagnóstica de encerramento, não certificado de uma versão publicada.

## 6. Regiões tratadas

| Versão | Região |
|---|---|
| V41 | `CENTER_LOWER_FRONT` |
| V42 | `POSITIVE_X_LOWER_BACK` |
| V43 | `POSITIVE_X_LOWER_BACK` |
| V44 | `POSITIVE_X_LOWER_BACK` |
| V45 | `NEGATIVE_X_UPPER_BACK` |
| V46 | `POSITIVE_X_LOWER_MID_DEPTH` |
| V47 | `CENTER_UPPER_BACK` |
| V48 | `POSITIVE_X_LOWER_MID_DEPTH` |
| V49 | `POSITIVE_X_MIDDLE_MID_DEPTH` |
| V50 | `POSITIVE_X_LOWER_FRONT` |
| V51 | `POSITIVE_X_LOWER_MID_DEPTH` |
| V52 | `POSITIVE_X_LOWER_MID_DEPTH` |
| V53 | `NEGATIVE_X_UPPER_BACK` |
| V54 | `POSITIVE_X_LOWER_FRONT` |
| V55 | `NEGATIVE_X_UPPER_BACK` |
| V56 | `NEGATIVE_X_UPPER_BACK` — continuação imediata com 14 faces de sobreposição de linhagem |
| V57 | `NEGATIVE_X_MIDDLE_MID_DEPTH` — sobreposição histórica zero |

A região certificada para V58 (`NEGATIVE_X_LOWER_MID_DEPTH`) não integra a lista tratada, pois nenhum build passou nos gates e nada foi publicado.

## 7–9. Candidatos, reduções e métricas

| Versão | Candidato aprovado | Redução local |
|---|---|---:|
| V41 | `DISSOLVE_25` | 41.007194% |
| V42 | `DISSOLVE_15` | 25.000000% |
| V43 | `DISSOLVE_35` | 28.070175% |
| V44 | `DISSOLVE_25` | 16.176471% |
| V45 | `DISSOLVE_15` | 77.500000% |
| V46 | `DISSOLVE_15` | 18.965517% |
| V47 | `DISSOLVE_25` | 34.375000% |
| V48 | `DISSOLVE_15` | 15.094340% |
| V49 | `DISSOLVE_15` | 42.622951% |
| V50 | `DISSOLVE_15` | 66.666667% |
| V51 | `DISSOLVE_15` | 21.428571% |
| V52 | `DISSOLVE_35` | 26.315789% |
| V53 | `DISSOLVE_15` | 18.518519% |
| V54 | `DISSOLVE_15` | 24.324324% |
| V55 | `DISSOLVE_15` | 66.666667% |
| V56 | `DISSOLVE_15` | 73.333333% |
| V57 | `DISSOLVE_INTERNAL_1705` | 50.000000% (6 → 3 faces; 1 vértice removido) |

Na V57, o aspecto p95 melhorou de `4.007413678708593` para `3.828369661898109`, e a normal p05 melhorou de `0.7459831098094583` para `0.9279118590056896`. A triangulação e as métricas foram obtidas no Blender 4.5.10 LTS.

Na V58 rejeitada: `DISSOLVE_INTERNAL_1522` reduziu 14.285714%, mas piorou aspecto (`3.406521 → 4.324827`) e normal (`0.688335 → 0.596193`); `DISSOLVE_INTERNAL_1642` melhorou qualidade, porém reduziu apenas 7.142857%, abaixo do gate de 10%; a combinação reduziu 28.571429%, mas piorou aspecto para `5.779130`; todos os pares de arestas internas reduziram 0% e alguns degradaram a qualidade ou introduziram uma face invertida.

## 10. Auditorias

- Certificado V57 revalidado por pacote real: `COMPLETED/APROVADO`, hashes e topologia certificados.
- Build V57 transacional: `BuildApproved=True`, `IndependentAuditApproved=True`, `BlendPublished=True`, `FailedGates=NONE`.
- Auditoria final read-only V57: `V57IntegrityConfirmed=True`, V56 e V57 abertas separadamente e inalteradas durante a auditoria, `CreatedBlends=0`, `CreatedImages=0`, `VisualValidationRequired=False`.
- Prioridade e certificado V58: runtime concluído com sobreposição histórica zero e subconjunto seguro de 14 faces.
- Build V58: nenhum candidato aprovado; a pasta oficial V58 não foi criada.

## 11–21. Gates de preservação e integridade

Na V57 publicada e em sua auditoria final independente:

- geometria externa preservada exatamente;
- pesos sobreviventes preservados exatamente;
- atributos das faces preservadas exatamente;
- slots de materiais preservados exatamente;
- nomes dos vertex groups preservados exatamente;
- propriedades customizadas herdadas preservadas exatamente;
- `WireEdges=0`;
- `InvalidNonManifold=0`;
- `ConnectedIslands=1`;
- `UnweightedVertices=0`;
- `InvertedFaces=0`;
- V40–V57 re-hashadas ao final; todos os hashes oficiais conferem e as bases anteriores permanecem byte a byte intactas;
- `CreatedImages=0`; não houve render, preview nem exigência de validação visual;
- nenhum arquivo foi colocado em staging, commitado ou enviado.

## 22. Motivo técnico exato do encerramento

Depois da exclusão das 17 regiões tratadas, o critério estatístico ainda apontou uma semente de 26 faces para V58. O refinamento determinístico removeu 12 faces e produziu um subconjunto topologicamente seguro de 14 faces, com uma componente, uma borda fechada, nenhuma ramificação, nenhum toque na borda global e nenhuma sobreposição histórica. Entretanto, a execução real mostrou que não existe, nessa região, uma operação correspondente que combine redução mensurável e preservação de todos os gates não enfraquecíveis: os candidatos com redução suficiente pioram aspecto ou normais; o candidato de melhor qualidade não atinge o limiar de benefício; e as operações restantes não reduzem geometria ou introduzem degradação. O risco remanescente é, portanto, ruído estatístico sem uma retopologia segura correspondente. Nenhum gate foi alterado para forçar aprovação.

## 23. Próxima fase recomendada

Prosseguir com `HEAD_CONSOLIDATION_AND_RIG_PREPARATION`, usando exclusivamente a V57 congelada e seu SHA-256 oficial como fonte.
