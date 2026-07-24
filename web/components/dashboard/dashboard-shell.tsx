"use client"

import { Menu } from "lucide-react"
import { useState } from "react"

import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import type { DashboardData } from "@/types/dashboard"

type DashboardShellProps = DashboardData

export function DashboardShell({
  user,
  summary,
  metrics,
  tasks,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </Button>
          <span className="font-semibold">ConsórcioOS</span>
        </header>

        <main className="flex-1 overflow-auto">
          <DashboardContent
            user={user}
            summary={summary}
            metrics={metrics}
            tasks={tasks}
          />
        </main>
      </div>
    </div>
  )
}
