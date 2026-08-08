"use client"

import {
  Check,
  Monitor,
  Moon,
  Palette,
  Sun,
  type LucideIcon,
} from "lucide-react"
import {
  useState,
} from "react"

import {
  useGorillaTheme,
} from "@/components/theme/theme-provider"
import type {
  ThemePreference,
} from "@/lib/theme"

const themeOptions: ReadonlyArray<{
  value: ThemePreference
  label: string
  icon: LucideIcon
}> = [
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
  { value: "system", label: "Sistema", icon: Monitor },
]

export function ThemeToggle({
  align = "right",
}: Readonly<{
  align?: "left" | "right"
}>) {
  const [open, setOpen] = useState(false)
  const {
    theme,
    resolvedTheme,
    setTheme,
  } = useGorillaTheme()
  const active = themeOptions.find((option) => option.value === theme)
  const ActiveIcon = active?.icon ?? Palette

  return (
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false)
      }}
    >
      <button
        type="button"
        aria-label={`Selecionar tema. Atual: ${active?.label ?? "Escuro"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Tema: ${active?.label ?? "Escuro"}`}
        onClick={() => setOpen((current) => !current)}
        className="flex size-11 items-center justify-center rounded-full border border-[var(--gorilla-border)] bg-[var(--gorilla-surface-subtle)] text-[var(--gorilla-text-secondary)] transition hover:border-[var(--gorilla-border-strong)] hover:bg-[var(--gorilla-moss-soft)] hover:text-[var(--gorilla-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorilla-focus)]"
      >
        <ActiveIcon className="size-[17px]" strokeWidth={1.7} />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Tema da interface"
          className={[
            "absolute top-13 z-[80] w-44 overflow-hidden rounded-2xl border border-[var(--gorilla-border)] bg-[var(--gorilla-surface-raised)] p-1.5 shadow-[var(--gorilla-shadow-raised)]",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {themeOptions.map((option) => {
            const Icon = option.icon
            const selected = theme === option.value

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(option.value)
                  setOpen(false)
                }}
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs text-[var(--gorilla-text-secondary)] transition hover:bg-[var(--gorilla-moss-soft)] hover:text-[var(--gorilla-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gorilla-focus)]"
              >
                <Icon className="size-4" />
                <span className="flex-1">{option.label}</span>
                {selected ? <Check className="size-3.5 text-[var(--gorilla-moss-strong)]" /> : null}
              </button>
            )
          })}
          <p className="border-t border-[var(--gorilla-border)] px-3 pb-1 pt-2 text-[9px] leading-4 text-[var(--gorilla-text-muted)]">
            Aparência ativa: {resolvedTheme === "dark" ? "Escura" : "Clara"}
          </p>
        </div>
      ) : null}
    </div>
  )
}
