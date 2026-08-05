# R2 Facial Anatomy Runtime Logs

## Checkpoint 1 - foundation identity

~~~text
ExecutionStatus=COMPLETED
TechnicalVerdict=APROVADO
SourceSHA256=340EEDFD0251432E6B8326B23EAE3AD268D560CC9D2FEE0940C8F03F9DC5B64B
FoundationIdentityConfirmed=True
VertexOrderFingerprintCreated=True
BlendSaved=False
OfficialSourceUnchanged=True
CreatedImages=0
FoundationObject=R2_Head_Face_Foundation
FoundationMesh=R2_Head_Face_Foundation_Mesh
FoundationVertices=3654
FoundationPolygons=6847
CombinedFingerprint=A374A44A37CFA41A09CF653826D346CF40A71E2C88A14AAD14ECAFDC374358C4
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-consolidated-rig-ready-v1\r2-head-consolidated-rig-ready-v1.blend"

Blender quit

~~~

## Rejected Checkpoint 2/3 attempt

Root cause: a recoverable Python type error indexed after converting a vector component to `float`. The output was rejected and never promoted.

~~~text
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-consolidated-rig-ready-v1\r2-head-consolidated-rig-ready-v1.blend"
blender.exe : Traceback (most recent call last):
No linha:2 caractere:373
+ ... ST=PASS')"; & 'C:\Program Files\Blender Foundation\Blender 4.5\blende ...
+                 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Traceback (most recent call last)::String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_facial_anatomy_certification_20260801_120937\checkpoint2_3_geo
metry_probe.py", line 361, in <module>
    main()
  File "C:\Projetos\consorcio-os\web\blender\r2-rig\._r2_facial_anatomy_certification_20260801_120937\checkpoint2_3_geo
metry_probe.py", line 268, in main
    center_x = float(armature.matrix_world @ head_bone.head_local)[0]
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
TypeError: float() argument must be a string or a real number, not 'Vector'

Blender quit

~~~

## Corrected Checkpoint 2/3 run

~~~text
ExecutionStatus=COMPLETED
TechnicalVerdict=APROVADO
AnatomicalAxesCertified=True
FacialCenterPlaneCertified=True
LeftRightOrientationCertified=True
FrontBackOrientationCertified=True
UpDownOrientationCertified=True
BoundaryComponents=23
MirrorPairPercent=1.100071
OfficialSourceUnchanged=True
BlendSaved=False
CreatedImages=0
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-consolidated-rig-ready-v1\r2-head-consolidated-rig-ready-v1.blend"

Blender quit

~~~

## Checkpoint 3/4/5/7 semantic sufficiency audit

~~~text
ExecutionStatus=COMPLETED
TechnicalVerdict=REPROVADO
PhaseGateStatus=BLOCKED
Recoverable=False
LandmarkCandidates=8
CertifiableMandatoryLandmarks=4/38
DuplicateEyeCoordinatePairs=2
UniqueEyeLineageBoundaries=2
OcularNamedObjects=0
OralNamedObjects=0
OralSemanticAttributes=0
MuzzleLineageBoundaryEdges=0
OfficialSourceUnchanged=True
BlendSaved=False
CreatedImages=0
Blender 4.5.10 LTS (hash 6dc0b208d1b5 built 2026-05-19 01:33:42)
Read blend: "C:\Projetos\consorcio-os\web\blender\r2-rig\r2-head-consolidated-rig-ready-v1\r2-head-consolidated-rig-ready-v1.blend"

Blender quit

~~~