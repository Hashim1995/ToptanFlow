-- CHANGE-032: Web Push subscriptions + transactional outbox deliveries

CREATE TYPE "PushDeliveryStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED_RETRYABLE',
  'FAILED_FINAL',
  'SKIPPED_INVALID_SUBSCRIPTION'
);

CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "userAgent" TEXT,
  "deviceLabel" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP(3),
  "disabledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushNotificationEvent" (
  "id" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "payloadJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PushNotificationEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushDelivery" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "status" "PushDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastErrorCategory" TEXT,
  "nextAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_isActive_idx" ON "PushSubscription"("userId", "isActive");
CREATE INDEX "PushSubscription_isActive_idx" ON "PushSubscription"("isActive");

CREATE UNIQUE INDEX "PushNotificationEvent_idempotencyKey_key" ON "PushNotificationEvent"("idempotencyKey");
CREATE INDEX "PushNotificationEvent_eventKey_idx" ON "PushNotificationEvent"("eventKey");
CREATE INDEX "PushNotificationEvent_actorUserId_idx" ON "PushNotificationEvent"("actorUserId");
CREATE INDEX "PushNotificationEvent_createdAt_idx" ON "PushNotificationEvent"("createdAt");

CREATE UNIQUE INDEX "PushDelivery_eventId_subscriptionId_key" ON "PushDelivery"("eventId", "subscriptionId");
CREATE INDEX "PushDelivery_status_nextAttemptAt_idx" ON "PushDelivery"("status", "nextAttemptAt");
CREATE INDEX "PushDelivery_subscriptionId_idx" ON "PushDelivery"("subscriptionId");

ALTER TABLE "PushSubscription"
  ADD CONSTRAINT "PushSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PushNotificationEvent"
  ADD CONSTRAINT "PushNotificationEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PushDelivery"
  ADD CONSTRAINT "PushDelivery_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "PushNotificationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PushDelivery"
  ADD CONSTRAINT "PushDelivery_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
