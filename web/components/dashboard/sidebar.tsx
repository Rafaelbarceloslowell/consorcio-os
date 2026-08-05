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
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { BrandIdentity } from "@/components/brand/brand-identity"
import { cn } from "@/lib/utils"
import type { User } from "@/types/dashboard"

type MenuItem = {
  label: string
  icon: LucideIcon
  href: string
  active?: boolean
}

const primaryMenuItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "#dashboard",
    active: true,
  },
  {
    label: "Pipeline",
    icon: Users,
    href: "#pipeline",
  },
  {
    label: "Leads",
    icon: UserCircle,
    href: "/leads",
  },
  {
    label: "Clientes",
    icon: Users,
    href: "/clients",
  },
  {
    label: "Agenda",
    icon: CalendarDays,
    href: "/agenda",
  },
  {
    label: "Propostas",
    icon: FileText,
    href: "/proposals",
  },
  {
    label: "Financeiro",
    icon: CircleDollarSign,
    href: "/finance",
  },
]

const secondaryMenuItems: MenuItem[] = [
  {
    label: "Configurações",
    icon: Settings,
    href: "/settings",
  },
]

type SidebarProps = {
  open: boolean
  onClose: () => void
  user?: User
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

type SidebarNavigationItemProps = {
  item: MenuItem
  collapsed: boolean
  onNavigate: () => void
}

function SidebarNavigationItem({
  item,
  collapsed,
  onNavigate,
}: SidebarNavigationItemProps) {
  const Icon = item.icon

  return (
    <a
      href={item.href}
      aria-current={item.active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        "group relative flex min-h-11 items-center rounded-xl border border-transparent text-sm font-medium outline-none",
        "transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-out",
        "focus-visible:border-[#2F8F5B]/55 focus-visible:shadow-[0_0_0_4px_rgba(47,143,91,0.12)]",
        "hover:-translate-y-px hover:border-white/[0.07] hover:bg-white/[0.035]",
        "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.13),inset_0_-2px_1px_rgba(0,0,0,0.24),0_3px_3px_rgba(0,0,0,0.24),0_12px_24px_rgba(0,0,0,0.20)]",
        "active:translate-y-px active:scale-[0.992] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.28),0_1px_2px_rgba(0,0,0,0.18)]",
        collapsed ? "justify-center px-3" : "gap-3 px-3.5",
        item.active
          ? "border-white/[0.10] bg-white/[0.045] text-[#F5F7FA] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-2px_1px_rgba(0,0,0,0.26),0_3px_3px_rgba(0,0,0,0.28),0_12px_26px_rgba(0,0,0,0.22)]"
          : "text-[#96A0AF] hover:text-[#F5F7FA]"
      )}
    >
      {item.active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#43A972] shadow-[0_0_16px_rgba(47,143,91,0.28)]"
        />
      )}

      <Icon
        className={cn(
          "size-[18px] shrink-0 transition-colors duration-200",
          item.active
            ? "text-[#43A972]"
            : "text-[#697384] group-hover:text-[#D6DBE3]"
        )}
        strokeWidth={1.8}
      />

      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">
            {item.label}
          </span>

        </>
      )}
    </a>
  )
}

function getUserInitials(
  name: string,
): string {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0).toUpperCase(),
      )
      .join("")

  return initials || "US"
}

export function Sidebar({
  open,
  onClose,
  user,
  collapsed = false,
  onCollapsedChange = () => {},
}: SidebarProps) {
  const resolvedUser =
    user ?? {
      id: "current-user",
      name: "Rafael Ramos Barcelos",
      positionTitle:
        "Consultor Sênior",
    }
  function handleNavigation() {
    onClose()
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        aria-label="Navegação principal"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden",
          "border-r border-white/[0.055] bg-[#12151B] text-[#D6DBE3]",
          "shadow-[inset_-1px_0_0_rgba(255,255,255,0.025),8px_0_32px_rgba(0,0,0,0.16)]",
          "transition-[width,transform] duration-250 ease-out",
          "lg:translate-x-0",
          collapsed ? "w-[88px]" : "w-[288px]",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            "flex h-20 shrink-0 items-center border-b border-white/[0.055]",
            collapsed ? "justify-center px-4" : "justify-between px-5"
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center",
              collapsed ? "justify-center" : "gap-3"
            )}
          >
            <BrandIdentity compact={collapsed} />

          </div>

          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="border border-white/[0.05] bg-white/[0.025] text-[#96A0AF] shadow-none hover:-translate-y-px hover:border-white/[0.09] hover:bg-white/[0.045] hover:text-[#F5F7FA] hover:shadow-[0_8px_20px_rgba(0,0,0,0.18)] lg:hidden"
              onClick={onClose}
              aria-label="Fechar menu"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <nav
            className={cn(
              "flex flex-1 flex-col overflow-y-auto py-5",
              collapsed ? "px-3" : "px-4"
            )}
          >
            {!collapsed && (
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#697384]">
                Operação
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              {primaryMenuItems.map((item) => (
                <SidebarNavigationItem
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={handleNavigation}
                />
              ))}
            </div>

            <div className="my-5 h-px bg-white/[0.055]" />

            {!collapsed && (
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#697384]">
                Sistema
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              {secondaryMenuItems.map((item) => (
                <SidebarNavigationItem
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={handleNavigation}
                />
              ))}
            </div>

            {!collapsed && (
              <div className="mt-3 px-1">
                <ThemeToggle />
              </div>
            )}
          </nav>

          <div
            className={cn(
              "shrink-0 border-t border-white/[0.055]",
              collapsed ? "p-3" : "p-4"
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.07]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.24),0_3px_4px_rgba(0,0,0,0.22),0_16px_32px_rgba(0,0,0,0.20)]",
                "transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out",
                "hover:-translate-y-px hover:border-[#2F8F5B]/35 hover:bg-[#2F8F5B]/[0.07]",
                "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.19),inset_0_-2px_1px_rgba(0,0,0,0.26),0_4px_5px_rgba(0,0,0,0.24),0_22px_42px_rgba(0,0,0,0.25)]",
                collapsed
                  ? "flex h-12 items-center justify-center"
                  : "p-3.5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.10] text-[#43A972]">
                  <Bot
                    className="size-[18px]"
                    strokeWidth={1.8}
                  />

                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[#171B22] bg-[#3FB980]" />
                </div>

                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[#F5F7FA]">
                        R2
                      </p>

                      <span className="text-[10px] font-medium text-[#3FB980]">
                        Online
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-[#96A0AF]">
                      Copiloto comercial ativo
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div
              className={cn(
                "mt-3 flex items-center rounded-2xl border border-transparent",
                "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
                "hover:-translate-y-px hover:border-white/[0.06] hover:bg-white/[0.025]",
                "hover:shadow-[0_8px_20px_rgba(0,0,0,0.16)]",
                collapsed
                  ? "justify-center p-2"
                  : "gap-3 p-2.5"
              )}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-xs font-semibold text-[#D6DBE3]">
                {getUserInitials(
                  resolvedUser.name,
                )}
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#F5F7FA]">
                    {resolvedUser.name}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-[#697384]">
                    {resolvedUser.positionTitle ??
                      "Consultor Sênior"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={
            collapsed
              ? "Expandir menu"
              : "Recolher menu"
          }
          title={
            collapsed
              ? "Expandir menu"
              : "Recolher menu"
          }
          onClick={() =>
            onCollapsedChange(
              !collapsed
            )
          }
          className={cn(
            "absolute -right-4 top-[92px] z-10 hidden rounded-full",
            "border border-white/[0.08] bg-[#1D232D] text-[#96A0AF]",
            "shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
            "hover:-translate-y-px hover:border-[#2F8F5B]/30 hover:bg-[#1D232D]",
            "hover:text-[#F5F7FA] hover:shadow-[0_12px_28px_rgba(0,0,0,0.34)]",
            "lg:inline-flex"
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </aside>
    </>
  )
}
