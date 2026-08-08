export const THEME_STORAGE_KEY = "gorila-os-theme"

export type ThemePreference = "dark" | "light" | "system"
export type ResolvedTheme = "dark" | "light"

export function normalizeThemePreference(
  value: string | null | undefined,
): ThemePreference {
  if (value === "light" || value === "gorila-light") return "light"
  if (value === "system") return "system"
  return "dark"
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") {
    return systemPrefersDark ? "dark" : "light"
  }

  return preference
}

export function applyResolvedTheme(
  root: HTMLElement,
  resolvedTheme: ResolvedTheme,
  preference: ThemePreference,
) {
  root.classList.remove("gorila-night", "gorila-light", "dark")
  root.classList.add(
    resolvedTheme === "dark" ? "gorila-night" : "gorila-light",
  )

  if (resolvedTheme === "dark") root.classList.add("dark")
  root.dataset.themePreference = preference
  root.dataset.theme = resolvedTheme
}

export const themeInitializationScript = `
(function () {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = window.localStorage.getItem(key);
    var preference = stored === "light" || stored === "gorila-light"
      ? "light"
      : stored === "system"
        ? "system"
        : "dark";
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = preference === "system"
      ? (systemDark ? "dark" : "light")
      : preference;
    var root = document.documentElement;
    root.classList.remove("gorila-night", "gorila-light", "dark");
    root.classList.add(resolved === "dark" ? "gorila-night" : "gorila-light");
    if (resolved === "dark") root.classList.add("dark");
    root.dataset.themePreference = preference;
    root.dataset.theme = resolved;
  } catch (_) {
    document.documentElement.classList.add("gorila-night", "dark");
  }
})();
`
