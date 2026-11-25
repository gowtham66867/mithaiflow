-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL DEFAULT 'annapurna',
    "name" TEXT NOT NULL,
    "hindi" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricePerKg" INTEGER NOT NULL,
    "stockGrams" INTEGER NOT NULL,
    "reservedGrams" INTEGER NOT NULL DEFAULT 0,
    "initialGrams" INTEGER NOT NULL,
    "color" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL DEFAULT 'annapurna',
    "pickupAt" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 8,
    "used" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL DEFAULT 'annapurna',
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "grams" INTEGER NOT NULL,
    "slotId" TEXT NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "policy" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL DEFAULT 'annapurna',
    "quoteId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "grams" INTEGER NOT NULL,
    "slotId" TEXT NOT NULL,
    "pickupAt" TEXT NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "policy" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fingerprint" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL DEFAULT 'annapurna',
    "productId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "grams" INTEGER NOT NULL,
    "orderId" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notification" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "workflowRef" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Outbox" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_quoteId_key" ON "Order"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Outbox_orderId_kind_key" ON "Outbox"("orderId", "kind");
