import {
  ConsultantRole,
  ConsultantStatus,
  WorkspaceStatus,
} from "@/lib/generated/prisma/client"

import {
  buildIntegrationStatuses,
} from "@/application/settings/build-integration-statuses"
import {
  SettingsPanel,
} from "@/components/settings/settings-panel"
import {
  prisma,
} from "@/infrastructure/prisma/client"

import type {
  SettingsConsultantView,
} from "@/types/settings-operational"

import {
  updateConsultantGoalsAction,
  updateConsultantProfileAction,
  updateWorkspaceSettingsAction,
} from "./actions"

const CURRENT_CONSULTANT_EMAIL =
  "rafaelbconsorcio@gmail.com"

const currencyFormatter =
  new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  )

function accessRoleLabel(
  role: ConsultantRole,
): string {
  switch (role) {
    case ConsultantRole.ADMIN:
      return "Administrador"
    case ConsultantRole.MANAGER:
      return "Gestor"
    case ConsultantRole.CONSULTANT:
      return "Consultor"
    default:
      return "Usuário"
  }
}

function consultantStatusLabel(
  status: ConsultantStatus,
): string {
  switch (status) {
    case ConsultantStatus.ACTIVE:
      return "Ativo"
    case ConsultantStatus.ON_LEAVE:
      return "Afastado"
    case ConsultantStatus.INACTIVE:
      return "Inativo"
    default:
      return "Desconhecido"
  }
}

export default async function SettingsPage() {
  const workspace =
    await prisma.workspace.findUnique({
      where: {
        slug: "consorcio-os",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        consultants: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            team: true,
            region: true,
            status: true,
            monthlySalesTarget: true,
            monthlyLeadsTarget: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    })

  if (!workspace) {
    throw new Error(
      'Workspace "consorcio-os" não encontrado.',
    )
  }

  type ResolvedWorkspace =
    NonNullable<typeof workspace>

  type ResolvedConsultant =
    ResolvedWorkspace[
      "consultants"
    ][number]

  if (
    workspace.consultants
      .length === 0
  ) {
    throw new Error(
      "O workspace ainda não possui usuários.",
    )
  }

  const current =
    workspace.consultants.find(
      (consultant: ResolvedConsultant) =>
        consultant.email
          .trim()
          .toLocaleLowerCase() ===
        CURRENT_CONSULTANT_EMAIL,
    ) ??
    workspace.consultants.find(
      (consultant: ResolvedConsultant) =>
        consultant.name
          .trim()
          .toLocaleLowerCase(
            "pt-BR",
          ) ===
        "rafael ramos barcelos",
    ) ??
    workspace.consultants[0]

  if (!current) {
    throw new Error(
      "O usuário atual não pôde ser resolvido.",
    )
  }

  function consultantView(
    consultant:
      ResolvedConsultant,
  ): SettingsConsultantView {
    const monthlySalesTarget =
      Number(
        consultant
          .monthlySalesTarget,
      )
    const isCurrent =
      consultant.id ===
      current.id
    const hasTeam =
      consultant.team
        .trim()
        .toLocaleLowerCase(
          "pt-BR",
        ) !==
      "sem equipe"

    return {
      id: consultant.id,
      name: consultant.name,
      email: consultant.email,
      phone: consultant.phone,
      accessRoleLabel:
        accessRoleLabel(
          consultant.role,
        ),
      positionTitle:
        isCurrent
          ? "Consultor Sênior"
          : accessRoleLabel(
              consultant.role,
            ),
      team: hasTeam
        ? consultant.team
        : "",
      teamLabel: hasTeam
        ? consultant.team
        : "Sem equipe",
      reportingLineLabel:
        isCurrent
          ? "Diretoria"
          : "Estrutura da empresa",
      region: consultant.region,
      statusLabel:
        consultantStatusLabel(
          consultant.status,
        ),
      monthlySalesTargetInput:
        monthlySalesTarget
          .toFixed(2),
      monthlySalesTargetLabel:
        currencyFormatter.format(
          monthlySalesTarget,
        ),
      monthlyLeadsTarget:
        consultant
          .monthlyLeadsTarget,
    }
  }

  return (
    <SettingsPanel
      view={{
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          statusLabel:
            workspace.status ===
            WorkspaceStatus.ACTIVE
              ? "Ativo"
              : "Inativo",
        },
        currentConsultant:
          consultantView(
            current,
          ),
        users:
          workspace.consultants.map(
            consultantView,
          ),
        leadOperation: {
          companyDailyNewLeads:
            40,
          personalTargetModeLabel:
            "Calculada pela distribuição real",
          legacyLeadTreatmentLabel:
            "Reativados",
          newLeadDefinition:
            "Pessoa que entrou agora na base e foi distribuída para atendimento.",
          reactivatedLeadDefinition:
            "Pessoa já existente na base que voltou a ser trabalhada.",
        },
        integrations:
          buildIntegrationStatuses(
            process.env,
          ),
      }}
      updateWorkspaceAction={
        updateWorkspaceSettingsAction
      }
      updateProfileAction={
        updateConsultantProfileAction
      }
      updateGoalsAction={
        updateConsultantGoalsAction
      }
    />
  )
}
