import Link from "next/link"

import {
  ThemeToggle,
} from "@/components/ui/theme-toggle"

import type {
  SettingsView,
} from "@/types/settings-operational"

type SettingsAction =
  (
    formData: FormData,
  ) =>
    void | Promise<void>

export function SettingsPanel({
  view,
  updateWorkspaceAction,
  updateProfileAction,
  updateGoalsAction,
}: Readonly<{
  view: SettingsView
  updateWorkspaceAction:
    SettingsAction
  updateProfileAction:
    SettingsAction
  updateGoalsAction:
    SettingsAction
}>) {
  const consultant =
    view.currentConsultant

  return (
    <main className="min-h-screen bg-[#0B0F0D] p-4 text-[#F5F7FA] sm:p-8">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#131814] shadow-[var(--gorilla-shadow-raised)]">
        <header className="flex flex-col gap-5 border-b border-white/[0.07] px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#697384]">
              Administração do sistema
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              Configurações
            </h1>
            <p className="mt-2 text-sm text-[#96A0AF]">
              Empresa, perfil, metas, estrutura operacional e integrações.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {consultant.accessRoleLabel ===
            "Administrador" ? (
              <Link
                href="/settings/consortium-catalog"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#8F9B63]/35 bg-[#8F9B63]/10 px-4 text-sm font-semibold text-[#CDD59B]"
              >
                Catálogo de consórcio
              </Link>
            ) : null}
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/[0.10] px-4 text-sm font-semibold text-[#B7C0CC] transition hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.04]"
            >
              Mission Control
            </Link>
          </div>
        </header>

        <div className="grid gap-5 p-6 xl:grid-cols-2">
          <form
            action={
              updateWorkspaceAction
            }
            className="rounded-2xl border border-white/[0.07] bg-black/10 p-5"
          >
            <SectionTitle
              title="Empresa"
              description="Empresa atendida pelo workspace atual."
            />

            <input
              type="hidden"
              name="workspaceId"
              value={
                view.workspace.id
              }
            />

            <label className="mt-5 block text-sm text-[#B7C0CC]">
              Nome da empresa
              <input
                name="name"
                required
                maxLength={120}
                defaultValue={
                  view.workspace.name
                }
                className={fieldClass}
              />
            </label>

            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <Data label="Slug técnico">
                {view.workspace.slug}
              </Data>
              <Data label="Status">
                {view.workspace
                  .statusLabel}
              </Data>
            </div>

            <SubmitButton>
              Salvar empresa
            </SubmitButton>
          </form>

          <form
            action={
              updateProfileAction
            }
            className="rounded-2xl border border-white/[0.07] bg-black/10 p-5"
          >
            <SectionTitle
              title="Meu perfil"
              description="Identidade e vínculo operacional do usuário atual."
            />

            <input
              type="hidden"
              name="workspaceId"
              value={
                view.workspace.id
              }
            />
            <input
              type="hidden"
              name="consultantId"
              value={
                consultant.id
              }
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nome"
                name="name"
                value={
                  consultant.name
                }
              />
              <Field
                label="E-mail"
                name="email"
                type="email"
                value={
                  consultant.email
                }
              />
              <Field
                label="Telefone"
                name="phone"
                required={false}
                placeholder="Não informado"
                value={
                  consultant.phone
                }
              />
              <Field
                label="Equipe (opcional)"
                name="team"
                required={false}
                placeholder="Não informado"
                value={
                  consultant.team
                }
              />
              <Field
                label="Região"
                name="region"
                required={false}
                placeholder="Não informado"
                value={
                  consultant.region
                }
              />
            </div>

            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
              <Data label="Cargo comercial">
                {consultant.positionTitle}
              </Data>
              <Data label="Permissão no sistema">
                {consultant.accessRoleLabel}
              </Data>
              <Data label="Estrutura">
                {consultant.teamLabel}
              </Data>
              <Data label="Reporte">
                {consultant.reportingLineLabel}
              </Data>
            </dl>

            <SubmitButton>
              Salvar perfil
            </SubmitButton>
          </form>

          <form
            action={
              updateGoalsAction
            }
            className="rounded-2xl border border-white/[0.07] bg-black/10 p-5"
          >
            <SectionTitle
              title="Metas"
              description="Metas mensais usadas pelo acompanhamento comercial."
            />

            <input
              type="hidden"
              name="workspaceId"
              value={
                view.workspace.id
              }
            />
            <input
              type="hidden"
              name="consultantId"
              value={
                consultant.id
              }
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-[#B7C0CC]">
                Crédito vendido no mês
                <input
                  name="monthlySalesTarget"
                  required
                  inputMode="decimal"
                  defaultValue={
                    consultant
                      .monthlySalesTargetInput
                  }
                  className={fieldClass}
                />
              </label>
              <label className="text-sm text-[#B7C0CC]">
                Meta pessoal de leads
                <input
                  name="monthlyLeadsTarget"
                  type="number"
                  min={0}
                  step={1}
                  required
                  defaultValue={
                    consultant
                      .monthlyLeadsTarget
                  }
                  className={fieldClass}
                />
              </label>
            </div>

            <p className="mt-4 text-xs leading-5 text-[#697384]">
              Meta atual de crédito:{" "}
              <span className="whitespace-nowrap tabular-nums">
                {consultant.monthlySalesTargetLabel}
              </span>
              . Use 0 para deixar a meta pessoal de leads dependente da distribuição real da empresa.
            </p>

            <SubmitButton>
              Salvar metas
            </SubmitButton>
          </form>

          <section className="rounded-2xl border border-white/[0.07] bg-black/10 p-5">
            <SectionTitle
              title="Operação de leads"
              description="Separação entre captação nova e reativação da base antiga."
            />

            <dl className="mt-5 grid gap-3 text-xs sm:grid-cols-2">
              <Data label="Entrada informada pela empresa">
                {view.leadOperation.companyDailyNewLeads} novos leads por dia
              </Data>
              <Data label="Meta pessoal">
                {view.leadOperation.personalTargetModeLabel}
              </Data>
              <Data label="Base antiga">
                {view.leadOperation.legacyLeadTreatmentLabel}
              </Data>
              <Data label="Reporte">
                {consultant.reportingLineLabel}
              </Data>
            </dl>

            <div className="mt-4 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs leading-5 text-[#697384]">
              <p>
                <strong className="text-[#B7C0CC]">Novo:</strong> {view.leadOperation.newLeadDefinition}
              </p>
              <p>
                <strong className="text-[#B7C0CC]">Reativado:</strong> {view.leadOperation.reactivatedLeadDefinition}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-black/10 p-5 xl:col-span-2">
            <SectionTitle
              title="Integrações"
              description="Status sem expor tokens ou credenciais."
            />

            <ul className="mt-5 grid gap-3 md:grid-cols-2">
              {view.integrations.map(
                (integration) => (
                  <li
                    key={
                      integration.id
                    }
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        {integration.name}
                      </p>
                      <span
                        className={
                          integration.status ===
                          "CONFIGURED"
                            ? "rounded-full border border-[#43A972]/25 bg-[#2F8F5B]/10 px-2.5 py-1 text-[10px] font-semibold text-[#63C68C]"
                            : "rounded-full border border-amber-300/15 bg-amber-300/[0.05] px-2.5 py-1 text-[10px] font-semibold text-amber-100"
                        }
                      >
                        {integration.statusLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#697384]">
                      {integration.description}
                    </p>
                  </li>
                ),
              )}
            </ul>
          </section>
        </div>

        <section className="border-t border-white/[0.07] p-6">
          <SectionTitle
            title="Usuários do workspace"
            description={`${view.users.length} ${view.users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"} na empresa`}
          />

          <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {view.users.map(
              (member) => (
                <li
                  key={member.id}
                  className="rounded-2xl border border-white/[0.07] bg-black/10 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">
                      {member.name}
                    </p>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#43A972]">
                      {member.statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#697384]">
                    {member.positionTitle} · {member.teamLabel}
                  </p>
                  <p className="mt-3 text-xs text-[#96A0AF]">
                    {member.email}
                  </p>
                  <p className="mt-1 text-xs text-[#697384]">
                    {member.regionLabel} · Reporte: {member.reportingLineLabel}
                  </p>
                </li>
              ),
            )}
          </ul>
        </section>
      </section>
    </main>
  )
}

const fieldClass =
  "mt-2 w-full rounded-xl border border-white/[0.10] bg-[#0F1412] px-3 py-2.5 text-sm text-[#F5F7FA] outline-none transition placeholder:text-[var(--gorila-text-muted)] focus:border-[#43A972]/55 focus:ring-4 focus:ring-[#2F8F5B]/10"

function Field({
  label,
  name,
  value,
  type = "text",
  required = true,
  placeholder,
}: Readonly<{
  label: string
  name: string
  value: string
  type?: string
  required?: boolean
  placeholder?: string
}>) {
  return (
    <label className="text-sm text-[#B7C0CC]">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={160}
        defaultValue={value}
        className={fieldClass}
      />
    </label>
  )
}

function SectionTitle({
  title,
  description,
}: Readonly<{
  title: string
  description: string
}>) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      <p className="mt-1 text-xs leading-5 text-[#697384]">
        {description}
      </p>
    </div>
  )
}

function SubmitButton({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <button
      type="submit"
      className="mt-5 rounded-xl border border-[#43A972]/35 bg-[#2F8F5B]/10 px-4 py-2.5 text-sm font-semibold text-[#63C68C] transition hover:-translate-y-0.5 hover:bg-[#2F8F5B]/20"
    >
      {children}
    </button>
  )
}

function Data({
  label,
  children,
}: Readonly<{
  label: string
  children: React.ReactNode
}>) {
  return (
    <div>
      <dt className="text-[#697384]">
        {label}
      </dt>
      <dd className="mt-1 text-[#D6DBE3]">
        {children}
      </dd>
    </div>
  )
}
