"use client"

import {
  Search,
  X,
} from "lucide-react"

type GlobalSearchProps = {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({
  open,
  onClose,
}: GlobalSearchProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-24 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-white/[0.08] bg-[#15191F] p-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <Search className="size-5 text-[#43A972]" />

          <input
            autoFocus
            placeholder="Pesquisar no Gorila OS..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#697384]"
          />

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#96A0AF] hover:bg-white/[0.05] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-[#96A0AF]">
          Digite para buscar clientes, oportunidades e ações.
        </div>
      </div>
    </div>
  )
}

