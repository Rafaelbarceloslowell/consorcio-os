CREATE TYPE "consortium_rule_status" AS ENUM ('verified', 'stale', 'unverified');

CREATE TYPE "consortium_rule_source" AS ENUM ('manual_verified', 'official_document', 'official_api', 'operator_verified');

ALTER TABLE "consortiums"
ADD COLUMN "rule_status" "consortium_rule_status" NOT NULL DEFAULT 'unverified',
ADD COLUMN "rule_source" "consortium_rule_source",
ADD COLUMN "source_reference" TEXT,
ADD COLUMN "verified_at" TIMESTAMP(3),
ADD COLUMN "effective_from" TIMESTAMP(3),
ADD COLUMN "effective_until" TIMESTAMP(3),
ADD COLUMN "rule_version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "min_installment_value" DECIMAL(18, 2),
ADD COLUMN "max_installment_value" DECIMAL(18, 2),
ADD COLUMN "embedded_bid_allowed" BOOLEAN;

CREATE INDEX "consortiums_workspace_rule_status_idx"
ON "consortiums"("workspace_id", "rule_status");
