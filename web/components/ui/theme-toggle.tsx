"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

type GorilaTheme = "gorila-night" | "gorila-light"

const THEME_STORAGE_KEY = "gorila-os-theme"

export function ThemeToggle() {
  const [theme, setTheme] = useState<GorilaTheme>("gorila-night")

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const initialTheme =
      storedTheme === "gorila-light" ? "gorila-light" : "gorila-night"

    document.documentElement.classList.remove("gorila-night", "gorila-light")
    document.documentElement.classList.add(initialTheme)
    const frame = window.requestAnimationFrame(() => setTheme(initialTheme))

    return () => window.cancelAnimationFrame(frame)
  }, [])

  function toggleTheme() {
    const nextTheme =
      theme === "gorila-night" ? "gorila-light" : "gorila-night"

    document.documentElement.classList.remove("gorila-night", "gorila-light")
    document.documentElement.classList.add(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    setTheme(nextTheme)
  }

  const isNight = theme === "gorila-night"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isNight ? "Ativar Gorila Light" : "Ativar Gorila Night"}
      title={isNight ? "Gorila Night" : "Gorila Light"}
      className="border border-[var(--gorila-line)] bg-[var(--gorila-surface-subtle)] text-[var(--gorila-text-soft)]"
    >
      {isNight ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}
    </Button>
  )
}
