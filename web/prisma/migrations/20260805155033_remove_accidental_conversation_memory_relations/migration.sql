/*
  Warnings:

  - You are about to drop the column `consultantId` on the `commercial_conversation_memories` table. All the data in the column will be lost.
  - You are about to drop the column `journeyPhaseId` on the `commercial_conversation_memories` table. All the data in the column will be lost.
  - You are about to drop the column `leadId` on the `commercial_conversation_memories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "commercial_conversation_memories" DROP CONSTRAINT "commercial_conversation_memories_consultantId_fkey";

-- DropForeignKey
ALTER TABLE "commercial_conversation_memories" DROP CONSTRAINT "commercial_conversation_memories_journeyPhaseId_fkey";

-- DropForeignKey
ALTER TABLE "commercial_conversation_memories" DROP CONSTRAINT "commercial_conversation_memories_leadId_fkey";

-- AlterTable
ALTER TABLE "commercial_conversation_memories" DROP COLUMN "consultantId",
DROP COLUMN "journeyPhaseId",
DROP COLUMN "leadId";
