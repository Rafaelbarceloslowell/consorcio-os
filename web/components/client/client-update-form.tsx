"use client"

import Link from "next/link"
import {
  useActionState,
  useState,
} from "react"

import {
  Button,
} from "@/components/ui/button"
import {
  Input,
} from "@/components/ui/input"
import {
  Select,
} from "@/components/ui/select"

import type {
  ClientUpdateActionState,
  ClientUpdateFormView,
} from "@/types/client-update"

type Props = {
  client: ClientUpdateFormView
  action: (
    state:
      ClientUpdateActionState,
    formData: FormData,
  ) => Promise<ClientUpdateActionState>
}

const INITIAL_STATE:
  ClientUpdateActionState = {
    status: "idle",
    message: null,
  }

export function ClientUpdateForm({
  client,
  action,
}: Props) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    action,
    INITIAL_STATE,
  )
  const values =
    state.status === "error"
      ? state.values
      : client
  const [type, setType] =
    useState<
      "individual" | "company"
    >(
      values.type === "company"
        ? "company"
        : "individual",
    )
  const detailsPath =
    `/clients/${encodeURIComponent(
      client.id,
    )}`

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href={detailsPath}
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Cancelar e voltar ao cliente
        </Link>

        <section className="gorila-material mt-6 rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6 sm:p-8">
          <h1 className="text-3xl font-semibold">
            Editar cliente
          </h1>

          <form
            action={formAction}
            className="mt-8 space-y-6"
          >
            {state.status ===
              "error" && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {state.message}
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Tipo de pessoa"
                htmlFor="type"
              >
                <Select
                  id="type"
                  name="type"
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target
                        .value ===
                        "company"
                        ? "company"
                        : "individual",
                    )
                  }
                  required
                >
                  <option value="individual">
                    Pessoa física
                  </option>
                  <option value="company">
                    Pessoa jurídica
                  </option>
                </Select>
              </Field>

              <Field
                label={
                  type === "company"
                    ? "Razão social"
                    : "Nome"
                }
                htmlFor={
                  type === "company"
                    ? "companyName"
                    : "name"
                }
              >
                <Input
                  id={
                    type === "company"
                      ? "companyName"
                      : "name"
                  }
                  name={
                    type === "company"
                      ? "companyName"
                      : "name"
                  }
                  defaultValue={
                    type === "company"
                      ? values.companyName
                      : values.name
                  }
                  required
                />
              </Field>

              <Field label="Documento" htmlFor="document">
                <Input id="document" name="document" defaultValue={values.document} required />
              </Field>
              <Field label="E-mail" htmlFor="email">
                <Input id="email" name="email" type="email" defaultValue={values.email} required />
              </Field>
              <Field label="Código do país" htmlFor="phoneCountryCode">
                <Input id="phoneCountryCode" name="phoneCountryCode" defaultValue={values.phoneCountryCode} />
              </Field>
              <Field label="Telefone" htmlFor="phone">
                <Input id="phone" name="phone" type="tel" defaultValue={values.phone} required />
              </Field>
              <Field label="Consultor" htmlFor="consultantId">
                <Select id="consultantId" name="consultantId" defaultValue={values.consultantId} required>
                  {client.consultants.map(
                    (consultant) => (
                      <option key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </option>
                    ),
                  )}
                </Select>
              </Field>
              <Field label="Logradouro" htmlFor="addressStreet">
                <Input id="addressStreet" name="addressStreet" defaultValue={values.addressStreet} required />
              </Field>
              <Field label="Número" htmlFor="addressNumber">
                <Input id="addressNumber" name="addressNumber" defaultValue={values.addressNumber} required />
              </Field>
              <Field label="Complemento" htmlFor="addressComplement">
                <Input id="addressComplement" name="addressComplement" defaultValue={values.addressComplement} />
              </Field>
              <Field label="Bairro" htmlFor="addressNeighborhood">
                <Input id="addressNeighborhood" name="addressNeighborhood" defaultValue={values.addressNeighborhood} required />
              </Field>
              <Field label="Cidade" htmlFor="addressCity">
                <Input id="addressCity" name="addressCity" defaultValue={values.addressCity} required />
              </Field>
              <Field label="Estado" htmlFor="addressState">
                <Input id="addressState" name="addressState" defaultValue={values.addressState} required />
              </Field>
              <Field label="CEP" htmlFor="addressZipCode">
                <Input id="addressZipCode" name="addressZipCode" defaultValue={values.addressZipCode} required />
              </Field>
            </div>

            <div className="flex justify-end gap-3">
              <Link
                href={detailsPath}
                className="rounded-lg border border-[var(--gorila-line)] px-4 py-2 text-sm font-medium"
              >
                Cancelar
              </Link>
              <Button
                type="submit"
                loading={pending}
                loadingText="Salvando"
              >
                Salvar alterações
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium"
      >
        {label}
      </label>
      {children}
    </div>
  )
}
