# R2 Head Rig Runtime Logs

## Approved path

- Rig build attempt 2: APPROVED, 24/24 runtime channels.
- Independent candidate audit: APPROVED, including GLB round-trip.
- Published rig reopen audit: APPROVED.
- Final expanded audit: APPROVED, including weights, materials and face orientation.
- Every GLB temporary was removed by its auditor.

## Recoverable failure

Build attempt 1 was rejected before save because the test compared hierarchy-reordered bone arrays positionally and did not force a frame change for driver evaluation. The candidate file remained the exact anatomical input. The checks were corrected to compare existing bones by identity and to advance/restore the frame for each driver test.

## Complete logs

- R2_HEAD_RIG_BUILD_ATTEMPT_1_REJECTED.runtime.log: SHA-256 DEAE742870B8193D3687E782E31BE5598B1E5AC93E94B8D8C9B7D1B4635589A1
- R2_HEAD_RIG_BUILD_APPROVED.runtime.log: SHA-256 8AE163BF04A046EF3B039760EBC1CEADE1C4A05F892BA08736B3E260EC5D8D10
- R2_HEAD_RIG_INDEPENDENT_AUDIT.runtime.log: SHA-256 8954ED1012E83FBEF26ECAC7E515A151C420A56318E87AA30CD48A3D75794FD2
- R2_HEAD_RIG_PUBLICATION_REOPEN_AUDIT_INITIAL.runtime.log: SHA-256 D202343349202A98FB9AE413A17352D7F93BA938A9443029CD061093121E58F6
- R2_HEAD_RIG_PUBLICATION_REOPEN_AUDIT_FINAL.runtime.log: SHA-256 5749AEF2C165BB8CD65E62EC34EE247B646AD0CBADA15F1FC53FB1E0C82E6001