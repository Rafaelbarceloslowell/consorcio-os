"use client"

import {
  Search,
  X,
} from "lucide-react"
import Link from "next/link"
import {
  useEffect,
  useState,
} from "react"

type GlobalSearchProps = {
  open: boolean
  onClose: () => void
}

type SearchResult = {
  id: string
  name: string
  email: string
  phone: string
  companyName: string | null
  status: string
  stage: string
  consultant: string
  lastInteractionAt: string | null
  opportunityHref: string | null
}

type SearchResponse = {
  results: SearchResult[]
}

export function GlobalSearch({
  open,
  onClose,
}: GlobalSearchProps) {
  const [search, setSearch] =
    useState("")
  const [results, setResults] =
    useState<SearchResult[]>([])
  const [loading, setLoading] =
    useState(false)
  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSearch("")
      setResults([])
      setError(null)
      return
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
    }
  }, [open, onClose])

  useEffect(() => {
    const normalizedSearch =
      search.trim()

    if (!open || !normalizedSearch) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    const controller =
      new AbortController()

    const timeout = window.setTimeout(
      async () => {
        setLoading(true)
        setError(null)

        try {
          const response = await fetch(
            `/api/search?q=${encodeURIComponent(
              normalizedSearch,
            )}`,
            {
              signal: controller.signal,
              cache: "no-store",
            },
          )

          if (!response.ok) {
            throw new Error(
              "Não foi possível realizar a pesquisa.",
            )
          }

          const data =
            (await response.json()) as SearchResponse

          setResults(data.results)
        } catch (requestError) {
          if (
            requestError instanceof DOMException &&
            requestError.name === "AbortError"
          ) {
            return
          }

          setResults([])
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Erro inesperado na pesquisa.",
          )
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false)
          }
        }
      },
      300,
    )

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [open, search])

  if (!open) {
    return null
  }

  const hasSearch =
    search.trim().length > 0

  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Pesquisa global"
        className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-[#15191F] p-4 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <Search className="size-5 text-[#43A972]" />

          <input
            autoFocus
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Nome, telefone, e-mail, CPF ou empresa..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#697384]"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pesquisa"
            className="rounded-xl p-2 text-[#96A0AF] hover:bg-white/[0.05] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {!hasSearch ? (
            <p className="p-4 text-sm text-[#96A0AF]">
              Digite o nome ou o telefone do lead.
            </p>
          ) : loading ? (
            <p
              role="status"
              className="p-4 text-sm text-[#96A0AF]"
            >
              Pesquisando...
            </p>
          ) : error ? (
            <p
              role="alert"
              className="p-4 text-sm text-red-300"
            >
              {error}
            </p>
          ) : results.length === 0 ? (
            <p
              role="status"
              className="p-4 text-sm text-[#96A0AF]"
            >
              Nenhum lead encontrado.
            </p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-white/[0.06] overflow-y-auto">
              {results.map((result) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#F5F7FA]">
                          {result.name}
                        </p>

                        {result.companyName ? (
                          <p className="mt-1 truncate text-xs text-[#96A0AF]">
                            {result.companyName}
                          </p>
                        ) : null}
                      </div>

                      <span className="shrink-0 rounded-full border border-[#43A972]/20 bg-[#2F8F5B]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#63C68C]">
                        {result.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1 text-xs text-[#96A0AF] sm:grid-cols-2">
                      <span>
                        {result.phone}
                      </span>
                      <span className="truncate">
                        {result.email}
                      </span>
                      <span>
                        Etapa: {result.stage}
                      </span>
                      <span>
                        Consultor: {result.consultant}
                      </span>
                    </div>

                    {!result.opportunityHref ? (
                      <p className="mt-3 text-xs text-[#697384]">
                        Lead sem oportunidade aberta.
                      </p>
                    ) : null}
                  </>
                )

                return (
                  <li key={result.id}>
                    {result.opportunityHref ? (
                      <Link
                        href={
                          result.opportunityHref
                        }
                        onClick={onClose}
                        className="block p-4 transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#43A972]"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className="p-4">
                        {content}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
