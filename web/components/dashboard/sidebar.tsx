"use client"

import {
  Bot,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  Settings,
  Target,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import {
  usePathname,
} from "next/navigation"

import {
  BrandIdentity,
} from "@/components/brand/brand-identity"
import {
  GorilaR2Avatar3D,
} from "@/components/dashboard/gorila-r2-avatar-3d"
import {
  cn,
} from "@/lib/utils"
import type {
  User,
} from "@/types/dashboard"

type MenuItem = Readonly<{
  label: string
  icon: LucideIcon
  href: string
}>

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Pipeline", icon: Target, href: "/#pipeline" },
  { label: "Leads", icon: UserRound, href: "/leads" },
  { label: "Clientes", icon: UsersRound, href: "/clients" },
  { label: "Agenda", icon: CalendarDays, href: "/agenda" },
  { label: "Propostas", icon: FileText, href: "/proposals" },
  { label: "Financeiro", icon: CircleDollarSign, href: "/finance" },
]

type SidebarProps = Readonly<{
  open: boolean
  onClose: () => void
  user?: User
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}>

function isActive(
  pathname: string,
  href: string,
) {
  if (href === "/") return pathname === "/"
  if (href === "/#pipeline") return false
  return pathname.startsWith(href)
}

function UserInitials({
  name,
}: Readonly<{
  name: string
}>) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "US"

  return <>{initials}</>
}

export function Sidebar({
  open,
  onClose,
  user,
  collapsed = false,
  onCollapsedChange = () => {},
}: SidebarProps) {
  const pathname = usePathname() ?? "/"
  const resolvedUser = user ?? {
    id: "current-user",
    name: "Rafael Ramos Barcelos",
    positionTitle: "Consultor Sênior",
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        aria-label="Navegação principal"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--gorila-line)] bg-[var(--gorila-sidebar)]",
          "shadow-[inset_-1px_0_0_rgba(255,247,229,0.025),12px_0_38px_rgba(0,0,0,0.18)] transition-[width,transform] duration-200",
          "lg:translate-x-0",
          collapsed ? "w-[84px]" : "w-[248px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn(
          "flex h-[92px] shrink-0 items-center border-b border-[var(--gorila-line)]",
          collapsed ? "justify-center px-3" : "justify-between px-5",
        )}>
          <BrandIdentity compact={collapsed} />

          {!collapsed ? (
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-xl border border-[var(--gorila-line)] text-[var(--gorila-text-muted)] lg:hidden"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-5">
          {!collapsed ? (
            <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--gorila-text-muted)]">
              Operação comercial
            </p>
          ) : null}

          <nav className="space-y-1" aria-label="Operação comercial">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(pathname, item.href)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                  onClick={onClose}
                  className={cn(
                    "group flex h-11 items-center rounded-[14px] border text-[13px] font-medium outline-none transition duration-200",
                    "focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]",
                    collapsed ? "justify-center px-2" : "gap-3 px-3",
                    active
                      ? "border-[var(--gorila-material-border-strong)] bg-[var(--gorila-green-soft)] text-[var(--gorila-text)]"
                      : "border-transparent text-[var(--gorila-text-muted)] hover:bg-white/[0.035] hover:text-[var(--gorila-text-soft)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[17px] shrink-0",
                      active
                        ? "text-[var(--gorila-green-bright)]"
                        : "text-[var(--gorila-text-muted)]",
                    )}
                    strokeWidth={1.7}
                  />
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-6">
            {!collapsed ? (
              <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--gorila-text-muted)]">
                R2 Copilot
              </p>
            ) : null}

            <Link
              href="/#r2-command"
              onClick={onClose}
              aria-label="Ver ação do R2"
              className={cn(
                "block rounded-[18px] border border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] transition duration-200 hover:border-[var(--gorila-green)] hover:bg-[var(--gorila-green-soft)]",
                collapsed ? "p-1.5" : "p-3",
              )}
            >
              <div className={cn(
                "flex items-center",
                collapsed ? "justify-center" : "gap-2.5",
              )}>
                <GorilaR2Avatar3D size="compact" state="working" />
                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[var(--gorila-text)]">
                      R2
                      <span className="size-1.5 rounded-full bg-[var(--gorila-green-bright)]" />
                    </span>
                    <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-[var(--gorila-green-bright)]">
                      Monitorando
                    </span>
                    <span className="mt-1 block text-[10px] text-[var(--gorila-text-muted)]">
                      Copiloto comercial ativo
                    </span>
                  </span>
                ) : null}
              </div>

              {!collapsed ? (
                <span className="mt-3 flex h-8 items-center justify-center gap-2 rounded-xl border border-[var(--gorila-line)] text-[10px] font-medium text-[var(--gorila-text-soft)]">
                  <Bot className="size-3.5" />
                  Ver ação do R2
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <div className={cn(
          "border-t border-[var(--gorila-line)]",
          collapsed ? "p-3" : "p-4",
        )}>
          <Link
            href="/settings"
            aria-label={`Abrir perfil de ${resolvedUser.name}`}
            className={cn(
              "flex items-center rounded-[16px] border border-transparent transition duration-200 hover:border-[var(--gorila-line)] hover:bg-white/[0.025]",
              collapsed ? "justify-center p-1" : "gap-3 p-2",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--gorila-line)] bg-[var(--gorila-bronze-soft)] text-[10px] font-semibold text-[var(--gorila-text-soft)]">
              <UserInitials name={resolvedUser.name} />
            </span>
            {!collapsed ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-[var(--gorila-text)]">
                  {resolvedUser.name}
                </span>
                <span className="mt-1 block truncate text-[10px] text-[var(--gorila-text-muted)]">
                  {resolvedUser.positionTitle ?? "Operação"}
                </span>
              </span>
            ) : null}
            {!collapsed ? <Settings className="size-3.5 text-[var(--gorila-text-muted)]" /> : null}
          </Link>

          <button
            type="button"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => onCollapsedChange(!collapsed)}
            className="mt-2 hidden h-8 w-full items-center justify-center rounded-xl text-[var(--gorila-text-muted)] transition hover:bg-white/[0.035] hover:text-[var(--gorila-text-soft)] lg:flex"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
      </aside>
    </>
  )
}
