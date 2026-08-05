"use client"

import type {
  PropsWithChildren,
} from "react"

type AppShellProps =
  PropsWithChildren

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <div
      className="
        min-h-screen
        bg-[var(--gorila-canvas)]
        text-[var(--gorila-text)]
      "
    >
      {children}
    </div>
  )
}
