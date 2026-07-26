export const shadows = {
  none: "none",

  xs: `
    0 1px 2px rgba(0,0,0,.18),
    0 2px 6px rgba(0,0,0,.08)
  `,

  sm: `
    0 4px 12px rgba(0,0,0,.16),
    0 1px 3px rgba(0,0,0,.12)
  `,

  md: `
    0 8px 24px rgba(0,0,0,.18),
    0 2px 8px rgba(0,0,0,.12)
  `,

  lg: `
    0 12px 32px rgba(0,0,0,.24),
    0 4px 12px rgba(0,0,0,.14)
  `,

  xl: `
    0 24px 56px rgba(0,0,0,.32),
    0 8px 24px rgba(0,0,0,.18)
  `,

  glass: `
    inset 0 1px 0 rgba(255,255,255,.12),
    inset 0 -1px 0 rgba(0,0,0,.24),
    0 2px 3px rgba(0,0,0,.22),
    0 12px 30px rgba(0,0,0,.18)
  `,

  glassRaised: `
    inset 0 1px 0 rgba(255,255,255,.16),
    inset 0 -2px 1px rgba(0,0,0,.28),
    0 3px 4px rgba(0,0,0,.24),
    0 18px 42px rgba(0,0,0,.24)
  `,

  button: `
    inset 0 1px 0 rgba(255,255,255,.18),
    inset 0 -2px 1px rgba(0,0,0,.26),
    0 2px 2px rgba(0,0,0,.30),
    0 7px 16px rgba(0,0,0,.18)
  `,

  buttonHover: `
    inset 0 1px 0 rgba(255,255,255,.24),
    inset 0 -3px 2px rgba(0,0,0,.28),
    0 4px 3px rgba(0,0,0,.32),
    0 16px 30px rgba(0,0,0,.26)
  `,

  card: `
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -1px 0 rgba(0,0,0,.22),
    0 3px 5px rgba(0,0,0,.18),
    0 16px 38px rgba(0,0,0,.18)
  `,

  cardHover: `
    inset 0 1px 0 rgba(255,255,255,.14),
    inset 0 -1px 0 rgba(0,0,0,.26),
    0 5px 7px rgba(0,0,0,.22),
    0 24px 50px rgba(0,0,0,.24)
  `,

  sidebar: `
    inset -1px 0 0 rgba(255,255,255,.05),
    8px 0 32px rgba(0,0,0,.16)
  `,

  floating: `
    inset 0 1px 0 rgba(255,255,255,.05),
    0 18px 50px rgba(0,0,0,.32),
    0 6px 18px rgba(0,0,0,.18)
  `,

  modal: `
    inset 0 1px 0 rgba(255,255,255,.06),
    0 32px 80px rgba(0,0,0,.45),
    0 12px 32px rgba(0,0,0,.26)
  `,

  focus: `
    0 0 0 1px rgba(47,143,91,.68),
    0 0 0 4px rgba(47,143,91,.12)
  `,

  greenGlow: `
    0 8px 24px rgba(47,143,91,.14)
  `,
} as const;

export type ShadowToken = keyof typeof shadows;
