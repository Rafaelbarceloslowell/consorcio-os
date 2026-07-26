import { BrandIdentity, BrandMarkSlot } from "@/components/brand/brand-identity"
import { cn } from "@/lib/utils"

type BrandLoadingProps = {
  compact?: boolean
  label?: string
  className?: string
}

export function BrandLoading({
  compact = false,
  label = "Preparando sua operação",
  className,
}: BrandLoadingProps) {
  if (compact) {
    return (
      <div role="status" className={cn("inline-flex items-center gap-3", className)}>
        <BrandMarkSlot className="size-8 animate-pulse rounded-xl" />
        <span className="text-sm text-[var(--gorila-text-muted)]">{label}</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      className={cn(
        "gorila-material relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden rounded-[28px] border",
        "px-8 py-10 text-center",
        className
      )}
    >
      <BrandIdentity showDescriptor={false} />
      <span className="mt-7 h-1 w-36 overflow-hidden rounded-full border border-[var(--gorila-material-border)] bg-[var(--gorila-material-inset)] shadow-[inset_0_1px_2px_rgba(0,0,0,.18)]">
        <span className="gorila-progress block h-full w-1/2 rounded-full bg-[var(--gorila-green-bright)] shadow-[0_0_12px_var(--gorila-green-soft)]" />
      </span>
      <p className="mt-4 text-sm text-[var(--gorila-text-muted)]">{label}</p>
    </div>
  )
}

export function BrandSplash() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--gorila-canvas)] p-6">
      <BrandLoading className="w-full max-w-md" label="Inicializando o Gorila OS" />
    </main>
  )
}
