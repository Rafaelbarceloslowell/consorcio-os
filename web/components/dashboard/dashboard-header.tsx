import { formatGreeting } from "@/lib/formatters"
import type { User } from "@/types/dashboard"

type DashboardHeaderProps = {
  user: User
  summary: string
}

export function DashboardHeader({ user, summary }: DashboardHeaderProps) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {formatGreeting(user.name)}
      </h1>
      <p className="text-muted-foreground">{summary}</p>
    </header>
  )
}
