"use client"

import Link from "next/link"
import {
  useActionState,
  useState,
} from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

import type {
  ClientCreateActionState,
  ClientCreateFormView,
} from "@/types/client-create"

type ClientCreateFormProps = {
  view: ClientCreateFormView
  action: (
    previousState:
      ClientCreateActionState,
    formData: FormData,
  ) => Promise<ClientCreateActionState>
}

const INITIAL_STATE:
  ClientCreateActionState = {
    status: "idle",
    message: null,
  }

const EMPTY_VALUES = {
  type: "individual",
  name: "",
  companyName: "",
  email: "",
  phone: "",
  phoneCountryCode: "55",
  document: "",
  consultantId: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressCity: "",
  addressState: "",
  addressZipCode: "",
}

export function ClientCreateForm({
  view,
  action,
}: ClientCreateFormProps) {
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
      : EMPTY_VALUES
  const fieldErrors =
    state.status === "error"
      ? state.fieldErrors
      : undefined
  const [personType, setPersonType] =
    useState<
      "individual" | "company"
    >(
      values.type === "company"
        ? "company"
        : "individual",
    )
  const [name, setName] = useState(
    values.name,
  )
  const [
    companyName,
    setCompanyName,
  ] = useState(values.companyName)
  const hasConsultants =
    view.consultants.length > 0

  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-[#43A972] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43A972]"
        >
          Cancelar e voltar ao Mission Control
        </Link>

        <section className="gorila-material mt-6 rounded-[28px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_60px_rgba(0,0,0,0.2)] sm:p-8">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#43A972]">
              CRM
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              Novo cliente
            </h1>
          </header>

          {!hasConsultants && (
            <p
              role="status"
              className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
            >
              É necessário cadastrar um consultor antes de criar um cliente.
            </p>
          )}

          <form
            action={formAction}
            className="mt-8 space-y-8"
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

            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="col-span-full text-sm font-semibold">
                Identificação
              </legend>
              <Field
                label="Tipo de pessoa"
                htmlFor="type"
              >
                <Select
                  id="type"
                  name="type"
                  required
                  value={personType}
                  onChange={(event) =>
                    setPersonType(
                      event.target
                        .value ===
                        "company"
                        ? "company"
                        : "individual",
                    )
                  }
                  errorMessage={
                    fieldErrors?.type
                  }
                >
                  <option value="individual">
                    Pessoa física
                  </option>
                  <option value="company">
                    Pessoa jurídica
                  </option>
                </Select>
              </Field>

              {personType ===
              "individual" ? (
                <Field
                  label="Nome"
                  htmlFor="name"
                >
                  <Input
                    id="name"
                    name="name"
                    required
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    errorMessage={
                      fieldErrors?.name
                    }
                  />
                </Field>
              ) : (
                <Field
                  label="Razão social"
                  htmlFor="companyName"
                >
                  <Input
                    id="companyName"
                    name="companyName"
                    required
                    value={
                      companyName
                    }
                    onChange={(event) =>
                      setCompanyName(
                        event.target.value,
                      )
                    }
                    errorMessage={
                      fieldErrors
                        ?.companyName
                    }
                  />
                </Field>
              )}

              <Field
                label={
                  personType ===
                  "individual"
                    ? "CPF"
                    : "CNPJ"
                }
                htmlFor="document"
              >
                <Input
                  id="document"
                  name="document"
                  required
                  inputMode="numeric"
                  defaultValue={
                    values.document
                  }
                  errorMessage={
                    fieldErrors?.document
                  }
                />
              </Field>

              <Field
                label="E-mail"
                htmlFor="email"
              >
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={
                    values.email
                  }
                  errorMessage={
                    fieldErrors?.email
                  }
                />
              </Field>

              <Field
                label="Código do país"
                htmlFor="phoneCountryCode"
              >
                <Input
                  id="phoneCountryCode"
                  name="phoneCountryCode"
                  inputMode="numeric"
                  defaultValue={
                    values.phoneCountryCode
                  }
                  errorMessage={
                    fieldErrors
                      ?.phoneCountryCode
                  }
                />
              </Field>

              <Field
                label="Telefone"
                htmlFor="phone"
              >
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  defaultValue={
                    values.phone
                  }
                  errorMessage={
                    fieldErrors?.phone
                  }
                />
              </Field>

              <Field
                label="Consultor"
                htmlFor="consultantId"
              >
                <Select
                  id="consultantId"
                  name="consultantId"
                  required
                  disabled={
                    !hasConsultants
                  }
                  defaultValue={
                    values.consultantId
                  }
                  placeholder="Selecione um consultor"
                  errorMessage={
                    fieldErrors
                      ?.consultantId
                  }
                >
                  {view.consultants.map(
                    (consultant) => (
                      <option
                        key={
                          consultant.id
                        }
                        value={
                          consultant.id
                        }
                      >
                        {
                          consultant.name
                        }
                      </option>
                    ),
                  )}
                </Select>
              </Field>
            </fieldset>

            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="col-span-full text-sm font-semibold">
                Endereço
              </legend>
              <Field
                label="Rua"
                htmlFor="addressStreet"
              >
                <Input
                  id="addressStreet"
                  name="addressStreet"
                  required
                  defaultValue={
                    values.addressStreet
                  }
                  errorMessage={
                    fieldErrors
                      ?.addressStreet
                  }
                />
              </Field>
              <Field
                label="Número"
                htmlFor="addressNumber"
              >
                <Input
                  id="addressNumber"
                  name="addressNumber"
                  required
                  defaultValue={
                    values.addressNumber
                  }
                  errorMessage={
                    fieldErrors
                      ?.addressNumber
                  }
                />
              </Field>
              <Field
                label="Complemento"
                htmlFor="addressComplement"
              >
                <Input
                  id="addressComplement"
                  name="addressComplement"
                  defaultValue={
                    values.addressComplement
                  }
                  errorMessage={
                    fieldErrors
                      ?.addressComplement
                  }
                />
              </Field>
              <Field
                label="Bairro"
                htmlFor="addressNeighborhood"
              >
                <Input
                  id="addressNeighborhood"
                  name="addressNeighborhood"
                  required
                  defaultValue={
                    values.addressNeighborhood
                  }
                  errorMessage={
                    fieldErrors
                      ?.addressNeighborhood
                  }
                />
              </Field>
              <Field
                label="Cidade"
                htmlFor="addressCity"
              >
                <Input
                  id="addressCity"
                  name="addressCity"
                  required
                  defaultValue={
                    values.addressCity
                  }
                  errorMessage={
                    fieldErrors
                      ?.addressCity
                  }
                />
              </Field>
              <Field
                label="Estado"
                htmlFor="addressState"
              >
                <Input
                  id="addressState"
                  name="addressState"
                  required
                  maxLength={2}
                  defaultValue={
                    values.addressState
                  }
                  errorMessage={
                    fieldErrors
                      ?.addressState
                  }
                />
              </Field>
              <Field
                label="CEP"
                htmlFor="addressZipCode"
              >
                <Input
                  id="addressZipCode"
                  name="addressZipCode"
                  required
                  inputMode="numeric"
                  defaultValue={
                    values.addressZipCode
                  }
                  errorMessage={
                    fieldErrors
                      ?.addressZipCode
                  }
                />
              </Field>
            </fieldset>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                loading={pending}
                loadingText="Criando"
                disabled={
                  pending ||
                  !hasConsultants
                }
              >
                Criar cliente
              </Button>
              <Link
                href="/"
                aria-disabled={
                  pending || undefined
                }
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-strong)] px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--gorila-focus)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
              >
                Cancelar
              </Link>
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
