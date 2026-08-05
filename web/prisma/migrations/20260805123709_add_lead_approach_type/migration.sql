-- CreateEnum
CREATE TYPE "lead_approach_type" AS ENUM ('new', 'reactivation');

-- DropForeignKey
ALTER TABLE "commercial_journeys" DROP CONSTRAINT "commercial_journeys_lead_id_fkey";

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "approach_type" "lead_approach_type";

-- AddForeignKey
ALTER TABLE "commercial_journeys" ADD CONSTRAINT "commercial_journeys_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
