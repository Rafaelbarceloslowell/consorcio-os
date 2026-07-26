import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type StatCardProps = {
  title: string
  value: string
  icon: LucideIcon
  description?: string
  iconClassName?: string
  accentClassName?: string
}

export function StatCard({
  title,
  description,
  value,
  icon: Icon,
  iconClassName,
  accentClassName,
}: StatCardProps) {
  return (
    <article className="gorila-material group relative min-h-[178px] overflow-hidden rounded-[22px] border border-white/[0.06] bg-[#15191F]/88 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.24),0_3px_5px_rgba(0,0,0,0.20),0_18px_38px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-1 hover:border-white/[0.10] hover:bg-[#15191F]/88 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_1px_rgba(0,0,0,0.26),0_5px_7px_rgba(0,0,0,0.24),0_26px_52px_rgba(0,0,0,0.25)] active:translate-y-0 active:scale-[0.995] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.24),0_2px_4px_rgba(0,0,0,0.18)]">
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-0 top-0 h-px w-3/4 bg-gradient-to-r",
          accentClassName
        )}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 size-44 rounded-full bg-white/[0.018] blur-3xl"
      />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-[#D6DBE3]">
              {title}
            </h3>

            {description ? (
              <p className="mt-1 text-xs leading-5 text-[#697384]">
                {description}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-[#D6DBE3] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_10px_22px_rgba(0,0,0,0.16)]",
              iconClassName
            )}
          >
            <Icon className="size-[18px]" />
          </div>
        </div>

        <div className="mt-auto pt-6">
          <span className="block break-words text-[30px] font-semibold leading-none tracking-[-0.055em] text-[#F5F7FA] sm:text-[32px]">
            {value}
          </span>
        </div>
      </div>
    </article>
  )
}
