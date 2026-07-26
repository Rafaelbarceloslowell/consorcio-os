"use client"

import { Menu } from "lucide-react"
import { useState } from "react"

import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { Sidebar } from "@/components/dashboard/sidebar"
import { BrandIdentity } from "@/components/brand/brand-identity"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DashboardData } from "@/types/dashboard"

type DashboardShellProps = DashboardData

export function DashboardShell({
  user,
  summary,
  metrics,
  tasks,
  intelligence,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--gorila-canvas)] text-[var(--gorila-text)]">
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onCollapsedChange={setSidebarCollapsed}
      />

      <div
        className={cn(
          "min-h-screen transition-[padding-left] duration-250 ease-out",
          sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[288px]"
        )}
      >
        <header className="sticky top-0 z-30 border-b border-[var(--gorila-line)] bg-[var(--gorila-canvas)]/85 backdrop-blur-xl lg:hidden">
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

        <main className="min-h-screen">
          <DashboardContent
            user={user}
            summary={summary}
            metrics={metrics}
            tasks={tasks}
            intelligence={intelligence}
          />
        </main>
      </div>
    </div>
  )
}
