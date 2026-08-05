# R2 Full Character Runtime Logs

All Blender execution logs preserved from the transactional phase before cleanup.

## Web and publication command summary

```text
Focused TypeScript (R2 runtime): exit 0
Clean full-source TypeScript excluding generated .next: exit 0
Focused ESLint: exit 0
Focused Vitest pre-publication: 2 files, 15 passed, 0 failed
Focused Vitest post-publication: 2 files, 15 passed, 0 failed
Completed full Vitest run: 115 files passed, 2 unrelated dashboard files failed; 1476 tests passed, 13 unrelated assertions remained after the ResizeObserver capability correction
Published GLB GLTFLoader parse: 3/3 passed; median isolated parse 113.869 ms
Published runtime transitions: 100/100 passed; 25 repeated cycles passed
Strict Mode cleanup/remount: passed
Independent Blender candidate audit: passed
Independent raw GLB/web audit attempt 1: rejected due PowerShell null-count false positive
Independent raw GLB/web audit attempt 2: passed
Atomic publication: passed
Published blend reopen: passed
Published GLB Blender round trip: passed
Git staged files: 0
Commits created: 0
Push performed: false
```

## R2_ANATOMICAL_SOURCE_INVENTORY.runtime.log

```text
R2_FULL_CHARACTER_INVENTORY={"Armatures": 1, "BlendSaved": false, "Bones": 51, "ExecutionStatus": "COMPLETED", "ImagesCreated": 0, "Meshes": 27, "SourceSHA256": "50D04CFBAEC2A431D96D4060E2AE82045AFBC56A0E74AD1759D156C0222825B3", "TechnicalVerdict": "APROVADO"}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-facial-ocular-oral-assets-ready-v1\r2-facial-ocular-oral-assets-ready-v1.blend"

Blender quit

```

## R2_BODY_SOURCE_INVENTORY.runtime.log

```text
R2_FULL_CHARACTER_INVENTORY={"Armatures": 1, "BlendSaved": false, "Bones": 51, "ExecutionStatus": "COMPLETED", "ImagesCreated": 0, "Meshes": 1, "SourceSHA256": "392EA67AEBC3BA0FF72E65BE18F599E22A0C4C1296F2F6D365FFB989F35CF9C1", "TechnicalVerdict": "APROVADO"}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-rig-v13-weights-refined.blend"

Blender quit

```

## R2_CANDIDATE_INITIAL_INVENTORY.runtime.log

```text
R2_FULL_CHARACTER_INVENTORY={"Armatures": 1, "BlendSaved": false, "Bones": 65, "ExecutionStatus": "COMPLETED", "ImagesCreated": 0, "Meshes": 27, "SourceSHA256": "7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97", "TechnicalVerdict": "APROVADO"}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"

Blender quit

```

## R2_CANDIDATE_POST_RUNTIME_INVENTORY.runtime.log

```text
R2_FULL_CHARACTER_INVENTORY={"Armatures": 1, "BlendSaved": false, "Bones": 65, "ExecutionStatus": "COMPLETED", "ImagesCreated": 0, "Meshes": 27, "SourceSHA256": "3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269", "TechnicalVerdict": "APROVADO"}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"

Blender quit

```

## R2_DIAGNOSTIC_OFFICIAL_HEAD_AUDIT.runtime.log

```text
INFO Draco mesh compression is available, use library at C:\Program Files\Blender Foundation\Blender 4.5\4.5\scripts\addons_core\io_scene_gltf2\extern_draco.dll
14:51:58 | INFO: Starting glTF 2.0 export
14:51:58 | INFO: Extracting primitive: R2_Arm_Fur_R_Mesh
14:51:58 | INFO: Primitives created: 1
14:51:58 | INFO: Extracting primitive: R2_Eye.L_Mesh
14:51:58 | INFO: Primitives created: 3
14:51:58 | INFO: Extracting primitive: R2_Eye.R_Mesh
14:51:58 | INFO: Primitives created: 3
14:51:58 | INFO: Extracting primitive: R2_Hand_L_Mesh
14:51:58 | INFO: Primitives created: 1
14:51:58 | INFO: Extracting primitive: R2_Hand_R_Mesh
14:51:58 | INFO: Primitives created: 1
14:51:58 | INFO: Extracting primitive: R2_Head_Face_Mesh
14:51:58 | INFO: Primitives created: 1
14:51:58 | INFO: Extracting primitive: R2_Head_Face_Foundation_Mesh
14:51:59 | INFO: Primitives created: 1
14:51:59 | INFO: Extracting primitive: R2_Head_Fur_Mesh
14:51:59 | INFO: Primitives created: 1
14:51:59 | INFO: Extracting primitive: R2_Hood_Mesh
14:52:00 | INFO: Primitives created: 1
14:52:00 | INFO: Extracting primitive: R2_Hood_Cord_L_Mesh
14:52:00 | INFO: Primitives created: 1
14:52:00 | INFO: Extracting primitive: R2_Hood_Cord_R_Mesh
14:52:00 | INFO: Primitives created: 1
14:52:00 | INFO: Extracting primitive: R2_Hoodie_Sleeve_L_Mesh
14:52:00 | INFO: Primitives created: 1
14:52:00 | INFO: Extracting primitive: R2_Hoodie_Sleeve_R_Mesh
14:52:01 | INFO: Primitives created: 1
14:52:01 | INFO: Extracting primitive: R2_Hoodie_Torso_Mesh
14:52:02 | INFO: Primitives created: 1
14:52:02 | INFO: Extracting primitive: R2_LipLower_Mesh
14:52:02 | INFO: Primitives created: 1
14:52:02 | INFO: Extracting primitive: R2_TeethLower_Mesh
14:52:02 | INFO: Primitives created: 1
14:52:02 | INFO: Extracting primitive: R2_Tongue_Mesh
14:52:02 | INFO: Primitives created: 1
14:52:02 | INFO: Extracting primitive: R2_LipUpper_Mesh
14:52:02 | INFO: Primitives created: 1
14:52:02 | INFO: Extracting primitive: R2_LowerEyelid.L_Mesh
14:52:02 | INFO: Primitives created: 1
14:52:02 | INFO: Extracting primitive: R2_LowerEyelid.R_Mesh
14:52:02 | INFO: Primitives created: 1
14:52:02 | INFO: Extracting primitive: R2_MouthInterior_Mesh
14:52:02 | INFO: Primitives created: 1
14:52:02 | INFO: Extracting primitive: R2_Pants_Mesh
14:52:03 | INFO: Primitives created: 1
14:52:03 | INFO: Extracting primitive: R2_Shoe_L_Mesh
14:52:04 | INFO: Primitives created: 1
14:52:04 | INFO: Extracting primitive: R2_Shoe_R_Mesh
14:52:04 | INFO: Primitives created: 1
14:52:04 | INFO: Extracting primitive: R2_TeethUpper_Mesh
14:52:04 | INFO: Primitives created: 1
14:52:04 | INFO: Extracting primitive: R2_UpperEyelid.L_Mesh
14:52:04 | INFO: Primitives created: 1
14:52:04 | INFO: Extracting primitive: R2_UpperEyelid.R_Mesh
14:52:04 | INFO: Primitives created: 1
14:52:04 | INFO: Finished glTF 2.0 export in 6.3128015995025635 s

14:52:06 | INFO: Data are loaded, start creating Blender stuff
14:52:06 | INFO: Blender create Mesh node R2_Arm_Fur_R_Mesh
14:52:06 | INFO: Blender create Mesh node R2_Eye.L_Mesh
14:52:06 | INFO: Blender create Mesh node R2_Eye.R_Mesh
14:52:06 | INFO: Blender create Mesh node R2_Hand_L_Mesh
14:52:06 | INFO: Blender create Mesh node R2_Hand_R_Mesh
14:52:07 | INFO: Blender create Mesh node R2_Head_Face_Mesh
14:52:07 | INFO: Blender create Mesh node R2_Head_Face_Foundation_Mesh
14:52:07 | INFO: Blender create Mesh node R2_Head_Fur_Mesh
14:52:08 | INFO: Blender create Mesh node R2_Hood_Mesh
14:52:08 | INFO: Blender create Mesh node R2_Hood_Cord_L_Mesh
14:52:08 | INFO: Blender create Mesh node R2_Hood_Cord_R_Mesh
14:52:08 | INFO: Blender create Mesh node R2_Hoodie_Sleeve_L_Mesh
14:52:08 | INFO: Blender create Mesh node R2_Hoodie_Sleeve_R_Mesh
14:52:09 | INFO: Blender create Mesh node R2_Hoodie_Torso_Mesh
14:52:09 | INFO: Blender create Mesh node R2_LipLower_Mesh
14:52:09 | INFO: Blender create Mesh node R2_TeethLower_Mesh
14:52:09 | INFO: Blender create Mesh node R2_Tongue_Mesh
14:52:09 | INFO: Blender create Mesh node R2_LipUpper_Mesh
14:52:09 | INFO: Blender create Mesh node R2_LowerEyelid.L_Mesh
14:52:09 | INFO: Blender create Mesh node R2_LowerEyelid.R_Mesh
14:52:09 | INFO: Blender create Mesh node R2_MouthInterior_Mesh
14:52:09 | INFO: Blender create Mesh node R2_Pants_Mesh
14:52:10 | INFO: Blender create Mesh node R2_Shoe_L_Mesh
14:52:11 | INFO: Blender create Mesh node R2_Shoe_R_Mesh
14:52:11 | INFO: Blender create Mesh node R2_TeethUpper_Mesh
14:52:11 | INFO: Blender create Mesh node R2_UpperEyelid.L_Mesh
14:52:11 | INFO: Blender create Mesh node R2_UpperEyelid.R_Mesh
14:52:11 | INFO: glTF import finished in 4.80s
ExecutionStatus=COMPLETED
TechnicalVerdict=APROVADO
IndependentAuditApproved=True
HeadRiggingConfirmed=True
ExpressionSystemConfirmed=True
NeutralResetExact=True
GLBRoundTrip=True
WireEdges=0
InvalidNonManifold=0
UnweightedDeformVertices=0
InvertedFaces=0
ZeroAreaFaces=0
FailedGates=NONE
CreatedImages=0
TemporaryGLBRemoved=True
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-facial-ocular-oral-assets-ready-v1\r2-facial-ocular-oral-assets-ready-v1.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-rig-expression-ready-v1\r2-head-rig-expression-ready-v1.blend"

Blender quit

```

## R2_FULL_CHARACTER_BUILD_ATTEMPT_1.runtime.log

```text
Info: Saved as "r2-full-character-runtime-ready-v1.candidate.blend"
R2_FULL_CHARACTER_BUILD={"AnimationClips": 9, "BodyBonesPreserved": 51, "CandidateSHA256": "D1D7C203ACAF61DA48A14990A5A50FB782B9A0B2440F6074F22777211B368C2E", "CreatedImages": 0, "ExecutionStatus": "COMPLETED", "FacialBonesPreserved": 14, "FailedGates": [], "NeutralResetExact": true, "OfficialSourcesUnchanged": true, "RuntimeStates": 10, "TechnicalVerdict": "APROVADO"}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"

Blender quit

```

## R2_FULL_CHARACTER_GLB_EXPORT_ATTEMPT_1.runtime.log

```text
INFO Draco mesh compression is available, use library at C:\Program Files\Blender Foundation\Blender 4.5\4.5\scripts\addons_core\io_scene_gltf2\extern_draco.dll
15:02:25 | INFO: Starting glTF 2.0 export
15:02:25 | INFO: Extracting primitive: R2_Arm_Fur_R_Mesh
15:02:25 | INFO: Primitives created: 1
15:02:25 | INFO: Extracting primitive: R2_Eye.L_Mesh
15:02:25 | INFO: Primitives created: 3
15:02:25 | INFO: Extracting primitive: R2_Eye.R_Mesh
15:02:25 | INFO: Primitives created: 3
15:02:25 | INFO: Extracting primitive: R2_Hand_L_Mesh
15:02:25 | INFO: Primitives created: 1
15:02:25 | INFO: Extracting primitive: R2_Hand_R_Mesh
15:02:25 | INFO: Primitives created: 1
15:02:25 | INFO: Extracting primitive: R2_Head_Face_Foundation_Mesh
15:02:25 | INFO: Primitives created: 1
15:02:25 | INFO: Extracting primitive: R2_Head_Fur_Mesh
15:02:26 | INFO: Primitives created: 1
15:02:26 | INFO: Extracting primitive: R2_Hood_Mesh
15:02:26 | INFO: Primitives created: 1
15:02:26 | INFO: Extracting primitive: R2_Hood_Cord_L_Mesh
15:02:26 | INFO: Primitives created: 1
15:02:26 | INFO: Extracting primitive: R2_Hood_Cord_R_Mesh
15:02:26 | INFO: Primitives created: 1
15:02:26 | INFO: Extracting primitive: R2_Hoodie_Sleeve_L_Mesh
15:02:26 | INFO: Primitives created: 1
15:02:26 | INFO: Extracting primitive: R2_Hoodie_Sleeve_R_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:27 | INFO: Extracting primitive: R2_Hoodie_Torso_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:27 | INFO: Extracting primitive: R2_LipLower_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:27 | INFO: Extracting primitive: R2_TeethLower_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:27 | INFO: Extracting primitive: R2_Tongue_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:27 | INFO: Extracting primitive: R2_LipUpper_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:27 | INFO: Extracting primitive: R2_LowerEyelid.L_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:27 | INFO: Extracting primitive: R2_LowerEyelid.R_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:27 | INFO: Extracting primitive: R2_MouthInterior_Mesh
15:02:27 | INFO: Primitives created: 1
15:02:28 | INFO: Extracting primitive: R2_Pants_Mesh
15:02:28 | INFO: Primitives created: 1
15:02:28 | INFO: Extracting primitive: R2_Shoe_L_Mesh
15:02:28 | INFO: Primitives created: 1
15:02:28 | INFO: Extracting primitive: R2_Shoe_R_Mesh
15:02:29 | INFO: Primitives created: 1
15:02:29 | INFO: Extracting primitive: R2_TeethUpper_Mesh
15:02:29 | INFO: Primitives created: 1
15:02:29 | INFO: Extracting primitive: R2_UpperEyelid.L_Mesh
15:02:29 | INFO: Primitives created: 1
15:02:29 | INFO: Extracting primitive: R2_UpperEyelid.R_Mesh
15:02:29 | INFO: Primitives created: 1
15:02:47 | INFO: Finished glTF 2.0 export in 22.129340648651123 s

R2_FULL_CHARACTER_GLB_EXPORT={"AnimationCount": 9, "BoneCount": 65, "CreatedImages": 0, "DuplicateBoneNames": 0, "DuplicateNodeNames": 0, "ExecutionStatus": "COMPLETED", "ExternalDependencies": 0, "FailedGates": [], "FileSizeBytes": 13189856, "GLB": "C:\\Projetos\\consorcio-os\\web\\blender\\r2-rig\\._r2_full_character_integration_20260801_143352\\r2-full-character-runtime-ready-v1.candidate.glb", "GLBParseErrors": 0, "GLBSHA256": "E3B9702C0367A8CAFB138B5C9AB94D6CC448C470CD69D74A46333A9953207A59", "MaterialCount": 8, "MeshCount": 26, "MissingBuffers": 0, "MissingImages": 0, "MorphTargetCount": 24, "NodeCount": 97, "PrimitiveCount": 30, "SkinCount": 1, "TechnicalVerdict": "APROVADO"}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"

Blender quit

```

## R2_FULL_CHARACTER_GLB_ROUNDTRIP_ATTEMPT_1.runtime.log

```text
15:04:54 | INFO: Data are loaded, start creating Blender stuff
15:04:54 | INFO: Blender create Mesh node R2_Arm_Fur_R_Mesh
15:04:54 | INFO: Blender create Mesh node R2_Eye.L_Mesh
15:04:54 | INFO: Blender create Mesh node R2_Eye.R_Mesh
15:04:54 | INFO: Blender create Mesh node R2_Hand_L_Mesh
15:04:54 | INFO: Blender create Mesh node R2_Hand_R_Mesh
15:04:54 | INFO: Blender create Mesh node R2_Head_Face_Foundation_Mesh
15:04:55 | INFO: Blender create Mesh node R2_Head_Fur_Mesh
15:04:55 | INFO: Blender create Mesh node R2_Hood_Mesh
15:04:55 | INFO: Blender create Mesh node R2_Hood_Cord_L_Mesh
15:04:55 | INFO: Blender create Mesh node R2_Hood_Cord_R_Mesh
15:04:55 | INFO: Blender create Mesh node R2_Hoodie_Sleeve_L_Mesh
15:04:55 | INFO: Blender create Mesh node R2_Hoodie_Sleeve_R_Mesh
15:04:55 | INFO: Blender create Mesh node R2_Hoodie_Torso_Mesh
15:04:56 | INFO: Blender create Mesh node R2_LipLower_Mesh
15:04:56 | INFO: Blender create Mesh node R2_TeethLower_Mesh
15:04:56 | INFO: Blender create Mesh node R2_Tongue_Mesh
15:04:56 | INFO: Blender create Mesh node R2_LipUpper_Mesh
15:04:56 | INFO: Blender create Mesh node R2_LowerEyelid.L_Mesh
15:04:56 | INFO: Blender create Mesh node R2_LowerEyelid.R_Mesh
15:04:56 | INFO: Blender create Mesh node R2_MouthInterior_Mesh
15:04:56 | INFO: Blender create Mesh node R2_Pants_Mesh
15:04:58 | INFO: Blender create Mesh node R2_Shoe_L_Mesh
15:04:58 | INFO: Blender create Mesh node R2_Shoe_R_Mesh
15:04:58 | INFO: Blender create Mesh node R2_TeethUpper_Mesh
15:04:58 | INFO: Blender create Mesh node R2_UpperEyelid.L_Mesh
15:04:58 | INFO: Blender create Mesh node R2_UpperEyelid.R_Mesh
15:04:59 | INFO: glTF import finished in 4.75s
blender.exe : Traceback (most recent call last):
No linha:6 caractere:1
+ & $blender -b --python $script -- $state.transactional_directory 2>&1 ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py", line 330, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py", line 326, in main
    raise RuntimeError("GLB round-trip gates failed: " + ", ".join(failed_gates))
RuntimeError: GLB round-trip gates failed: AnimationClipsRoundTripConfirmed
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Traceback (most recent call last):
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py", line 330, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py", line 326, in main
    raise RuntimeError("GLB round-trip gates failed: " + ", ".join(failed_gates))
RuntimeError: GLB round-trip gates failed: AnimationClipsRoundTripConfirmed
R2_FULL_CHARACTER_GLB_ROUNDTRIP={"AnimationClipsRoundTripConfirmed": false, "AnimationCount": 9, "BoneCount": 65, "CreatedImages": 0, "ExecutionStatus": "FAILED", "FailedGates": ["AnimationClipsRoundTripConfirmed"], "GLBRoundTripApproved": false, "MorphTargetCount": 24, "MorphTargetsRoundTripConfirmed": true, "NeutralResetExact": true, "SkeletonRoundTripExact": true, "TechnicalVerdict": "REPROVADO"}

Blender quit

```

## R2_FULL_CHARACTER_GLB_ROUNDTRIP_ATTEMPT_2.runtime.log

```text
15:06:34 | INFO: Data are loaded, start creating Blender stuff
15:06:34 | INFO: Blender create Mesh node R2_Arm_Fur_R_Mesh
15:06:34 | INFO: Blender create Mesh node R2_Eye.L_Mesh
15:06:34 | INFO: Blender create Mesh node R2_Eye.R_Mesh
15:06:34 | INFO: Blender create Mesh node R2_Hand_L_Mesh
15:06:34 | INFO: Blender create Mesh node R2_Hand_R_Mesh
15:06:34 | INFO: Blender create Mesh node R2_Head_Face_Foundation_Mesh
15:06:34 | INFO: Blender create Mesh node R2_Head_Fur_Mesh
15:06:35 | INFO: Blender create Mesh node R2_Hood_Mesh
15:06:35 | INFO: Blender create Mesh node R2_Hood_Cord_L_Mesh
15:06:35 | INFO: Blender create Mesh node R2_Hood_Cord_R_Mesh
15:06:35 | INFO: Blender create Mesh node R2_Hoodie_Sleeve_L_Mesh
15:06:35 | INFO: Blender create Mesh node R2_Hoodie_Sleeve_R_Mesh
15:06:35 | INFO: Blender create Mesh node R2_Hoodie_Torso_Mesh
15:06:36 | INFO: Blender create Mesh node R2_LipLower_Mesh
15:06:36 | INFO: Blender create Mesh node R2_TeethLower_Mesh
15:06:36 | INFO: Blender create Mesh node R2_Tongue_Mesh
15:06:36 | INFO: Blender create Mesh node R2_LipUpper_Mesh
15:06:36 | INFO: Blender create Mesh node R2_LowerEyelid.L_Mesh
15:06:36 | INFO: Blender create Mesh node R2_LowerEyelid.R_Mesh
15:06:36 | INFO: Blender create Mesh node R2_MouthInterior_Mesh
15:06:36 | INFO: Blender create Mesh node R2_Pants_Mesh
15:06:37 | INFO: Blender create Mesh node R2_Shoe_L_Mesh
15:06:37 | INFO: Blender create Mesh node R2_Shoe_R_Mesh
15:06:37 | INFO: Blender create Mesh node R2_TeethUpper_Mesh
15:06:37 | INFO: Blender create Mesh node R2_UpperEyelid.L_Mesh
15:06:37 | INFO: Blender create Mesh node R2_UpperEyelid.R_Mesh
15:06:39 | INFO: glTF import finished in 5.08s
blender.exe : Traceback (most recent call last):
No linha:6 caractere:1
+ & $blender -b --python $script -- $state.transactional_directory 2>&1 ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py", line 386, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py", line 382, in main
    raise RuntimeError("GLB round-trip gates failed: " + ", ".join(failed_gates))
RuntimeError: GLB round-trip gates failed: AnimationClipsRoundTripConfirmed
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Traceback (most recent call last):
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py", line 386, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_AUDIT_FULL_CHARACTER_GLB_ROUNDTRIP.py", line 382, in main
    raise RuntimeError("GLB round-trip gates failed: " + ", ".join(failed_gates))
RuntimeError: GLB round-trip gates failed: AnimationClipsRoundTripConfirmed
R2_FULL_CHARACTER_GLB_ROUNDTRIP={"AnimationClipsRoundTripConfirmed": false, "AnimationCount": 9, "BoneCount": 65, "CreatedImages": 0, "ExecutionStatus": "FAILED", "FailedGates": ["AnimationClipsRoundTripConfirmed"], "GLBRoundTripApproved": false, "MorphTargetCount": 24, "MorphTargetsRoundTripConfirmed": true, "NeutralResetExact": true, "SkeletonRoundTripExact": true, "TechnicalVerdict": "REPROVADO"}

Blender quit

```

## R2_FULL_CHARACTER_GLB_ROUNDTRIP_ATTEMPT_3.runtime.log

```text
15:07:34 | INFO: Data are loaded, start creating Blender stuff
15:07:34 | INFO: Blender create Mesh node R2_Arm_Fur_R_Mesh
15:07:34 | INFO: Blender create Mesh node R2_Eye.L_Mesh
15:07:34 | INFO: Blender create Mesh node R2_Eye.R_Mesh
15:07:34 | INFO: Blender create Mesh node R2_Hand_L_Mesh
15:07:34 | INFO: Blender create Mesh node R2_Hand_R_Mesh
15:07:34 | INFO: Blender create Mesh node R2_Head_Face_Foundation_Mesh
15:07:34 | INFO: Blender create Mesh node R2_Head_Fur_Mesh
15:07:35 | INFO: Blender create Mesh node R2_Hood_Mesh
15:07:35 | INFO: Blender create Mesh node R2_Hood_Cord_L_Mesh
15:07:35 | INFO: Blender create Mesh node R2_Hood_Cord_R_Mesh
15:07:35 | INFO: Blender create Mesh node R2_Hoodie_Sleeve_L_Mesh
15:07:35 | INFO: Blender create Mesh node R2_Hoodie_Sleeve_R_Mesh
15:07:35 | INFO: Blender create Mesh node R2_Hoodie_Torso_Mesh
15:07:36 | INFO: Blender create Mesh node R2_LipLower_Mesh
15:07:36 | INFO: Blender create Mesh node R2_TeethLower_Mesh
15:07:36 | INFO: Blender create Mesh node R2_Tongue_Mesh
15:07:36 | INFO: Blender create Mesh node R2_LipUpper_Mesh
15:07:36 | INFO: Blender create Mesh node R2_LowerEyelid.L_Mesh
15:07:36 | INFO: Blender create Mesh node R2_LowerEyelid.R_Mesh
15:07:36 | INFO: Blender create Mesh node R2_MouthInterior_Mesh
15:07:36 | INFO: Blender create Mesh node R2_Pants_Mesh
15:07:37 | INFO: Blender create Mesh node R2_Shoe_L_Mesh
15:07:37 | INFO: Blender create Mesh node R2_Shoe_R_Mesh
15:07:37 | INFO: Blender create Mesh node R2_TeethUpper_Mesh
15:07:37 | INFO: Blender create Mesh node R2_UpperEyelid.L_Mesh
15:07:37 | INFO: Blender create Mesh node R2_UpperEyelid.R_Mesh
15:07:38 | INFO: glTF import finished in 4.14s
R2_FULL_CHARACTER_GLB_ROUNDTRIP={"AnimationClipsRoundTripConfirmed": true, "AnimationCount": 9, "BoneCount": 65, "CreatedImages": 0, "ExecutionStatus": "COMPLETED", "FailedGates": [], "GLBRoundTripApproved": true, "MorphTargetCount": 24, "MorphTargetsRoundTripConfirmed": true, "NeutralResetExact": true, "SkeletonRoundTripExact": true, "TechnicalVerdict": "APROVADO"}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)

Blender quit

```

## R2_FULL_CHARACTER_LOOSE_EDGE_REPAIR.runtime.log

```text
blender.exe : Traceback (most recent call last):
No linha:6 caractere:1
+ & $blender -b $state.transactional_candidate_path --python $script -- ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 209, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 157, in main
    raise RuntimeError("Authorized repair preservation failure: " + ", ".join(preservation_failures))
RuntimeError: Authorized repair preservation failure: vertices, polygons, shape_keys, vertex_groups, attributes, 
expected topology counts
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-rig-expression-ready-v1\r2-head-rig-expression-ready-v1.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Traceback (most recent call last):
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 209, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 157, in main
    raise RuntimeError("Authorized repair preservation failure: " + ", ".join(preservation_failures))
RuntimeError: Authorized repair preservation failure: vertices, polygons, shape_keys, vertex_groups, attributes, 
expected topology counts

Blender quit

```

## R2_FULL_CHARACTER_LOOSE_EDGE_REPAIR_ATTEMPT_2.runtime.log

```text
blender.exe : Traceback (most recent call last):
No linha:6 caractere:1
+ & $blender -b $state.transactional_candidate_path --python $script -- ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 216, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 164, in main
    raise RuntimeError("Authorized repair preservation failure: " + ", ".join(preservation_failures))
RuntimeError: Authorized repair preservation failure: vertices, polygons, shape_keys, vertex_groups, attributes, 
expected topology counts
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-rig-expression-ready-v1\r2-head-rig-expression-ready-v1.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Traceback (most recent call last):
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 216, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 164, in main
    raise RuntimeError("Authorized repair preservation failure: " + ", ".join(preservation_failures))
RuntimeError: Authorized repair preservation failure: vertices, polygons, shape_keys, vertex_groups, attributes, 
expected topology counts

Blender quit

```

## R2_FULL_CHARACTER_LOOSE_EDGE_REPAIR_ATTEMPT_3.runtime.log

```text
blender.exe : Traceback (most recent call last):
No linha:6 caractere:1
+ & $blender -b $state.transactional_candidate_path --python $script -- ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 219, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 167, in main
    raise RuntimeError("Authorized repair preservation failure: " + ", ".join(preservation_failures))
RuntimeError: Authorized repair preservation failure: expected topology counts, remaining loose edges
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-rig-expression-ready-v1\r2-head-rig-expression-ready-v1.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Traceback (most recent call last):
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 219, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_REPAIR_FULL_CHARACTER_LOOSE_EDGES.py", line 167, in main
    raise RuntimeError("Authorized repair preservation failure: " + ", ".join(preservation_failures))
RuntimeError: Authorized repair preservation failure: expected topology counts, remaining loose edges

Blender quit

```

## R2_FULL_CHARACTER_LOOSE_EDGE_REPAIR_ATTEMPT_4.runtime.log

```text
Info: Saved as "r2-full-character-runtime-ready-v1.candidate.blend"
R2_FULL_CHARACTER_LOOSE_EDGE_REPAIR={"CandidateSHA256": "3D60D28B852566ABEC764D2DE0EB55D63F42AC26F8F75936109D33898B25E269", "CreatedImages": 0, "ExecutionStatus": "COMPLETED", "FacesChanged": 0, "MaterialsChanged": 0, "OfficialSourcesUnchanged": true, "RemovedLooseEdges": 16, "ShapeKeysChanged": 0, "TechnicalVerdict": "APROVADO", "UnexpectedGeometryChanges": 0, "VerticesChanged": 0, "WeightsChanged": 0, "WireEdgesAfter": 0}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-rig-expression-ready-v1\r2-head-rig-expression-ready-v1.blend"
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"

Blender quit

```

## R2_FULL_CHARACTER_RUNTIME_TESTS_ATTEMPT_1.runtime.log

```text
blender.exe : Traceback (most recent call last):
No linha:6 caractere:1
+ & $blender -b $state.transactional_candidate_path --python $script -- ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 486, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 482, in main
    raise RuntimeError("Runtime gates failed: " + ", ".join(failed_gates))
RuntimeError: Runtime gates failed: CombinedDeformationRuntimeTests, WireEdges
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Traceback (most recent call last):
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 486, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 482, in main
    raise RuntimeError("Runtime gates failed: " + ", ".join(failed_gates))
RuntimeError: Runtime gates failed: CombinedDeformationRuntimeTests, WireEdges
R2_FULL_CHARACTER_RUNTIME_TESTS={"AllPairTransitions": 100, "AnimationClipsTested": 9, "CreatedImages": 0, "ExecutionStatus": "FAILED", "ExpressionChannelsPreserved": 24, "ExpressionLevelSamples": 120, "FailedGates": ["CombinedDeformationRuntimeTests", "WireEdges"], "InvalidNonManifold": 0, "InvertedFaces": 0, "NeutralResetExact": true, "RuntimeStatesTested": 10, "TechnicalVerdict": "REPROVADO", "UnweightedDeformVertices": 0, "WireEdges": 16, "ZeroAreaFaces": 0}

Blender quit

```

## R2_FULL_CHARACTER_RUNTIME_TESTS_ATTEMPT_2.runtime.log

```text
blender.exe : Traceback (most recent call last):
No linha:6 caractere:1
+ & $blender -b $state.transactional_candidate_path --python $script -- ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 485, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 481, in main
    raise RuntimeError("Runtime gates failed: " + ", ".join(failed_gates))
RuntimeError: Runtime gates failed: WireEdges
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Traceback (most recent call last):
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 485, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 481, in main
    raise RuntimeError("Runtime gates failed: " + ", ".join(failed_gates))
RuntimeError: Runtime gates failed: WireEdges
R2_FULL_CHARACTER_RUNTIME_TESTS={"AllPairTransitions": 100, "AnimationClipsTested": 9, "CreatedImages": 0, "ExecutionStatus": "FAILED", "ExpressionChannelsPreserved": 24, "ExpressionLevelSamples": 120, "FailedGates": ["WireEdges"], "InvalidNonManifold": 0, "InvertedFaces": 0, "NeutralResetExact": true, "RuntimeStatesTested": 10, "TechnicalVerdict": "REPROVADO", "UnweightedDeformVertices": 0, "WireEdges": 16, "ZeroAreaFaces": 0}

Blender quit

```

## R2_FULL_CHARACTER_RUNTIME_TESTS_ATTEMPT_3.runtime.log

```text
blender.exe : Traceback (most recent call last):
No linha:6 caractere:1
+ & $blender -b $state.transactional_candidate_path --python $script -- ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 487, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 483, in main
    raise RuntimeError("Runtime gates failed: " + ", ".join(failed_gates))
RuntimeError: Runtime gates failed: WireEdges
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"
Traceback (most recent call last):
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 487, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\R2_TEST_FULL_CHARACTER_RUNTIME.py", line 483, in main
    raise RuntimeError("Runtime gates failed: " + ", ".join(failed_gates))
RuntimeError: Runtime gates failed: WireEdges
R2_FULL_CHARACTER_RUNTIME_TESTS={"AllPairTransitions": 100, "AnimationClipsTested": 9, "CreatedImages": 0, "ExecutionStatus": "FAILED", "ExpressionChannelsPreserved": 24, "ExpressionLevelSamples": 120, "FailedGates": ["WireEdges"], "InvalidNonManifold": 0, "InvertedFaces": 0, "NeutralResetExact": true, "RuntimeStatesTested": 10, "TechnicalVerdict": "REPROVADO", "UnweightedDeformVertices": 0, "WireEdges": 16, "ZeroAreaFaces": 0}

Blender quit

```

## R2_FULL_CHARACTER_RUNTIME_TESTS_ATTEMPT_4.runtime.log

```text
R2_FULL_CHARACTER_RUNTIME_TESTS={"AllPairTransitions": 100, "AnimationClipsTested": 9, "CreatedImages": 0, "ExecutionStatus": "COMPLETED", "ExpressionChannelsPreserved": 24, "ExpressionLevelSamples": 120, "FailedGates": [], "InvalidNonManifold": 0, "InvertedFaces": 0, "NeutralResetExact": true, "RuntimeStatesTested": 10, "TechnicalVerdict": "APROVADO", "UnweightedDeformVertices": 0, "WireEdges": 0, "ZeroAreaFaces": 0}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_full_character_integration_20260801_143352\r2-full-character-runtime-ready-v1.candidate.blend"

Blender quit

```

## R2_HEAD_SOURCE_INVENTORY.runtime.log

```text
R2_FULL_CHARACTER_INVENTORY={"Armatures": 1, "BlendSaved": false, "Bones": 65, "ExecutionStatus": "COMPLETED", "ImagesCreated": 0, "Meshes": 27, "SourceSHA256": "7AE3C98EEF99AE60FF3C0470370147559B6B1CE7EE8455BAFD81D9852D8C0B97", "TechnicalVerdict": "APROVADO"}
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-rig-expression-ready-v1\r2-head-rig-expression-ready-v1.blend"

Blender quit

```
