import {
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  Command,
  Search,
  Sparkles,
} from "lucide-react"

import { formatGreeting } from "@/lib/formatters"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { User } from "@/types/dashboard"

type DashboardHeaderProps = {
  user: User
  summary: string
  priorityCount?: number
}

function getUserInitials(name: string) {
  const normalizedName = name.trim()

  if (!normalizedName) {
    return "US"
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

export function DashboardHeader({
  user,
  summary,
  priorityCount = 0,
}: DashboardHeaderProps) {
  const initials = getUserInitials(user.name)

  const operationalContext =
    priorityCount === 1
      ? "Hoje existe 1 ação prioritária na operação."
      : `Hoje existem ${priorityCount} ações prioritárias na operação.`

  return (
    <header className="gorila-material relative overflow-hidden rounded-[28px] border border-white/[0.065] bg-[#15191F]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.13),inset_0_-1px_0_rgba(0,0,0,0.24),0_4px_7px_rgba(0,0,0,0.20),0_24px_56px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 size-[420px] rounded-full bg-[#2F8F5B]/[0.09] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-0 size-72 rounded-full bg-white/[0.018] blur-3xl"
      />

      <div className="relative">
        <div className="flex flex-col gap-6 border-b border-white/[0.055] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
              <Sparkles className="size-3.5 text-[#43A972]" />

              Operação comercial
            </div>

            <div className="mt-2 flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-[-0.045em] text-[#F5F7FA] sm:text-3xl">
                Dashboard
              </h1>

              <p className="text-sm leading-6 text-[#96A0AF]">
                {operationalContext}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:max-w-[760px] lg:flex-row lg:items-center lg:justify-end">
            <label className="group relative block min-w-0 flex-1 lg:max-w-[420px]">
              <span className="sr-only">
                Buscar clientes, leads, grupos ou cotas
              </span>

              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#747A76] transition-colors duration-200 group-focus-within:text-[#43A972]" />

              <input
                type="search"
                placeholder="Buscar clientes, leads, grupos, cotas..."
                className="h-11 w-full rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] pl-11 pr-14 text-sm text-[var(--gorila-text)] shadow-[inset_0_2px_5px_rgba(0,0,0,0.22),inset_0_-1px_0_rgba(255,255,255,0.08)] outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 placeholder:text-[var(--gorila-text-muted)] hover:-translate-y-px hover:border-[#2F8F5B]/30 hover:shadow-[inset_0_2px_5px_rgba(0,0,0,0.24),inset_0_-1px_0_rgba(255,255,255,0.12),0_4px_6px_rgba(0,0,0,0.18),0_12px_26px_rgba(0,0,0,0.17)] focus:border-[#2F8F5B]/45 focus:shadow-[inset_0_2px_5px_rgba(0,0,0,0.24),0_5px_8px_rgba(0,0,0,0.18),0_16px_30px_rgba(0,0,0,0.18),0_0_0_4px_rgba(47,143,91,0.10)]"
              />

              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.035] px-2 py-1 text-[10px] font-medium text-[#697384] sm:inline-flex">
                <Command className="size-3" />K
              </span>
            </label>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Abrir notificações"
                className="group relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-subtle)] text-[var(--gorila-text-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_1px_rgba(0,0,0,0.24),0_2px_3px_rgba(0,0,0,0.24),0_8px_18px_rgba(0,0,0,0.16)] outline-none transition-[border-color,background-color,box-shadow,color,transform] duration-200 hover:-translate-y-0.5 hover:scale-[1.015] hover:border-[#2F8F5B]/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.23),inset_0_-3px_2px_rgba(0,0,0,0.26),0_4px_4px_rgba(0,0,0,0.28),0_16px_30px_rgba(0,0,0,0.22)] focus-visible:border-[#2F8F5B]/50 focus-visible:shadow-[0_0_0_4px_rgba(47,143,91,0.12)] active:translate-y-px active:scale-[0.985] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.18)]"
              >
                <Bell className="size-[18px]" />

                <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-[#43A972] shadow-[0_0_0_3px_rgba(47,143,91,0.14)]" />
              </button>

              <div className="hidden h-11 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3 sm:flex">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#3FB980] opacity-25" />

                  <span className="relative inline-flex size-2.5 rounded-full bg-[#3FB980]" />
                </span>

                <div className="leading-none">
                  <span className="block text-xs font-semibold text-[#F5F7FA]">
                    R2
                  </span>

                  <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#697384]">
                    Monitorando
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Abrir menu do usuário"
                className="group flex h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-subtle)] px-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_1px_rgba(0,0,0,0.24),0_2px_3px_rgba(0,0,0,0.24),0_8px_18px_rgba(0,0,0,0.16)] outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:scale-[1.015] hover:border-[#2F8F5B]/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.23),inset_0_-3px_2px_rgba(0,0,0,0.26),0_4px_4px_rgba(0,0,0,0.28),0_16px_30px_rgba(0,0,0,0.22)] focus-visible:border-[#2F8F5B]/50 focus-visible:shadow-[0_0_0_4px_rgba(47,143,91,0.12)] active:translate-y-px active:scale-[0.985] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.18)] sm:flex-none"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10] text-[11px] font-semibold text-[#43A972]">
                  {initials}
                </span>

                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-32 truncate text-xs font-semibold text-[#F5F7FA]">
                    {user.name}
                  </span>

                  <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.10em] text-[#697384]">
                    Supervisor
                  </span>
                </span>

                <ChevronDown className="ml-auto hidden size-3.5 shrink-0 text-[#697384] sm:block" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)] lg:px-7 lg:py-7">
          <div>
            <p className="text-sm font-medium text-[#43A972]">
              {formatGreeting(user.name)}
            </p>

            <h2 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.045em] text-[#F5F7FA] sm:text-3xl lg:text-[34px]">
              O R2 organizou o que merece sua atenção hoje.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#96A0AF] sm:text-[15px]">
              Consulte os indicadores, priorize os próximos movimentos e
              acompanhe o ritmo da operação em um único ambiente.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-black/[0.13] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.28),0_3px_4px_rgba(0,0,0,0.22),0_16px_34px_rgba(0,0,0,0.18)] transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-black/[0.13] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-2px_1px_rgba(0,0,0,0.28),0_5px_6px_rgba(0,0,0,0.26),0_24px_46px_rgba(0,0,0,0.24)] sm:p-5">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10] text-[#43A972]">
                <Bot className="size-[18px]" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-[-0.02em] text-[#F5F7FA]">
                    Resumo do R2
                  </h3>

                  <span className="inline-flex items-center gap-1 text-[11px] text-[#697384]">
                    <CheckCircle2 className="size-3.5 text-[#3FB980]" />
                    atualizado agora
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-[#D6DBE3]">
                  {summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
