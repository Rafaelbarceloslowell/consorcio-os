"use client"

import { useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"

type BrandTheme = "dark" | "light"

type BrandIdentityProps = {
  compact?: boolean
  className?: string
  markClassName?: string
  showDescriptor?: boolean
}

function getActiveBrandTheme(): BrandTheme {
  return document.documentElement.classList.contains("gorila-light")
    ? "light"
    : "dark"
}

function getServerBrandTheme(): BrandTheme {
  return "dark"
}

function subscribeToBrandTheme(onThemeChange: () => void) {
  const observer = new MutationObserver(onThemeChange)

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })

  return () => observer.disconnect()
}

export function BrandMarkSlot({
  className,
}: {
  className?: string
}) {
  const theme = useSyncExternalStore(
    subscribeToBrandTheme,
    getActiveBrandTheme,
    getServerBrandTheme
  )
  const markSource =
    theme === "light"
      ? "/brand/GorillaMark_Light.svg"
      : "/brand/GorillaMark_Dark.svg"

  return (
    <span
      aria-hidden="true"
      data-brand-mark-slot=""
      className={cn(
        "relative isolate flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[14px]",
        "border border-[#2F8F5B]/25 bg-[#2F8F5B]/[0.10]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_1px_rgba(0,0,0,0.24),0_3px_4px_rgba(0,0,0,0.24),0_12px_26px_rgba(0,0,0,0.20)]",
        "after:absolute after:inset-[9px] after:rounded-[8px] after:border after:border-[#43A972]/25",
        className
      )}
    >
      <img
        src={markSource}
        alt=""
        className="size-full object-contain"
      />
    </span>
  )
}

export function BrandIdentity({
  compact = false,
  className,
  markClassName,
  showDescriptor = true,
}: BrandIdentityProps) {
  return (
    <div
      data-brand-identity=""
      className={cn("flex min-w-0 items-center", compact ? "justify-center" : "gap-3", className)}
    >
      <BrandMarkSlot className={markClassName} />

      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold tracking-[-0.025em] text-[var(--gorila-text)]">
            Gorila OS
          </span>

          {showDescriptor && (
            <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gorila-text-muted)]">
              Centro de operações
            </span>
          )}
        </span>
      )}
    </div>
  )
}
