"use client"

import { Menu } from "lucide-react"
import { useState } from "react"

import { BrandIdentity } from "@/components/brand/brand-identity"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { ExternalCrmPilotCard } from "@/components/dashboard/external-crm-pilot-card"
import { Sidebar } from "@/components/dashboard/sidebar"
import { TopCommandBar } from "@/components/dashboard/top-command-bar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/types/dashboard"
import type { ExternalCrmPilotView } from "@/types/external-crm-pilot"

type DashboardShellProps =
  DashboardData & {
    externalCrmPilot?:
      ExternalCrmPilotView
  }

export function DashboardShell({
  workspaceId,
  user,
  summary,
  metrics,
  tasks,
  pipeline,
  opportunities = [],
  intelligence,
  gorilaR2,
  gorilaR2Behavior,
  externalCrmPilot,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="gorilla-dashboard-shell min-h-screen bg-[var(--gorila-canvas)] text-[var(--gorila-text)]">
      <div
        aria-hidden="true"
        className="gorilla-cinematic-canvas"
      />

      <Sidebar
        open={sidebarOpen}
        user={user}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div
        className={cn(
          "relative z-10 min-h-screen transition-[padding-left] duration-250 ease-out",
          sidebarCollapsed ? "lg:pl-[84px]" : "lg:pl-[248px]"
        )}
      >
        <header className="sticky top-0 z-30 border-b border-[var(--gorila-line)] bg-[var(--gorila-canvas)]/90 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center gap-3 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              className="
                rounded-xl
                border border-white/[0.06]
                bg-white/[0.025]
                text-[#D6DBE3]
                shadow-none
                transition-[background-color,border-color,box-shadow,color,transform]
                duration-200
                ease-out
                hover:-translate-y-px
                hover:border-white/[0.1]
                hover:bg-white/[0.045]
                hover:text-[#F5F7FA]
                hover:shadow-[0_10px_24px_rgba(0,0,0,0.24)]
                active:translate-y-0
                active:scale-[0.985]
                active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.18)]
              "
            >
              <Menu className="size-5" />
            </Button>

            <BrandIdentity markClassName="hidden" />
          </div>
        </header>

        <TopCommandBar user={user} />

        <main className="min-h-screen">
          {externalCrmPilot ? (
            <div className="mx-auto w-full max-w-[1680px] px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 2xl:px-10">
              <ExternalCrmPilotCard
                view={externalCrmPilot}
              />
            </div>
          ) : null}

          <DashboardContent
            workspaceId={workspaceId}
            user={user}
            summary={summary}
            metrics={metrics}
            tasks={tasks}
            pipeline={pipeline}
            opportunities={
              opportunities
            }
            intelligence={intelligence}
            gorilaR2={gorilaR2}
            gorilaR2Behavior={gorilaR2Behavior}
          />
        </main>
      </div>
    </div>
  )
}
