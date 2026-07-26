export const colors = {
  light: {
    background: "#F1F3F1",
    surface: "#FAFCFA",

    glass: "rgba(255,255,255,0.72)",
    glassStrong: "rgba(255,255,255,0.88)",

    elevation: "#FFFFFF",

    primary: {
      50: "#ECFDF3",
      100: "#D1FAE0",
      200: "#A7F3C4",
      300: "#6EE79E",
      400: "#43C879",
      500: "#2F8F5B",
      600: "#237447",
      700: "#1B5B39",
      800: "#174B2F",
      900: "#123C27",
    },

    accent: "#166534",

    success: "#32966A",
    warning: "#D58B24",
    danger: "#C95757",
    info: "#68778D",

    text: {
      primary: "#17191D",
      secondary: "#505762",
      muted: "#818A99",
      inverse: "#F7F8FA",
    },

    border: "#DFE3E8",

    divider: "#E8EBEF",

    shadow: {
      light: "rgba(255,255,255,.94)",
      dark: "rgba(24,30,40,.14)",
    },
  },

  dark: {
    background: "#0C0F0D",

    surface: "#141915",

    glass: "rgba(23,27,34,.70)",

    glassStrong: "rgba(29,35,45,.88)",

    elevation: "#1B211D",

    primary: {
      50: "#ECFDF3",
      100: "#D1FAE0",
      200: "#A7F3C4",
      300: "#6EE79E",
      400: "#43C879",
      500: "#2F8F5B",
      600: "#237447",
      700: "#1B5B39",
      800: "#174B2F",
      900: "#123C27",
    },

    accent: "#2F8F5B",

    success: "#3FB980",
    warning: "#E9A23B",
    danger: "#D96464",
    info: "#7F8EA3",

    text: {
      primary: "#F5F7FA",
      secondary: "#D6DBE3",
      muted: "#96A0AF",
      inverse: "#0F1115",
    },

    border: "#29302B",

    divider: "rgba(255,255,255,.08)",

    shadow: {
      light: "rgba(255,255,255,.04)",
      dark: "rgba(0,0,0,.72)",
    },
  },
} as const;

export type ColorTheme = keyof typeof colors;
