CREATE TYPE "commercial_activity_type" AS ENUM (
  'new_lead_first_contact', 'cadence_whatsapp', 'cadence_call',
  'response_check', 'callback', 'callback_recovery', 'meeting_prep',
  'meeting_start', 'meeting_outcome_check', 'no_show_recovery',
  'strategic_follow_up', 'reactivation_context_required',
  'reactivation_contact', 'proposal_follow_up', 'r2_review'
);

CREATE TYPE "commercial_activity_channel" AS ENUM (
  'whatsapp', 'call', 'email', 'meeting', 'system'
);

CREATE TYPE "commercial_commitment_party" AS ENUM (
  'customer', 'consultant', 'both'
);

CREATE TYPE "commercial_commitment_type" AS ENUM (
  'callback', 'meeting', 'send_proposal', 'send_document', 'follow_up', 'other'
);

CREATE TYPE "commercial_commitment_status" AS ENUM (
  'pending', 'completed', 'missed', 'cancelled', 'rescheduled'
);

CREATE TYPE "reactivation_context_state" AS ENUM (
  'provided', 'never_replied', 'no_previous_conversation', 'provider_synchronized'
);

CREATE TYPE "r2_notification_kind" AS ENUM (
  'activity_due', 'callback_due', 'meeting_soon', 'reply_waiting',
  'recovery_due', 'follow_up_overdue', 'stale_opportunity'
);

ALTER TABLE "tasks"
ADD COLUMN "opportunity_id" TEXT,
ADD COLUMN "execution_type" "commercial_activity_type",
ADD COLUMN "channel" "commercial_activity_channel",
ADD COLUMN "cadence_instance_id" TEXT,
ADD COLUMN "impact_number" INTEGER,
ADD COLUMN "commitment_id" TEXT,
ADD COLUMN "source_event_id" TEXT,
ADD COLUMN "idempotency_key" TEXT,
ADD COLUMN "reason" TEXT,
ADD COLUMN "started_at" TIMESTAMP(3),
ADD COLUMN "cancelled_at" TIMESTAMP(3),
ADD COLUMN "superseded_at" TIMESTAMP(3);

ALTER TABLE "meetings"
ADD COLUMN "opportunity_id" TEXT;

ALTER TABLE "commercial_conversation_memories"
ADD COLUMN "structured_facts" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "narrative_summary" TEXT,
ADD COLUMN "fact_provenance" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "observed_at" TIMESTAMP(3);

CREATE TABLE "commercial_commitments" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "opportunity_id" TEXT NOT NULL,
  "consultant_id" TEXT NOT NULL,
  "promised_by" "commercial_commitment_party" NOT NULL,
  "type" "commercial_commitment_type" NOT NULL,
  "status" "commercial_commitment_status" NOT NULL DEFAULT 'pending',
  "due_at" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "source_event_id" TEXT,
  "completed_at" TIMESTAMP(3),
  "missed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "rescheduled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "commercial_commitments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reactivation_contexts" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "opportunity_id" TEXT NOT NULL,
  "consultant_id" TEXT NOT NULL,
  "reactivation_cycle_id" TEXT NOT NULL,
  "context_state" "reactivation_context_state" NOT NULL,
  "context_summary" TEXT,
  "synchronized_by_provider" BOOLEAN NOT NULL DEFAULT false,
  "provided_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactivation_contexts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "r2_notifications" (
  "id" TEXT NOT NULL,
  "workspace_id" TEXT NOT NULL,
  "consultant_id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "kind" "r2_notification_kind" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "r2_notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tasks_workspace_idempotency_key"
ON "tasks"("workspace_id", "idempotency_key");
CREATE INDEX "tasks_workspace_opportunity_idx"
ON "tasks"("workspace_id", "opportunity_id");
CREATE INDEX "tasks_consultant_status_due_idx"
ON "tasks"("workspace_id", "assigned_to_id", "status", "due_at");
CREATE INDEX "tasks_cadence_impact_idx"
ON "tasks"("workspace_id", "cadence_instance_id", "impact_number");
CREATE INDEX "tasks_workspace_commitment_idx"
ON "tasks"("workspace_id", "commitment_id");
CREATE INDEX "meetings_workspace_opportunity_idx"
ON "meetings"("workspace_id", "opportunity_id");

CREATE INDEX "commercial_commitments_status_due_idx"
ON "commercial_commitments"("workspace_id", "status", "due_at");
CREATE INDEX "commercial_commitments_consultant_due_idx"
ON "commercial_commitments"("workspace_id", "consultant_id", "status", "due_at");
CREATE INDEX "commercial_commitments_opportunity_idx"
ON "commercial_commitments"("workspace_id", "opportunity_id");
CREATE UNIQUE INDEX "commercial_commitments_source_event_key"
ON "commercial_commitments"("workspace_id", "source_event_id");

CREATE UNIQUE INDEX "reactivation_context_cycle_key"
ON "reactivation_contexts"("workspace_id", "opportunity_id", "reactivation_cycle_id");
CREATE INDEX "reactivation_context_consultant_idx"
ON "reactivation_contexts"("workspace_id", "consultant_id", "provided_at");

CREATE UNIQUE INDEX "r2_notifications_task_key"
ON "r2_notifications"("task_id");
CREATE INDEX "r2_notifications_consultant_read_idx"
ON "r2_notifications"("workspace_id", "consultant_id", "read_at", "created_at");

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "commercial_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_commitment_id_fkey"
FOREIGN KEY ("commitment_id") REFERENCES "commercial_commitments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "commercial_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commercial_commitments" ADD CONSTRAINT "commercial_commitments_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "commercial_commitments" ADD CONSTRAINT "commercial_commitments_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "commercial_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commercial_commitments" ADD CONSTRAINT "commercial_commitments_consultant_id_fkey"
FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reactivation_contexts" ADD CONSTRAINT "reactivation_contexts_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reactivation_contexts" ADD CONSTRAINT "reactivation_contexts_opportunity_id_fkey"
FOREIGN KEY ("opportunity_id") REFERENCES "commercial_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reactivation_contexts" ADD CONSTRAINT "reactivation_contexts_consultant_id_fkey"
FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "r2_notifications" ADD CONSTRAINT "r2_notifications_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "r2_notifications" ADD CONSTRAINT "r2_notifications_consultant_id_fkey"
FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "r2_notifications" ADD CONSTRAINT "r2_notifications_task_id_fkey"
FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
