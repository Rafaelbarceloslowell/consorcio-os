import { ArrowRight, Clock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Task, TaskPriority } from "@/types/dashboard"

const priorityStyles: Record<TaskPriority, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
}

const priorityLabels: Record<TaskPriority, string> = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
}

type UpcomingTasksProps = {
  tasks: Task[]
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Próximas tarefas</CardTitle>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver todas
          <ArrowRight className="size-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{task.title}</p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5 shrink-0" />
                <span>{task.time}</span>
              </div>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                priorityStyles[task.priority]
              )}
            >
              {priorityLabels[task.priority]}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
