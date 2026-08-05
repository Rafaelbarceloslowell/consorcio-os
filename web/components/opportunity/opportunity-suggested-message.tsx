"use client"

import {
  useState,
} from "react"

type OpportunitySuggestedMessageProps = {
  initialMessage: string
}

export function OpportunitySuggestedMessage({
  initialMessage,
}: OpportunitySuggestedMessageProps) {
  const [message, setMessage] =
    useState(initialMessage)
  const [copyFeedback, setCopyFeedback] =
    useState<string | null>(null)

  async function copyMessage(): Promise<void> {
    setCopyFeedback(null)

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error(
          "Clipboard indisponível",
        )
      }

      await navigator.clipboard.writeText(
        message.trim(),
      )
      setCopyFeedback(
        "Mensagem copiada. Revise antes de usar.",
      )
    }
    catch {
      setCopyFeedback(
        "Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.",
      )
    }
  }

  return (
    <section
      aria-labelledby="opportunity-suggested-message-section-title"
      className="border-b border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-6 py-6 sm:px-8"
      data-testid="opportunity-suggested-message"
    >
      <div className="rounded-2xl border border-[#2F8F5B]/20 bg-[#2F8F5B]/[0.065] p-4">
        <h2
          id="opportunity-suggested-message-section-title"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6FD39B]"
        >
          Mensagem sugerida pelo R2
        </h2>

        <label
          htmlFor="opportunity-suggested-message-text"
          className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#697384]"
        >
          Texto da mensagem
        </label>

        <textarea
          id="opportunity-suggested-message-text"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          rows={6}
          className="mt-2 w-full resize-y rounded-xl border border-white/[0.10] bg-[#0F1412] px-3 py-3 text-sm leading-6 text-[#F5F7FA] outline-none transition focus:border-[#43A972]/55 focus:ring-4 focus:ring-[#2F8F5B]/10"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyMessage}
            disabled={!message.trim()}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.035] px-3.5 text-xs font-semibold text-[#D6DBE3] transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
          >
            Copiar mensagem
          </button>

          <span className="text-xs text-[#697384]">
            O GorillaOS não enviará nada automaticamente.
          </span>
        </div>

        <p
          aria-live="polite"
          className="mt-2 min-h-5 text-xs text-[#6FD39B]"
        >
          {copyFeedback ?? ""}
        </p>
      </div>
    </section>
  )
}
