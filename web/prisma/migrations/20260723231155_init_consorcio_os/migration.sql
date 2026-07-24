-- CreateEnum
CREATE TYPE "workspace_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "consultant_role" AS ENUM ('consultant', 'manager', 'admin');

-- CreateEnum
CREATE TYPE "consultant_status" AS ENUM ('active', 'inactive', 'on_leave');

-- CreateEnum
CREATE TYPE "consortium_type" AS ENUM ('real_estate', 'vehicle', 'heavy_vehicle', 'services', 'other');

-- CreateEnum
CREATE TYPE "consortium_status" AS ENUM ('forming', 'active', 'closed');

-- CreateEnum
CREATE TYPE "pipeline_stage_type" AS ENUM ('lead', 'deal');

-- CreateEnum
CREATE TYPE "lead_source" AS ENUM ('referral', 'website', 'social_media', 'cold_call', 'event', 'partner', 'walk_in', 'other');

-- CreateEnum
CREATE TYPE "lead_status" AS ENUM ('new', 'contacted', 'qualified', 'negotiating', 'converted', 'lost');

-- CreateEnum
CREATE TYPE "person_type" AS ENUM ('individual', 'company');

-- CreateEnum
CREATE TYPE "client_status" AS ENUM ('active', 'inactive', 'blocked');

-- CreateEnum
CREATE TYPE "proposal_status" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "meeting_type" AS ENUM ('in_person', 'online', 'phone');

-- CreateEnum
CREATE TYPE "meeting_status" AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "meeting_outcome" AS ENUM ('proposal_sent', 'follow_up_scheduled', 'not_interested', 'converted', 'no_answer', 'other');

-- CreateEnum
CREATE TYPE "sale_status" AS ENUM ('pending_signature', 'active', 'cancelled');

-- CreateEnum
CREATE TYPE "quota_status" AS ENUM ('not_contemplated', 'contemplated', 'paid_off', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('bank_slip', 'direct_debit', 'credit_card', 'pix');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "task_type" AS ENUM ('call', 'email', 'follow_up', 'document', 'meeting_prep', 'proposal_review', 'other');

-- CreateEnum
CREATE TYPE "commercial_journey_priority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "commercial_journey_outcome" AS ENUM ('won', 'lost_to_competitor', 'no_financial_capacity', 'no_response', 'postponed', 'product_not_suitable', 'trust_concern', 'client_withdrew', 'cancelled_by_consultant', 'other');

-- CreateEnum
CREATE TYPE "commercial_actor_type" AS ENUM ('lead', 'client', 'consultant', 'ai', 'system', 'automation', 'administrator');

-- CreateEnum
CREATE TYPE "commercial_event_type" AS ENUM ('lead_created', 'lead_replied', 'meeting_scheduled', 'meeting_completed', 'proposal_sent', 'proposal_accepted', 'document_requested', 'document_received', 'payment_confirmed', 'sale_completed', 'state_changed', 'note_added', 'task_created', 'task_completed');

-- CreateEnum
CREATE TYPE "commercial_action_type" AS ENUM ('change_state', 'create_task', 'complete_task', 'add_note', 'update_priority', 'update_score', 'assign_consultant', 'send_notification', 'send_message', 'request_document', 'create_proposal', 'trigger_automation');

-- CreateEnum
CREATE TYPE "commercial_action_status" AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "commercial_action_origin" AS ENUM ('manual', 'workflow_rule', 'next_best_action', 'ai', 'system');

-- CreateEnum
CREATE TYPE "next_best_action_source" AS ENUM ('rule_engine', 'ai', 'system', 'consultant');

-- CreateEnum
CREATE TYPE "next_best_action_priority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "workspace_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultants" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "role" "consultant_role" NOT NULL DEFAULT 'consultant',
    "team" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "consultant_status" NOT NULL DEFAULT 'active',
    "monthly_sales_target" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "monthly_leads_target" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consortiums" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "administrator" TEXT NOT NULL,
    "type" "consortium_type" NOT NULL,
    "group_number" TEXT NOT NULL,
    "min_credit_value" DECIMAL(18,2) NOT NULL,
    "max_credit_value" DECIMAL(18,2) NOT NULL,
    "default_term_months" INTEGER NOT NULL,
    "administration_fee_percent" DECIMAL(8,4) NOT NULL,
    "reserve_fund_percent" DECIMAL(8,4) NOT NULL,
    "total_quotas" INTEGER NOT NULL,
    "available_quotas" INTEGER NOT NULL,
    "status" "consortium_status" NOT NULL DEFAULT 'forming',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consortiums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "pipeline_stage_type" NOT NULL,
    "color" TEXT NOT NULL,
    "description" TEXT,
    "win_probability" DECIMAL(5,2) NOT NULL,
    "is_closed_stage" BOOLEAN NOT NULL DEFAULT false,
    "is_won_stage" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "document" TEXT,
    "company_name" TEXT,
    "source" "lead_source" NOT NULL,
    "status" "lead_status" NOT NULL DEFAULT 'new',
    "consortium_type" "consortium_type" NOT NULL,
    "desired_credit_value" DECIMAL(18,2) NOT NULL,
    "desired_term_months" INTEGER NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "pipeline_stage_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "lost_reason" TEXT,
    "notes" TEXT,
    "converted_client_id" TEXT,
    "last_contact_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "type" "person_type" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "birth_date" DATE,
    "company_name" TEXT,
    "trade_name" TEXT,
    "state_registration" TEXT,
    "address_street" TEXT NOT NULL,
    "address_number" TEXT NOT NULL,
    "address_complement" TEXT,
    "address_neighborhood" TEXT NOT NULL,
    "address_city" TEXT NOT NULL,
    "address_state" TEXT NOT NULL,
    "address_zip_code" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "status" "client_status" NOT NULL DEFAULT 'active',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "client_id" TEXT,
    "lead_id" TEXT,
    "consultant_id" TEXT NOT NULL,
    "consortium_id" TEXT NOT NULL,
    "credit_value" DECIMAL(18,2) NOT NULL,
    "installment_value" DECIMAL(18,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "administration_fee_percent" DECIMAL(8,4) NOT NULL,
    "reserve_fund_percent" DECIMAL(8,4) NOT NULL,
    "status" "proposal_status" NOT NULL DEFAULT 'draft',
    "sent_at" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "meeting_type" NOT NULL,
    "status" "meeting_status" NOT NULL DEFAULT 'scheduled',
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "meeting_url" TEXT,
    "consultant_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "client_id" TEXT,
    "proposal_id" TEXT,
    "outcome" "meeting_outcome",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "contract_number" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "consultant_id" TEXT NOT NULL,
    "consortium_id" TEXT NOT NULL,
    "group_number" TEXT NOT NULL,
    "quota_number" INTEGER NOT NULL,
    "credit_value" DECIMAL(18,2) NOT NULL,
    "installment_value" DECIMAL(18,2) NOT NULL,
    "term_months" INTEGER NOT NULL,
    "administration_fee_percent" DECIMAL(8,4) NOT NULL,
    "reserve_fund_percent" DECIMAL(8,4) NOT NULL,
    "commission_value" DECIMAL(18,2) NOT NULL,
    "commission_percent" DECIMAL(8,4) NOT NULL,
    "status" "sale_status" NOT NULL DEFAULT 'pending_signature',
    "quota_status" "quota_status" NOT NULL DEFAULT 'not_contemplated',
    "payment_method" "payment_method" NOT NULL,
    "sale_date" TIMESTAMP(3) NOT NULL,
    "first_installment_date" DATE NOT NULL,
    "contemplated_at" TIMESTAMP(3),
    "paid_off_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "task_type" NOT NULL,
    "status" "task_status" NOT NULL DEFAULT 'pending',
    "priority" "task_priority" NOT NULL DEFAULT 'medium',
    "due_at" TIMESTAMP(3) NOT NULL,
    "assigned_to_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "client_id" TEXT,
    "meeting_id" TEXT,
    "proposal_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_phases" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_states" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "is_initial" BOOLEAN NOT NULL DEFAULT false,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "allow_reopen" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_journeys" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "client_id" TEXT,
    "consultant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "consortium_type" "consortium_type" NOT NULL,
    "current_phase_id" TEXT NOT NULL,
    "current_state_id" TEXT NOT NULL,
    "priority" "commercial_journey_priority" NOT NULL DEFAULT 'normal',
    "score" INTEGER NOT NULL DEFAULT 0,
    "outcome" "commercial_journey_outcome",
    "state_entered_at" TIMESTAMP(3) NOT NULL,
    "last_interaction_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "type" "commercial_event_type" NOT NULL,
    "actor_type" "commercial_actor_type" NOT NULL,
    "actor_id" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_actions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "type" "commercial_action_type" NOT NULL,
    "status" "commercial_action_status" NOT NULL DEFAULT 'pending',
    "origin" "commercial_action_origin" NOT NULL,
    "actor_type" "commercial_actor_type" NOT NULL,
    "actor_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "scheduled_for" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_rules" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL,
    "source_state_id" TEXT,
    "target_state_id" TEXT,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "actions" JSONB NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "stop_processing_after_match" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "next_best_actions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "action_type" "commercial_action_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reason" TEXT NOT NULL,
    "confidence" DECIMAL(5,4) NOT NULL,
    "priority" "next_best_action_priority" NOT NULL DEFAULT 'normal',
    "source" "next_best_action_source" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "executed_action_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "next_best_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspaces_status_idx" ON "workspaces"("status");

-- CreateIndex
CREATE INDEX "consultants_workspace_idx" ON "consultants"("workspace_id");

-- CreateIndex
CREATE INDEX "consultants_workspace_status_idx" ON "consultants"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "consultants_workspace_role_idx" ON "consultants"("workspace_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "consultants_workspace_email_key" ON "consultants"("workspace_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "consultants_workspace_document_key" ON "consultants"("workspace_id", "document");

-- CreateIndex
CREATE INDEX "consortiums_workspace_idx" ON "consortiums"("workspace_id");

-- CreateIndex
CREATE INDEX "consortiums_workspace_status_idx" ON "consortiums"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "consortiums_workspace_type_idx" ON "consortiums"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "consortiums_workspace_administrator_idx" ON "consortiums"("workspace_id", "administrator");

-- CreateIndex
CREATE UNIQUE INDEX "consortiums_workspace_administrator_group_key" ON "consortiums"("workspace_id", "administrator", "group_number");

-- CreateIndex
CREATE INDEX "pipeline_stages_workspace_idx" ON "pipeline_stages"("workspace_id");

-- CreateIndex
CREATE INDEX "pipeline_stages_workspace_type_idx" ON "pipeline_stages"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "pipeline_stages_workspace_closed_idx" ON "pipeline_stages"("workspace_id", "is_closed_stage");

-- CreateIndex
CREATE INDEX "pipeline_stages_workspace_won_idx" ON "pipeline_stages"("workspace_id", "is_won_stage");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_workspace_type_order_key" ON "pipeline_stages"("workspace_id", "type", "order");

-- CreateIndex
CREATE UNIQUE INDEX "leads_converted_client_key" ON "leads"("converted_client_id");

-- CreateIndex
CREATE INDEX "leads_workspace_idx" ON "leads"("workspace_id");

-- CreateIndex
CREATE INDEX "leads_workspace_status_idx" ON "leads"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "leads_workspace_source_idx" ON "leads"("workspace_id", "source");

-- CreateIndex
CREATE INDEX "leads_workspace_consultant_idx" ON "leads"("workspace_id", "consultant_id");

-- CreateIndex
CREATE INDEX "leads_workspace_pipeline_stage_idx" ON "leads"("workspace_id", "pipeline_stage_id");

-- CreateIndex
CREATE INDEX "leads_workspace_consortium_type_idx" ON "leads"("workspace_id", "consortium_type");

-- CreateIndex
CREATE INDEX "leads_workspace_created_at_idx" ON "leads"("workspace_id", "created_at");

-- CreateIndex
CREATE INDEX "clients_workspace_idx" ON "clients"("workspace_id");

-- CreateIndex
CREATE INDEX "clients_workspace_status_idx" ON "clients"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "clients_workspace_type_idx" ON "clients"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "clients_workspace_consultant_idx" ON "clients"("workspace_id", "consultant_id");

-- CreateIndex
CREATE INDEX "clients_workspace_name_idx" ON "clients"("workspace_id", "name");

-- CreateIndex
CREATE INDEX "clients_workspace_email_idx" ON "clients"("workspace_id", "email");

-- CreateIndex
CREATE INDEX "clients_workspace_created_at_idx" ON "clients"("workspace_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "clients_workspace_document_key" ON "clients"("workspace_id", "document");

-- CreateIndex
CREATE INDEX "proposals_workspace_idx" ON "proposals"("workspace_id");

-- CreateIndex
CREATE INDEX "proposals_workspace_status_idx" ON "proposals"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "proposals_workspace_consultant_idx" ON "proposals"("workspace_id", "consultant_id");

-- CreateIndex
CREATE INDEX "proposals_workspace_consortium_idx" ON "proposals"("workspace_id", "consortium_id");

-- CreateIndex
CREATE INDEX "proposals_workspace_lead_idx" ON "proposals"("workspace_id", "lead_id");

-- CreateIndex
CREATE INDEX "proposals_workspace_client_idx" ON "proposals"("workspace_id", "client_id");

-- CreateIndex
CREATE INDEX "proposals_workspace_valid_until_idx" ON "proposals"("workspace_id", "valid_until");

-- CreateIndex
CREATE INDEX "proposals_workspace_created_at_idx" ON "proposals"("workspace_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_workspace_code_key" ON "proposals"("workspace_id", "code");

-- CreateIndex
CREATE INDEX "meetings_workspace_idx" ON "meetings"("workspace_id");

-- CreateIndex
CREATE INDEX "meetings_workspace_status_idx" ON "meetings"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "meetings_workspace_type_idx" ON "meetings"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "meetings_workspace_consultant_idx" ON "meetings"("workspace_id", "consultant_id");

-- CreateIndex
CREATE INDEX "meetings_workspace_lead_idx" ON "meetings"("workspace_id", "lead_id");

-- CreateIndex
CREATE INDEX "meetings_workspace_client_idx" ON "meetings"("workspace_id", "client_id");

-- CreateIndex
CREATE INDEX "meetings_workspace_proposal_idx" ON "meetings"("workspace_id", "proposal_id");

-- CreateIndex
CREATE INDEX "meetings_workspace_start_at_idx" ON "meetings"("workspace_id", "start_at");

-- CreateIndex
CREATE INDEX "meetings_consultant_start_at_idx" ON "meetings"("workspace_id", "consultant_id", "start_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_proposal_key" ON "sales"("proposal_id");

-- CreateIndex
CREATE INDEX "sales_workspace_idx" ON "sales"("workspace_id");

-- CreateIndex
CREATE INDEX "sales_workspace_status_idx" ON "sales"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "sales_workspace_quota_status_idx" ON "sales"("workspace_id", "quota_status");

-- CreateIndex
CREATE INDEX "sales_workspace_consultant_idx" ON "sales"("workspace_id", "consultant_id");

-- CreateIndex
CREATE INDEX "sales_workspace_client_idx" ON "sales"("workspace_id", "client_id");

-- CreateIndex
CREATE INDEX "sales_workspace_consortium_idx" ON "sales"("workspace_id", "consortium_id");

-- CreateIndex
CREATE INDEX "sales_workspace_payment_method_idx" ON "sales"("workspace_id", "payment_method");

-- CreateIndex
CREATE INDEX "sales_workspace_sale_date_idx" ON "sales"("workspace_id", "sale_date");

-- CreateIndex
CREATE INDEX "sales_workspace_first_installment_idx" ON "sales"("workspace_id", "first_installment_date");

-- CreateIndex
CREATE UNIQUE INDEX "sales_workspace_contract_number_key" ON "sales"("workspace_id", "contract_number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_workspace_group_quota_key" ON "sales"("workspace_id", "consortium_id", "group_number", "quota_number");

-- CreateIndex
CREATE INDEX "tasks_workspace_idx" ON "tasks"("workspace_id");

-- CreateIndex
CREATE INDEX "tasks_workspace_status_idx" ON "tasks"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "tasks_workspace_priority_idx" ON "tasks"("workspace_id", "priority");

-- CreateIndex
CREATE INDEX "tasks_workspace_type_idx" ON "tasks"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "tasks_workspace_assigned_to_idx" ON "tasks"("workspace_id", "assigned_to_id");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_status_idx" ON "tasks"("workspace_id", "assigned_to_id", "status");

-- CreateIndex
CREATE INDEX "tasks_workspace_due_at_idx" ON "tasks"("workspace_id", "due_at");

-- CreateIndex
CREATE INDEX "tasks_status_due_at_idx" ON "tasks"("workspace_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "tasks_workspace_lead_idx" ON "tasks"("workspace_id", "lead_id");

-- CreateIndex
CREATE INDEX "tasks_workspace_client_idx" ON "tasks"("workspace_id", "client_id");

-- CreateIndex
CREATE INDEX "tasks_workspace_meeting_idx" ON "tasks"("workspace_id", "meeting_id");

-- CreateIndex
CREATE INDEX "tasks_workspace_proposal_idx" ON "tasks"("workspace_id", "proposal_id");

-- CreateIndex
CREATE INDEX "journey_phases_workspace_idx" ON "journey_phases"("workspace_id");

-- CreateIndex
CREATE INDEX "journey_phases_workspace_active_idx" ON "journey_phases"("workspace_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "journey_phases_workspace_code_key" ON "journey_phases"("workspace_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "journey_phases_workspace_order_key" ON "journey_phases"("workspace_id", "order");

-- CreateIndex
CREATE INDEX "journey_states_workspace_idx" ON "journey_states"("workspace_id");

-- CreateIndex
CREATE INDEX "journey_states_workspace_phase_idx" ON "journey_states"("workspace_id", "phase_id");

-- CreateIndex
CREATE INDEX "journey_states_workspace_active_idx" ON "journey_states"("workspace_id", "is_active");

-- CreateIndex
CREATE INDEX "journey_states_workspace_initial_idx" ON "journey_states"("workspace_id", "is_initial");

-- CreateIndex
CREATE INDEX "journey_states_workspace_final_idx" ON "journey_states"("workspace_id", "is_final");

-- CreateIndex
CREATE UNIQUE INDEX "journey_states_workspace_code_key" ON "journey_states"("workspace_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "journey_states_phase_order_key" ON "journey_states"("phase_id", "order");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_idx" ON "commercial_journeys"("workspace_id");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_lead_idx" ON "commercial_journeys"("workspace_id", "lead_id");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_client_idx" ON "commercial_journeys"("workspace_id", "client_id");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_consultant_idx" ON "commercial_journeys"("workspace_id", "consultant_id");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_phase_idx" ON "commercial_journeys"("workspace_id", "current_phase_id");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_state_idx" ON "commercial_journeys"("workspace_id", "current_state_id");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_priority_idx" ON "commercial_journeys"("workspace_id", "priority");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_outcome_idx" ON "commercial_journeys"("workspace_id", "outcome");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_last_interaction_idx" ON "commercial_journeys"("workspace_id", "last_interaction_at");

-- CreateIndex
CREATE INDEX "commercial_journeys_workspace_closed_at_idx" ON "commercial_journeys"("workspace_id", "closed_at");

-- CreateIndex
CREATE INDEX "commercial_events_workspace_idx" ON "commercial_events"("workspace_id");

-- CreateIndex
CREATE INDEX "commercial_events_workspace_journey_idx" ON "commercial_events"("workspace_id", "journey_id");

-- CreateIndex
CREATE INDEX "commercial_events_workspace_type_idx" ON "commercial_events"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "commercial_events_workspace_actor_type_idx" ON "commercial_events"("workspace_id", "actor_type");

-- CreateIndex
CREATE INDEX "commercial_events_workspace_occurred_at_idx" ON "commercial_events"("workspace_id", "occurred_at");

-- CreateIndex
CREATE INDEX "commercial_actions_workspace_idx" ON "commercial_actions"("workspace_id");

-- CreateIndex
CREATE INDEX "commercial_actions_workspace_journey_idx" ON "commercial_actions"("workspace_id", "journey_id");

-- CreateIndex
CREATE INDEX "commercial_actions_workspace_status_idx" ON "commercial_actions"("workspace_id", "status");

-- CreateIndex
CREATE INDEX "commercial_actions_workspace_type_idx" ON "commercial_actions"("workspace_id", "type");

-- CreateIndex
CREATE INDEX "commercial_actions_workspace_origin_idx" ON "commercial_actions"("workspace_id", "origin");

-- CreateIndex
CREATE INDEX "commercial_actions_workspace_scheduled_for_idx" ON "commercial_actions"("workspace_id", "scheduled_for");

-- CreateIndex
CREATE INDEX "workflow_rules_workspace_idx" ON "workflow_rules"("workspace_id");

-- CreateIndex
CREATE INDEX "workflow_rules_workspace_event_type_idx" ON "workflow_rules"("workspace_id", "event_type");

-- CreateIndex
CREATE INDEX "workflow_rules_workspace_active_idx" ON "workflow_rules"("workspace_id", "is_active");

-- CreateIndex
CREATE INDEX "workflow_rules_workspace_priority_idx" ON "workflow_rules"("workspace_id", "priority");

-- CreateIndex
CREATE INDEX "workflow_rules_source_state_idx" ON "workflow_rules"("source_state_id");

-- CreateIndex
CREATE INDEX "workflow_rules_target_state_idx" ON "workflow_rules"("target_state_id");

-- CreateIndex
CREATE UNIQUE INDEX "next_best_actions_executed_action_key" ON "next_best_actions"("executed_action_id");

-- CreateIndex
CREATE INDEX "next_best_actions_workspace_idx" ON "next_best_actions"("workspace_id");

-- CreateIndex
CREATE INDEX "next_best_actions_workspace_journey_idx" ON "next_best_actions"("workspace_id", "journey_id");

-- CreateIndex
CREATE INDEX "next_best_actions_workspace_priority_idx" ON "next_best_actions"("workspace_id", "priority");

-- CreateIndex
CREATE INDEX "next_best_actions_workspace_source_idx" ON "next_best_actions"("workspace_id", "source");

-- CreateIndex
CREATE INDEX "next_best_actions_workspace_action_type_idx" ON "next_best_actions"("workspace_id", "action_type");

-- CreateIndex
CREATE INDEX "next_best_actions_workspace_expires_at_idx" ON "next_best_actions"("workspace_id", "expires_at");

-- CreateIndex
CREATE INDEX "next_best_actions_workspace_accepted_at_idx" ON "next_best_actions"("workspace_id", "accepted_at");

-- CreateIndex
CREATE INDEX "next_best_actions_workspace_rejected_at_idx" ON "next_best_actions"("workspace_id", "rejected_at");

-- AddForeignKey
ALTER TABLE "consultants" ADD CONSTRAINT "consultants_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consortiums" ADD CONSTRAINT "consortiums_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_pipeline_stage_id_fkey" FOREIGN KEY ("pipeline_stage_id") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_client_id_fkey" FOREIGN KEY ("converted_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_consortium_id_fkey" FOREIGN KEY ("consortium_id") REFERENCES "consortiums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_consortium_id_fkey" FOREIGN KEY ("consortium_id") REFERENCES "consortiums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_phases" ADD CONSTRAINT "journey_phases_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_states" ADD CONSTRAINT "journey_states_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_states" ADD CONSTRAINT "journey_states_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "journey_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_journeys" ADD CONSTRAINT "commercial_journeys_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_journeys" ADD CONSTRAINT "commercial_journeys_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_journeys" ADD CONSTRAINT "commercial_journeys_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_journeys" ADD CONSTRAINT "commercial_journeys_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "consultants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_journeys" ADD CONSTRAINT "commercial_journeys_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "journey_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_journeys" ADD CONSTRAINT "commercial_journeys_current_state_id_fkey" FOREIGN KEY ("current_state_id") REFERENCES "journey_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_events" ADD CONSTRAINT "commercial_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_events" ADD CONSTRAINT "commercial_events_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "commercial_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_actions" ADD CONSTRAINT "commercial_actions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_actions" ADD CONSTRAINT "commercial_actions_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "commercial_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_rules" ADD CONSTRAINT "workflow_rules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_rules" ADD CONSTRAINT "workflow_rules_source_state_id_fkey" FOREIGN KEY ("source_state_id") REFERENCES "journey_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_rules" ADD CONSTRAINT "workflow_rules_target_state_id_fkey" FOREIGN KEY ("target_state_id") REFERENCES "journey_states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "next_best_actions" ADD CONSTRAINT "next_best_actions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "next_best_actions" ADD CONSTRAINT "next_best_actions_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "commercial_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "next_best_actions" ADD CONSTRAINT "next_best_actions_executed_action_id_fkey" FOREIGN KEY ("executed_action_id") REFERENCES "commercial_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
