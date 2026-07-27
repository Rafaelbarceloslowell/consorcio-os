import Link from "next/link"

import type {
  ClientListView,
} from "@/types/client-list"

type ClientListProps = {
  view: ClientListView
}

export function ClientList({
  view,
}: ClientListProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section
        aria-labelledby="client-list-title"
        className="gorila-material overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#15191F]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_22px_48px_rgba(0,0,0,0.2)]"
      >
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
              Relacionamento
            </p>
            <h1
              id="client-list-title"
              className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#F5F7FA]"
            >
              Clientes
            </h1>
            <p className="mt-2 text-sm text-[#96A0AF]">
              {view.clients.length}{" "}
              {view.clients.length === 1
                ? "cliente cadastrado"
                : "clientes cadastrados"}
            </p>
          </div>

          <Link
            href="/clients/new"
            className="shrink-0 rounded-lg border border-[#43A972]/40 px-3 py-2 text-sm font-medium text-[#63C68C] hover:bg-[#43A972]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
          >
            Novo cliente
          </Link>
        </header>

        {view.clients.length === 0 ? (
          <div
            role="status"
            className="px-5 py-10 text-center sm:px-6"
          >
            <p className="text-sm font-medium text-[#D6DBE3]">
              Ainda não existem clientes cadastrados.
            </p>
            <p className="mt-2 text-sm text-[#96A0AF]">
              Cadastre o primeiro cliente para iniciar o relacionamento comercial.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {view.clients.map(
              (client) => (
                <li
                  key={client.id}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-[#F5F7FA]">
                        {client.name}
                      </h2>
                      <p className="mt-1 text-xs text-[#697384]">
                        {client.typeLabel}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#96A0AF]">
                      {client.statusLabel}
                    </span>
                  </div>

                  <dl className="mt-5 grid gap-3 text-xs">
                    <div>
                      <dt className="text-[#697384]">
                        E-mail
                      </dt>
                      <dd className="mt-1 break-all text-[#D6DBE3]">
                        {client.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#697384]">
                        Telefone
                      </dt>
                      <dd className="mt-1 text-[#D6DBE3]">
                        {client.phone}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[#697384]">
                        Documento
                      </dt>
                      <dd className="mt-1 text-[#D6DBE3]">
                        {client.document}
                      </dd>
                    </div>
                  </dl>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </main>
  )
}
