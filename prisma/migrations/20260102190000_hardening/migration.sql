-- Add unique membership constraint and automation run windows
ALTER TABLE "Membership"
ADD CONSTRAINT "Membership_userId_key" UNIQUE ("userId");

ALTER TABLE "AutomationRun"
ADD COLUMN "windowStart" TIMESTAMP(3),
ADD COLUMN "windowEnd" TIMESTAMP(3);

UPDATE "AutomationRun"
SET "windowStart" = "createdAt"
WHERE "windowStart" IS NULL;

ALTER TABLE "AutomationRun"
ALTER COLUMN "windowStart" SET NOT NULL,
ALTER COLUMN "windowStart" SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "AutomationRun_tenantId_ruleId_windowStart_idx"
ON "AutomationRun"("tenantId", "ruleId", "windowStart");

CREATE UNIQUE INDEX "AutomationRun_ruleId_windowStart_key"
ON "AutomationRun"("ruleId", "windowStart");

CREATE INDEX "DashboardPermission_tenantId_userId_idx"
ON "DashboardPermission"("tenantId", "userId");
