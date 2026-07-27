import Link from "next/link"

import type {
  ClientDetailsView,
} from "@/types/client-details"

import {
  CLIENT_PERSON_TYPE_LABELS,
  CLIENT_STATUS_LABELS,
} from "./client-labels"

type ClientDetailsProps = {
  client: ClientDetailsView
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      dateStyle: "short",
    },
  ).format(new Date(value))
}

function formatCalendarDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone: "UTC",
      dateStyle: "short",
    },
  ).format(new Date(value))
}

function optionalValue(
  value: string | null,
): string {
  return value ??
    "Não informado"
}

export function ClientDetails({
  client,
}: ClientDetailsProps) {
  const address = [
    `${client.address.street}, ${client.address.number}`,
    client.address.complement,
    client.address.neighborhood,
    `${client.address.city} - ${client.address.state}`,
    client.address.zipCode,
  ]
    .filter(
      (value):
        value is string =>
          value !== null,
    )
    .join(" · ")

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/clients"
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Voltar para clientes
        </Link>

        <section
          aria-labelledby="client-title"
          className="gorila-material mt-6 overflow-hidden rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.2)]"
        >
          <header className="border-b border-[var(--gorila-line)] px-6 py-6 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              Cliente
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1
                id="client-title"
                className="text-3xl font-semibold tracking-[-0.045em]"
              >
                {client.name}
              </h1>
              <span className="rounded-full border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] px-3 py-1 text-xs font-semibold">
                {
                  CLIENT_STATUS_LABELS[
                    client.status
                  ]
                }
              </span>
            </div>
          </header>

          <dl className="grid gap-px bg-[var(--gorila-line)] sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              label="Tipo de pessoa"
              value={
                CLIENT_PERSON_TYPE_LABELS[
                  client.type
                ]
              }
            />
            <Detail
              label="Documento"
              value={client.document}
            />
            <Detail
              label="Responsável"
              value={client.consultantName}
            />
            <Detail
              label="E-mail"
              value={client.email}
            />
            <Detail
              label="Telefone"
              value={client.phone}
            />
            <Detail
              label="Nascimento"
              value={
                client.birthDate
                  ? formatCalendarDate(
                      client.birthDate,
                    )
                  : "Não informado"
              }
            />
            <Detail
              label="Razão social"
              value={optionalValue(
                client.companyName,
              )}
            />
            <Detail
              label="Nome fantasia"
              value={optionalValue(
                client.tradeName,
              )}
            />
            <Detail
              label="Inscrição estadual"
              value={optionalValue(
                client.stateRegistration,
              )}
            />
            <Detail
              label="Endereço"
              value={address}
            />
            <Detail
              label="Criado em"
              value={formatDate(
                client.createdAt,
              )}
            />
            <Detail
              label="Atualizado em"
              value={formatDate(
                client.updatedAt,
              )}
            />
          </dl>
        </section>
      </div>
    </main>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="bg-[var(--gorila-surface)] px-6 py-5 sm:px-8">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--gorila-text-muted)]">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium">
        {value}
      </dd>
    </div>
  )
}
