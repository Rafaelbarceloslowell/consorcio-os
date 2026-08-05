-- CreateEnum
CREATE TYPE "commercial_conversation_stage" AS ENUM ('opening', 'rapport', 'discovery', 'qualification', 'diagnosis', 'strategy', 'meeting', 'follow_up', 'closing');

-- CreateEnum
CREATE TYPE "commercial_conversation_goal" AS ENUM ('get_first_response', 'understand_interest_area', 'understand_project_purpose', 'understand_timing', 'understand_budget', 'understand_objection', 'present_strategy', 'schedule_meeting', 'confirm_follow_up', 'close_next_step');

-- CreateTable
CREATE TABLE "commercial_conversation_memories" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "stage" "commercial_conversation_stage" NOT NULL,
    "goal" "commercial_conversation_goal" NOT NULL,
    "last_intent" TEXT,
    "last_incoming_message" TEXT,
    "last_suggested_reply" TEXT,
    "analyzed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "consultantId" TEXT,
    "leadId" TEXT,
    "journeyPhaseId" TEXT,

    CONSTRAINT "commercial_conversation_memories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "commercial_conversation_memories_journey_key" ON "commercial_conversation_memories"("journey_id");

-- CreateIndex
CREATE INDEX "commercial_conversation_memories_workspace_idx" ON "commercial_conversation_memories"("workspace_id");

-- CreateIndex
CREATE INDEX "commercial_conversation_memories_stage_idx" ON "commercial_conversation_memories"("workspace_id", "stage");

-- CreateIndex
CREATE INDEX "commercial_conversation_memories_analyzed_at_idx" ON "commercial_conversation_memories"("workspace_id", "analyzed_at");

-- AddForeignKey
ALTER TABLE "commercial_conversation_memories" ADD CONSTRAINT "commercial_conversation_memories_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "commercial_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_conversation_memories" ADD CONSTRAINT "commercial_conversation_memories_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_conversation_memories" ADD CONSTRAINT "commercial_conversation_memories_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "consultants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_conversation_memories" ADD CONSTRAINT "commercial_conversation_memories_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_conversation_memories" ADD CONSTRAINT "commercial_conversation_memories_journeyPhaseId_fkey" FOREIGN KEY ("journeyPhaseId") REFERENCES "journey_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
