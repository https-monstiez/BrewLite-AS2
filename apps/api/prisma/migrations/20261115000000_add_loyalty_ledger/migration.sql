CREATE TABLE "LoyaltyTransaction" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "orderId" TEXT,
 "points" INTEGER NOT NULL, "kind" TEXT NOT NULL, "reference" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LoyaltyTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "LoyaltyTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LoyaltyTransaction_reference_key" ON "LoyaltyTransaction"("reference");
CREATE INDEX "LoyaltyTransaction_userId_createdAt_idx" ON "LoyaltyTransaction"("userId", "createdAt");
INSERT INTO "LoyaltyTransaction" ("id", "userId", "points", "kind", "reference")
SELECT 'opening-' || "id", "id", "loyaltyPoints", 'OPENING', 'opening:' || "id" FROM "User" WHERE "loyaltyPoints" <> 0;
