export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
} as const;

export const semanticSpacing = {
  xs: spacing[2],
  sm: spacing[4],
  md: spacing[6],
  lg: spacing[8],
  xl: spacing[12],
  "2xl": spacing[16],
  "3xl": spacing[24],
} as const;

export const componentSpacing = {
  buttonX: spacing[4],
  buttonY: spacing[3],

  inputX: spacing[4],
  inputY: spacing[3],

  card: spacing[6],
  cardLarge: spacing[8],

  modal: spacing[8],

  sidebarX: spacing[4],
  sidebarY: spacing[6],

  pageX: spacing[8],
  pageY: spacing[8],

  section: spacing[12],
} as const;

export type SpacingToken = keyof typeof spacing;
export type SemanticSpacingToken = keyof typeof semanticSpacing;
export type ComponentSpacingToken = keyof typeof componentSpacing;