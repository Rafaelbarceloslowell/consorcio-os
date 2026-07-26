import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
} from "lucide-react"

import {
  cn,
} from "@/lib/utils"
import { BrandEmptyState } from "@/components/brand/brand-empty-state"

import type {
  Task,
  TaskPriority,
} from "@/types/dashboard"

const priorityStyles: Record<
  TaskPriority,
  string
> = {
  high:
    "border-[#E16A6A]/15 bg-[#E16A6A]/[0.07] text-[#E98A8A]",

  medium:
    "border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10] text-[#43A972]",

  low:
    "border-white/[0.06] bg-white/[0.035] text-[#96A0AF]",
}

const priorityLabels: Record<
  TaskPriority,
  string
> = {
  high: "Crítico",
  medium: "Importante",
  low: "Acompanhamento",
}

type UpcomingTasksProps = {
  tasks: Task[]
}

export function UpcomingTasks({
  tasks,
}: UpcomingTasksProps) {
  return (
    <section
      aria-labelledby="upcoming-tasks-title"
      className="gorila-material relative overflow-hidden rounded-[24px] border border-white/[0.065] bg-[#15191F]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.24),0_3px_5px_rgba(0,0,0,0.20),0_20px_44px_rgba(0,0,0,0.20)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 border-b border-white/[0.055] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.065] bg-white/[0.035] text-[#D6DBE3]">
            <ListTodo className="size-[18px]" />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
              Execução comercial
            </p>

            <h2
              id="upcoming-tasks-title"
              className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#F5F7FA]"
            >
              Próximas tarefas
            </h2>
          </div>
        </div>

        <button
          type="button"
          className="group inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3.5 text-xs font-medium text-[#96A0AF] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-2px_1px_rgba(0,0,0,0.24),0_2px_3px_rgba(0,0,0,0.22),0_8px_16px_rgba(0,0,0,0.14)] outline-none transition-[border-color,background-color,box-shadow,color,transform] duration-200 hover:-translate-y-0.5 hover:scale-[1.015] hover:border-white/[0.10] hover:bg-white/[0.025] hover:text-[#F5F7FA] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-3px_2px_rgba(0,0,0,0.26),0_4px_4px_rgba(0,0,0,0.26),0_15px_28px_rgba(0,0,0,0.20)] focus-visible:border-[#2F8F5B]/50 focus-visible:shadow-[0_0_0_4px_rgba(47,143,91,0.12)] active:translate-y-px active:scale-[0.985] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.18)]"
        >
          Ver todas

          <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        {tasks.length === 0 ? (
          <BrandEmptyState
            icon={CheckCircle2}
            title="Operação em dia"
            description="O R2 está acompanhando sua operação. Novas ações prioritárias aparecerão aqui no momento certo."
          />
        ) : (
          <div className="space-y-2">
            {tasks.map(
              (
                task,
                index
              ) => (
                <article
                  key={task.id}
                  className="group flex items-center gap-4 rounded-[18px] border border-transparent px-3 py-3.5 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-white/[0.065] hover:bg-white/[0.025] hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)] sm:px-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.055] bg-black/[0.12] text-xs font-semibold text-[#697384]">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#D6DBE3] transition-colors duration-200 group-hover:text-[#F5F7FA]">
                      {task.title}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#697384]">
                      <Clock className="size-3.5 shrink-0" />

                      <span>
                        {task.time}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.10em]",
                      priorityStyles[
                        task.priority
                      ]
                    )}
                  >
                    {
                      priorityLabels[
                        task.priority
                      ]
                    }
                  </span>

                  <ArrowRight className="hidden size-4 shrink-0 text-[#4F5867] transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:text-[#96A0AF] sm:block" />
                </article>
              )
            )}
          </div>
        )}
      </div>
    </section>
  )
}
