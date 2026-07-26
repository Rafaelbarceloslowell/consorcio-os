export const duration = {
  instant: "75ms",
  fast: "180ms",
  normal: "220ms",
  slow: "250ms",
} as const;

export const easing = {
  default: "cubic-bezier(0.2, 0, 0, 1)",
  smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
  entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",

  /*
   * Mantido por compatibilidade com componentes existentes.
   * O valor não possui efeito elástico.
   */
  bounce: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const animation = {
  button: `${duration.fast} ${easing.default}`,
  card: `${duration.normal} ${easing.smooth}`,
  modal: `${duration.normal} ${easing.entrance}`,
  drawer: `${duration.slow} ${easing.entrance}`,
  dropdown: `${duration.fast} ${easing.entrance}`,
  tooltip: `${duration.fast} ${easing.entrance}`,
  hover: `${duration.fast} ${easing.default}`,
  focus: `${duration.fast} ${easing.default}`,
} as const;

export const transitionProperty = {
  button:
    "background-color, border-color, box-shadow, color, opacity, transform",
  card:
    "background-color, border-color, box-shadow, opacity, transform",
  input:
    "background-color, border-color, box-shadow, color, opacity",
  surface:
    "background-color, border-color, box-shadow, opacity",
  transform: "transform",
  opacity: "opacity",
} as const;

export const motion = {
  hoverLift: "translateY(-2px)",
  hoverLiftSubtle: "translateY(-1px)",
  pressed: "translateY(0)",
  hiddenAbove: "translateY(-4px)",
  hiddenBelow: "translateY(4px)",
  visible: "translateY(0)",
} as const;