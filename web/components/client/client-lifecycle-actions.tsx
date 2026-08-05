import type {
  ClientStatus,
} from "@/types/domain"

import {
  Button,
} from "@/components/ui/button"

type ClientLifecycleAction =
  () => Promise<void>

type ClientLifecycleActionsProps = {
  status: ClientStatus
  blockAction:
    ClientLifecycleAction
  unblockAction:
    ClientLifecycleAction
  deactivateAction:
    ClientLifecycleAction
  reactivateAction:
    ClientLifecycleAction
}

export function ClientLifecycleActions({
  status,
  blockAction,
  unblockAction,
  deactivateAction,
  reactivateAction,
}: ClientLifecycleActionsProps) {
  return (
    <section
      aria-labelledby="client-lifecycle-title"
      className="gorila-material mt-6 rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] px-6 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.2)] sm:px-8"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
          Situação do cliente
        </p>

        <h2
          id="client-lifecycle-title"
          className="mt-2 text-xl font-semibold tracking-[-0.025em]"
        >
          Ações de lifecycle
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--gorila-text-muted)]">
          Altere a disponibilidade operacional do cliente sem excluir seu histórico.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {status === "active" && (
          <>
            <form action={blockAction}>
              <Button
                type="submit"
                variant="secondary"
              >
                Bloquear cliente
              </Button>
            </form>

            <form action={deactivateAction}>
              <Button
                type="submit"
                variant="destructive"
              >
                Desativar cliente
              </Button>
            </form>
          </>
        )}

        {status === "blocked" && (
          <>
            <form action={unblockAction}>
              <Button
                type="submit"
                variant="primary"
              >
                Desbloquear cliente
              </Button>
            </form>

            <form action={deactivateAction}>
              <Button
                type="submit"
                variant="destructive"
              >
                Desativar cliente
              </Button>
            </form>
          </>
        )}

        {status === "inactive" && (
          <form action={reactivateAction}>
            <Button
              type="submit"
              variant="primary"
            >
              Reativar cliente
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
