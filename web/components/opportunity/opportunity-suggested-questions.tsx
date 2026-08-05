import type {
  OpportunitySuggestedQuestionView,
} from "@/types/opportunity-details"

type OpportunitySuggestedQuestionsProps = {
  questions: OpportunitySuggestedQuestionView[]
}

export function OpportunitySuggestedQuestions({
  questions,
}: OpportunitySuggestedQuestionsProps) {
  if (questions.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="opportunity-suggested-questions-title"
      className="border-b border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] px-6 py-6 sm:px-8"
      data-testid="opportunity-suggested-questions"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
            Guia de descoberta
          </p>
          <h2
            id="opportunity-suggested-questions-title"
            className="mt-2 text-xl font-semibold tracking-[-0.035em]"
          >
            Perguntas sugeridas pelo R2
          </h2>
        </div>
        <span className="rounded-full border border-[#43A972]/30 bg-[#2F8F5B]/12 px-3 py-1 text-xs font-semibold text-[#6FD39B]">
          SPIN
        </span>
      </div>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--gorila-text-soft)]">
        Use como guia de conversa e faça uma pergunta por vez. Ajuste a linguagem ao momento do cliente.
      </p>

      <ol className="mt-5 grid gap-3 lg:grid-cols-2">
        {questions.map((item, index) => (
          <li
            key={item.kind}
            className="rounded-2xl border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-4"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#43A972]/30 bg-[#2F8F5B]/15 text-xs font-semibold text-[#6FD39B]"
              >
                {index + 1}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gorila-text-muted)]">
                {item.label}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-6 text-[var(--gorila-text)]">
              {item.question}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
