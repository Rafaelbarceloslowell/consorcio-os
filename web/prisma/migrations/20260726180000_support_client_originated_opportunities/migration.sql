ALTER TABLE "commercial_journeys"
ALTER COLUMN "lead_id" DROP NOT NULL;

ALTER TABLE "commercial_journeys"
ADD CONSTRAINT "commercial_journeys_origin_check"
CHECK ("lead_id" IS NOT NULL OR "client_id" IS NOT NULL);
