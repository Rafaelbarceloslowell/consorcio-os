"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  applyResolvedTheme,
  normalizeThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme"

type ThemeContextValue = {
  theme: ThemePreference
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
})

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function ThemeProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [theme, setThemeState] = useState<ThemePreference>("dark")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark")

  const applyTheme = useCallback((preference: ThemePreference) => {
    const resolved = resolveTheme(preference, systemPrefersDark())
    applyResolvedTheme(document.documentElement, resolved, preference)
    setResolvedTheme(resolved)
  }, [])

  useEffect(() => {
    const storedTheme = normalizeThemePreference(
      window.localStorage.getItem(THEME_STORAGE_KEY),
    )

    setThemeState(storedTheme)
    applyTheme(storedTheme)
  }, [applyTheme])

  useEffect(() => {
    if (theme !== "system") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onSystemThemeChange = () => applyTheme("system")

    media.addEventListener?.("change", onSystemThemeChange)
    return () => media.removeEventListener?.("change", onSystemThemeChange)
  }, [applyTheme, theme])

  const setTheme = useCallback((preference: ThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
    setThemeState(preference)
    applyTheme(preference)
  }, [applyTheme])

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
  }), [resolvedTheme, setTheme, theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useGorillaTheme() {
  return useContext(ThemeContext)
}
