import Link from "next/link"

export type ConsortiumCatalogItemView =
  Readonly<{
    id: string
    name: string
    administrator: string
    type: string
    groupNumber: string
    minCreditValue: string
    maxCreditValue: string
    defaultTermMonths: number
    administrationFeePercent:
      string
    reserveFundPercent: string
    totalQuotas: number
    availableQuotas: number
    status: string
    description: string
    ruleStatus: string
    ruleSource: string
    sourceReference: string
    verifiedAt: string
    effectiveFrom: string
    effectiveUntil: string
    ruleVersion: number
    minInstallmentValue: string
    maxInstallmentValue: string
    embeddedBidAllowed:
      boolean | null
  }>

type SaveCatalogAction =
  (formData: FormData) =>
    void | Promise<void>

const fieldClass =
  "mt-2 w-full rounded-xl border border-[var(--gorila-line)] bg-[var(--gorila-surface-inset)] px-3 py-2 text-sm text-[var(--gorila-text)] outline-none focus:border-[#8F9B63]"

function dateInput(
  value: string,
): string {
  return value
    ? value.slice(0, 16)
    : ""
}

function CatalogForm({
  item,
  action,
}: Readonly<{
  item?: ConsortiumCatalogItemView
  action: SaveCatalogAction
}>) {
  return (
    <form
      action={action}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      {item ? (
        <input
          type="hidden"
          name="consortiumId"
          value={item.id}
        />
      ) : null}

      <Field label="Administradora">
        <input
          name="administrator"
          required
          defaultValue={
            item?.administrator ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Produto / plano">
        <input
          name="name"
          required
          defaultValue={item?.name ?? ""}
          className={fieldClass}
        />
      </Field>
      <Field label="Grupo">
        <input
          name="groupNumber"
          required
          defaultValue={
            item?.groupNumber ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Categoria">
        <select
          name="type"
          required
          defaultValue={
            item?.type ?? "REAL_ESTATE"
          }
          className={fieldClass}
        >
          <option value="REAL_ESTATE">Imóvel</option>
          <option value="VEHICLE">Veículo</option>
          <option value="HEAVY_VEHICLE">Veículo pesado</option>
          <option value="SERVICES">Serviços</option>
          <option value="OTHER">Outro</option>
        </select>
      </Field>
      <Field label="Crédito mínimo">
        <input
          name="minCreditValue"
          type="number"
          min="0.01"
          step="0.01"
          required
          defaultValue={
            item?.minCreditValue ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Crédito máximo">
        <input
          name="maxCreditValue"
          type="number"
          min="0.01"
          step="0.01"
          required
          defaultValue={
            item?.maxCreditValue ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Prazo padrão (meses)">
        <input
          name="defaultTermMonths"
          type="number"
          min="1"
          step="1"
          required
          defaultValue={
            item?.defaultTermMonths ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Taxa de administração (%)">
        <input
          name="administrationFeePercent"
          type="number"
          min="0"
          step="0.0001"
          required
          defaultValue={
            item?.administrationFeePercent ??
            ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Fundo de reserva (%)">
        <input
          name="reserveFundPercent"
          type="number"
          min="0"
          step="0.0001"
          required
          defaultValue={
            item?.reserveFundPercent ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Total de cotas">
        <input
          name="totalQuotas"
          type="number"
          min="0"
          step="1"
          required
          defaultValue={
            item?.totalQuotas ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Cotas disponíveis">
        <input
          name="availableQuotas"
          type="number"
          min="0"
          step="1"
          required
          defaultValue={
            item?.availableQuotas ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Status operacional">
        <select
          name="status"
          defaultValue={
            item?.status ?? "FORMING"
          }
          className={fieldClass}
        >
          <option value="FORMING">Em formação</option>
          <option value="ACTIVE">Ativo</option>
          <option value="CLOSED">Encerrado</option>
        </select>
      </Field>
      <Field label="Status da regra">
        <select
          name="ruleStatus"
          defaultValue={
            item?.ruleStatus ?? "UNVERIFIED"
          }
          className={fieldClass}
        >
          <option value="UNVERIFIED">Não verificada</option>
          <option value="VERIFIED">Verificada</option>
          <option value="STALE">Desatualizada</option>
        </select>
      </Field>
      <Field label="Fonte">
        <select
          name="ruleSource"
          defaultValue={
            item?.ruleSource ?? ""
          }
          className={fieldClass}
        >
          <option value="">Sem fonte verificada</option>
          <option value="MANUAL_VERIFIED">Validação manual</option>
          <option value="OFFICIAL_DOCUMENT">Documento oficial</option>
          <option value="OFFICIAL_API">API oficial</option>
          <option value="OPERATOR_VERIFIED">Operador verificou</option>
        </select>
      </Field>
      <Field label="Referência da fonte">
        <input
          name="sourceReference"
          defaultValue={
            item?.sourceReference ?? ""
          }
          placeholder="Descrição ou referência real; não invente URL"
          className={fieldClass}
        />
      </Field>
      <Field label="Verificada em">
        <input
          name="verifiedAt"
          type="datetime-local"
          defaultValue={dateInput(
            item?.verifiedAt ?? "",
          )}
          className={fieldClass}
        />
      </Field>
      <Field label="Vigência desde">
        <input
          name="effectiveFrom"
          type="datetime-local"
          defaultValue={dateInput(
            item?.effectiveFrom ?? "",
          )}
          className={fieldClass}
        />
      </Field>
      <Field label="Vigência até">
        <input
          name="effectiveUntil"
          type="datetime-local"
          defaultValue={dateInput(
            item?.effectiveUntil ?? "",
          )}
          className={fieldClass}
        />
      </Field>
      <Field label="Parcela mínima conhecida">
        <input
          name="minInstallmentValue"
          type="number"
          min="0"
          step="0.01"
          defaultValue={
            item?.minInstallmentValue ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Parcela máxima conhecida">
        <input
          name="maxInstallmentValue"
          type="number"
          min="0"
          step="0.01"
          defaultValue={
            item?.maxInstallmentValue ?? ""
          }
          className={fieldClass}
        />
      </Field>
      <Field label="Lance embutido">
        <select
          name="embeddedBidAllowed"
          defaultValue={
            item?.embeddedBidAllowed === true
              ? "true"
              : item?.embeddedBidAllowed === false
                ? "false"
                : ""
          }
          className={fieldClass}
        >
          <option value="">Regra desconhecida</option>
          <option value="true">Permitido</option>
          <option value="false">Não permitido</option>
        </select>
      </Field>
      <Field label="Descrição">
        <textarea
          name="description"
          rows={3}
          defaultValue={
            item?.description ?? ""
          }
          className={fieldClass}
        />
      </Field>

      <div className="flex items-end md:col-span-2 xl:col-span-3">
        <button
          type="submit"
          className="rounded-xl border border-[#8F9B63]/45 bg-[#8F9B63]/15 px-5 py-3 text-sm font-semibold text-[#CDD59B]"
        >
          {item
            ? "Salvar nova versão da regra"
            : "Criar registro não verificado"}
        </button>
      </div>
    </form>
  )
}

export function ConsortiumCatalogPanel({
  items,
  action,
}: Readonly<{
  items:
    readonly ConsortiumCatalogItemView[]
  action: SaveCatalogAction
}>) {
  return (
    <main className="min-h-screen bg-[var(--gorila-canvas)] px-4 py-8 text-[var(--gorila-text)] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/settings"
          className="text-sm font-semibold text-[#8F9B63]"
        >
          Voltar às configurações
        </Link>
        <header className="mt-5 rounded-[26px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8F9B63]">
            R2 · catálogo verificado
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Regras de consórcio
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--gorila-text-soft)]">
            Somente administradores podem manter estes dados. Marque uma regra como verificada apenas com fonte real, data de verificação e vigência. O R2 ignora regras não verificadas ou vencidas em recomendações.
          </p>
        </header>

        <section className="mt-5 rounded-[26px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6">
          <h2 className="text-xl font-semibold">
            Novo registro
          </h2>
          <div className="mt-5">
            <CatalogForm action={action} />
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {items.length === 0 ? (
            <div className="rounded-[26px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6 text-sm text-[var(--gorila-text-soft)]">
              Nenhum catálogo cadastrado. O R2 não recomendará produto específico.
            </div>
          ) : items.map((item) => (
            <details
              key={item.id}
              className="rounded-[26px] border border-[var(--gorila-line)] bg-[var(--gorila-surface)] p-6"
            >
              <summary className="cursor-pointer font-semibold">
                {item.administrator} · {item.name} · versão {item.ruleVersion} · {item.ruleStatus}
              </summary>
              <div className="mt-5">
                <CatalogForm
                  item={item}
                  action={action}
                />
              </div>
            </details>
          ))}
        </section>
      </div>
    </main>
  )
}

function Field({
  label,
  children,
}: Readonly<{
  label: string
  children: React.ReactNode
}>) {
  return (
    <label className="text-sm text-[var(--gorila-text-soft)]">
      {label}
      {children}
    </label>
  )
}
