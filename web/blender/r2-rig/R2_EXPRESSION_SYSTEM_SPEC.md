# R2 Expression System Specification

Status: IMPLEMENTED_AND_RUNTIME_VALIDATED.

The hybrid system uses certified eye/jaw pivots and shape keys for blink seal, brows, cheeks, muzzle, lip contact, smile/frown, width and O/E shapes. The armature exposes normalized canonical properties for all expression and viseme channels. Eye yaw/pitch and coordinated aim use measured limits of 28 and 20 degrees; jaw opening is limited to 32 degrees.

Runtime validation passed 24/24 channels, exact neutral reset, independent reopen checks and GLB round-trip. The complete bone, control, shape-key, expression and viseme maps are stored in the adjacent JSON artifacts.

TechnicalVerdict=APROVADO  
ConstructionAuthorized=True  
PublicationAuthorized=True