export const radius = {
  none: "0",
  sm: "0.375rem",
  md: "0.625rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

export const componentRadius = {
  button: radius.lg,
  input: radius.lg,
  card: radius.xl,
  sidebar: "1.25rem",
  modal: radius["2xl"],
  badge: radius.full,
  avatar: radius.full,
} as const;

export type RadiusToken = keyof typeof radius;
export type ComponentRadiusToken = keyof typeof componentRadius;