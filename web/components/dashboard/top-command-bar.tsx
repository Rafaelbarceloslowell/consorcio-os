"use client"

import {
  Bot,
  Search,
  Settings,
} from "lucide-react"
import Link from "next/link"
import {
  usePathname,
} from "next/navigation"
import {
  useState,
} from "react"

import {
  GlobalSearch,
} from "@/components/search/global-search"
import type {
  User,
} from "@/types/dashboard"

const commandItems = [
  { label: "Home", href: "/" },
  { label: "Pipeline", href: "/#pipeline" },
  { label: "Leads", href: "/leads" },
  { label: "Clientes", href: "/clients" },
  { label: "Agenda", href: "/agenda" },
  { label: "Propostas", href: "/proposals" },
  { label: "Financeiro", href: "/finance" },
] as const

function isActivePath(
  pathname: string,
  href: string,
) {
  if (href === "/") {
    return pathname === "/"
  }

  if (href === "/#pipeline") {
    return false
  }

  return pathname.startsWith(href)
}

export function TopCommandBar({
  user,
}: Readonly<{
  user: User
}>) {
  const pathname = usePathname() ?? "/"
  const [searchOpen, setSearchOpen] =
    useState(false)

  return (
    <>
      <div className="sticky top-0 z-40 hidden px-5 pt-4 lg:block 2xl:px-7">
        <div className="gorilla-command-bar mx-auto flex h-[68px] max-w-[1640px] items-center justify-between gap-4 rounded-[24px] px-3">
          <nav
            aria-label="Navegação de comando"
            className="flex min-w-0 flex-1 items-center"
          >
            {commandItems.map((item) => {
              const active = isActivePath(
                pathname,
                item.href,
              )

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "inline-flex h-11 min-w-0 items-center justify-center rounded-[16px] px-4 text-[11px] font-medium uppercase tracking-[0.055em] outline-none",
                    "transition-[background-color,border-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]",
                    active
                      ? "border border-[var(--gorila-material-border-strong)] bg-[var(--gorila-green-soft)] text-[var(--gorila-text)]"
                      : "border border-transparent text-[var(--gorila-text-muted)] hover:bg-white/[0.035] hover:text-[var(--gorila-text-soft)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 border-l border-[var(--gorila-line)] pl-3">
            <button
              type="button"
              aria-label="Abrir pesquisa global"
              onClick={() => setSearchOpen(true)}
              className="flex size-11 items-center justify-center rounded-full border border-[var(--gorila-line)] text-[var(--gorila-text-soft)] transition duration-200 hover:border-[var(--gorila-material-border-strong)] hover:bg-white/[0.04] hover:text-[var(--gorila-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]"
            >
              <Search className="size-[18px]" strokeWidth={1.7} />
            </button>

            <Link
              href="/#r2-command"
              aria-label="Ir para o comando do R2"
              className="relative flex size-11 items-center justify-center rounded-full border border-[var(--gorila-line)] text-[var(--gorila-text-soft)] transition duration-200 hover:border-[var(--gorila-green)] hover:bg-[var(--gorila-green-soft)] hover:text-[var(--gorila-green-bright)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]"
            >
              <Bot className="size-[18px]" strokeWidth={1.7} />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--gorila-green-bright)]" />
            </Link>

            <Link
              href="/settings"
              aria-label={`Abrir perfil de ${user.name}`}
              className="flex h-11 max-w-44 items-center gap-2 rounded-full border border-[var(--gorila-line)] px-2.5 text-left transition duration-200 hover:border-[var(--gorila-material-border-strong)] hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gorila-green-bright)]"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-[var(--gorila-green-soft)] text-[10px] font-semibold text-[var(--gorila-green-bright)]">
                {user.name.trim().charAt(0).toUpperCase() || "U"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-[var(--gorila-text)]">
                  {user.name}
                </span>
                <span className="block truncate text-[9px] uppercase tracking-[0.1em] text-[var(--gorila-text-muted)]">
                  {user.positionTitle ?? "Operação"}
                </span>
              </span>
              <Settings className="size-3.5 text-[var(--gorila-text-muted)]" />
            </Link>
          </div>
        </div>
      </div>

      <GlobalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  )
}
