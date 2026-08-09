ALTER TABLE "r2_notifications"
ADD COLUMN "priority" "commercial_journey_priority" NOT NULL DEFAULT 'normal',
ADD COLUMN "href" TEXT NOT NULL DEFAULT '/',
ADD COLUMN "original_due_at" TIMESTAMP(3),
ADD COLUMN "delivery_due_at" TIMESTAMP(3),
ADD COLUMN "snoozed_until" TIMESTAMP(3),
ADD COLUMN "resolved_at" TIMESTAMP(3),
ADD COLUMN "cancelled_at" TIMESTAMP(3),
ADD COLUMN "native_delivered_at" TIMESTAMP(3),
ADD COLUMN "delivery_version" INTEGER NOT NULL DEFAULT 1;

UPDATE "r2_notifications" AS notification
SET
  "original_due_at" = task."due_at",
  "delivery_due_at" = task."due_at",
  "href" = CASE
    WHEN task."opportunity_id" IS NULL THEN '/'
    ELSE '/opportunities/' || task."opportunity_id" || '#r2-action-controls'
  END
FROM "tasks" AS task
WHERE task."id" = notification."task_id";

UPDATE "r2_notifications"
SET
  "original_due_at" = "created_at",
  "delivery_due_at" = "created_at"
WHERE "original_due_at" IS NULL OR "delivery_due_at" IS NULL;

ALTER TABLE "r2_notifications"
ALTER COLUMN "href" DROP DEFAULT,
ALTER COLUMN "original_due_at" SET NOT NULL,
ALTER COLUMN "delivery_due_at" SET NOT NULL;

CREATE INDEX "r2_notifications_delivery_idx"
ON "r2_notifications"("workspace_id", "consultant_id", "resolved_at", "cancelled_at", "delivery_due_at");
