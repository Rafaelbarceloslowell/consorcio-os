"use client"

import type { LucideIcon } from "lucide-react"
import { Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BrandEmptyStateProps = {
  title: string
  description: string
  icon?: LucideIcon
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function BrandEmptyState({
  title,
  description,
  icon: Icon = Sparkles,
  actionLabel,
  onAction,
  className,
}: BrandEmptyStateProps) {
  return (
    <div
      className={cn(
        "gorila-material relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-[20px] border",
        "px-6 py-10 text-center",
        className
      )}
    >
      <div className="relative z-10 flex size-11 items-center justify-center rounded-2xl border border-[var(--gorila-green-bright)]/20 bg-[var(--gorila-green-soft)] text-[var(--gorila-green-bright)] shadow-[var(--gorila-control-shadow)]">
        <Icon className="size-5" />
      </div>
      <h3 className="relative z-10 mt-4 text-sm font-semibold text-[var(--gorila-text)]">{title}</h3>
      <p className="relative z-10 mt-2 max-w-sm text-sm leading-6 text-[var(--gorila-text-muted)]">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button className="mt-5" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
