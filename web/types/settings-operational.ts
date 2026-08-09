export type SettingsIntegrationStatus =
  Readonly<{
    id:
      | "maestro"
      | "whatsapp"
    name: string
    status:
      | "CONFIGURED"
      | "NOT_CONFIGURED"
    statusLabel: string
    description: string
  }>

export type SettingsConsultantView =
  Readonly<{
    id: string
    name: string
    email: string
    phone: string
    accessRoleLabel: string
    positionTitle: string
    team: string
    teamLabel: string
    reportingLineLabel: string
    region: string
    regionLabel: string
    statusLabel: string
    monthlySalesTargetInput: string
    monthlySalesTargetLabel: string
    monthlyLeadsTarget: number
  }>

export type SettingsLeadOperationView =
  Readonly<{
    companyDailyNewLeads: number
    personalTargetModeLabel: string
    legacyLeadTreatmentLabel: string
    newLeadDefinition: string
    reactivatedLeadDefinition: string
  }>

export type SettingsView = Readonly<{
  workspace: Readonly<{
    id: string
    name: string
    slug: string
    statusLabel: string
  }>
  currentConsultant:
    SettingsConsultantView
  users:
    readonly SettingsConsultantView[]
  leadOperation:
    SettingsLeadOperationView
  integrations:
    readonly SettingsIntegrationStatus[]
}>
