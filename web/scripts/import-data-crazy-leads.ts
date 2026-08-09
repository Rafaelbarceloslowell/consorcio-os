import "dotenv/config"

import { randomUUID } from "node:crypto"
import { Client } from "pg"

import {
  buildDataCrazyImportPlan,
  type DataCrazySourceRow,
  type ExistingContact,
} from "@/application/lead/data-crazy-import"

const BACKLOG_STAGE_NAME = "Backlog Data Crazy"

type TargetIdentity = Readonly<{
  workspaceId: string
  consultantId: string
}>

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} não configurado.`)
  return value
}

function configuration() {
  return {
    sourceUrl: requiredEnvironment("SOURCE_DATABASE_URL"),
    targetUrl: requiredEnvironment("TARGET_DATABASE_URL"),
    targetUserEmail: requiredEnvironment("TARGET_USER_EMAIL"),
    workspaceSlug: process.env.TARGET_WORKSPACE_SLUG?.trim() || "consorcio-os",
    execute: process.argv.includes("--execute"),
  }
}

async function loadSourceRows(client: Client): Promise<DataCrazySourceRow[]> {
  const result = await client.query<{
    id: string
    workspace_id: string
    name: string
    email: string
    phone: string
    document: string | null
    company_name: string | null
    source: string
    status: string
    consortium_type: string
    desired_credit_value: string
    desired_term_months: number
    score: number
    notes: string | null
    created_at: Date
    pipeline_stage_name: string
  }>(`
    select
      l.id,
      l.workspace_id,
      l.name,
      l.email,
      l.phone,
      l.document,
      l.company_name,
      l.source::text,
      l.status::text,
      l.consortium_type::text,
      l.desired_credit_value::text,
      l.desired_term_months,
      l.score,
      l.notes,
      l.created_at,
      ps.name as pipeline_stage_name
    from leads l
    join pipeline_stages ps on ps.id = l.pipeline_stage_id
    where
      ps.name = 'Reativação Data Crazy'
      or l.notes like '[IMPORTAÇÃO DATA CRAZY%'
    order by l.created_at, l.id
  `)

  return result.rows.map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    document: row.document,
    companyName: row.company_name,
    source: row.source,
    status: row.status,
    consortiumType: row.consortium_type,
    desiredCreditValue: row.desired_credit_value,
    desiredTermMonths: row.desired_term_months,
    score: row.score,
    notes: row.notes,
    sourceCreatedAt: row.created_at,
    pipelineStageName: row.pipeline_stage_name,
  }))
}

async function resolveTargetIdentity(
  client: Client,
  input: Readonly<{ userEmail: string; workspaceSlug: string }>,
): Promise<TargetIdentity> {
  const result = await client.query<{
    workspace_id: string
    consultant_id: string
  }>(`
    select u.workspace_id, u.consultant_id
    from users u
    join workspaces w
      on w.id = u.workspace_id
      and w.status = 'active'
    join consultants c
      on c.id = u.consultant_id
      and c.workspace_id = u.workspace_id
      and c.status = 'active'
    where lower(u.email) = lower($1)
      and u.email_verified = true
      and w.slug = $2
  `, [input.userEmail, input.workspaceSlug])

  if (result.rowCount !== 1) {
    throw new Error("O usuário alvo não possui um único vínculo verificado com workspace e consultor ativos.")
  }

  return {
    workspaceId: result.rows[0].workspace_id,
    consultantId: result.rows[0].consultant_id,
  }
}

async function loadExistingContacts(
  client: Client,
  workspaceId: string,
): Promise<ExistingContact[]> {
  const result = await client.query<{
    workspace_id: string
    email: string
    phone: string
    notes: string | null
  }>(`
    select workspace_id, email, phone, notes
    from leads
    where workspace_id = $1
    union all
    select workspace_id, email, phone, null::text as notes
    from clients
    where workspace_id = $1
  `, [workspaceId])

  return result.rows.map((row) => ({
    workspaceId: row.workspace_id,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
  }))
}

async function ensureBacklogStage(
  client: Client,
  workspaceId: string,
): Promise<string> {
  const existing = await client.query<{ id: string }>(`
    select id
    from pipeline_stages
    where workspace_id = $1
      and type = 'lead'
      and name = $2
    limit 1
  `, [workspaceId, BACKLOG_STAGE_NAME])

  if (existing.rowCount === 1) return existing.rows[0].id

  const orderResult = await client.query<{ next_order: number }>(`
    select coalesce(min("order"), 1) - 1 as next_order
    from pipeline_stages
    where workspace_id = $1 and type = 'lead'
  `, [workspaceId])

  const id = `data-crazy-backlog-${randomUUID()}`
  await client.query(`
    insert into pipeline_stages (
      id, workspace_id, name, "order", type, color, description,
      win_probability, is_closed_stage, is_won_stage, created_at, updated_at
    ) values ($1, $2, $3, $4, 'lead', '#D0B96C', $5, 0, false, false, now(), now())
  `, [
    id,
    workspaceId,
    BACKLOG_STAGE_NAME,
    orderResult.rows[0].next_order,
    "Base disponível aguardando classificação explícita como Novo ou Reativação.",
  ])

  return id
}

function report(plan: ReturnType<typeof buildDataCrazyImportPlan>) {
  console.info(`SOURCE_ROWS=${plan.sourceRows}`)
  console.info(`WOULD_CREATE=${plan.wouldCreate.length}`)
  console.info(`WOULD_SKIP_DUPLICATE=${plan.wouldSkipDuplicate.length}`)
  console.info(`WOULD_REQUIRE_REVIEW=${plan.wouldRequireReview.length}`)
  console.info(`INVALID_ROWS=${plan.invalidRows.length}`)
  console.info(`UNTRIAGED_ROWS=${plan.untriagedRows}`)
}

function hasUnexpectedReview(plan: ReturnType<typeof buildDataCrazyImportPlan>) {
  return plan.wouldRequireReview.some(
    (item) => item.reason !== "Telefone sem DDI/DDD suficiente para normalização segura.",
  )
}

async function main() {
  const config = configuration()
  const source = new Client({ connectionString: config.sourceUrl })
  const target = new Client({ connectionString: config.targetUrl })

  await source.connect()
  await target.connect()

  try {
    const sourceRows = await loadSourceRows(source)
    const identity = await resolveTargetIdentity(target, {
      userEmail: config.targetUserEmail,
      workspaceSlug: config.workspaceSlug,
    })
    const existingContacts = await loadExistingContacts(target, identity.workspaceId)
    const dryRun = buildDataCrazyImportPlan({
      sourceRows,
      targetWorkspaceId: identity.workspaceId,
      existingContacts,
    })

    report(dryRun)
    console.info(`MODE=${config.execute ? "EXECUTE" : "DRY_RUN"}`)

    if (!config.execute) return
    if (hasUnexpectedReview(dryRun) || dryRun.invalidRows.length !== 1) {
      throw new Error("O dry-run possui anomalias além da fixture conhecida; importação cancelada.")
    }

    await target.query("begin")
    try {
      await target.query("select pg_advisory_xact_lock(hashtext($1))", [
        `data-crazy-import:${identity.workspaceId}`,
      ])

      const freshContacts = await loadExistingContacts(target, identity.workspaceId)
      const plan = buildDataCrazyImportPlan({
        sourceRows,
        targetWorkspaceId: identity.workspaceId,
        existingContacts: freshContacts,
      })

      if (hasUnexpectedReview(plan) || plan.invalidRows.length !== 1) {
        throw new Error("O estado do destino mudou após o dry-run; importação cancelada.")
      }

      const pipelineStageId = await ensureBacklogStage(target, identity.workspaceId)

      for (const candidate of plan.wouldCreate) {
        await target.query(`
          insert into leads (
            id, workspace_id, name, email, phone, document, company_name,
            source, status, approach_type, consortium_type, desired_credit_value,
            desired_term_months, consultant_id, pipeline_stage_id, score, notes,
            converted_client_id, last_contact_at, created_at, updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7,
            'other', 'new', null, $8::consortium_type, $9,
            $10, $11, $12, $13, $14,
            null, null, now(), now()
          )
        `, [
          `data-crazy-${randomUUID()}`,
          identity.workspaceId,
          candidate.name,
          candidate.email,
          candidate.phone,
          candidate.document,
          candidate.companyName,
          candidate.consortiumType,
          candidate.desiredCreditValue,
          candidate.desiredTermMonths,
          identity.consultantId,
          pipelineStageId,
          candidate.score,
          candidate.notes,
        ])
      }

      await target.query("commit")
      console.info(`CREATED=${plan.wouldCreate.length}`)
      console.info(`SKIPPED_DUPLICATE=${plan.wouldSkipDuplicate.length}`)
      console.info(`REVIEW_REQUIRED=${plan.wouldRequireReview.length}`)
      console.info("ACTIVE_WORKSET_CREATED=0")
      console.info("DATA_CRAZY_IMPORT=APROVADO")
    } catch (error) {
      await target.query("rollback")
      throw error
    }
  } finally {
    await Promise.allSettled([source.end(), target.end()])
  }
}

void main().catch((error) => {
  console.error("DATA_CRAZY_IMPORT=REPROVADO")
  console.error(`ERROR_TYPE=${error instanceof Error ? error.name : "UnknownError"}`)
  process.exitCode = 1
})
