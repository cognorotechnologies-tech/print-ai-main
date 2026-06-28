-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'VENDOR', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'ASSIGNED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CONFIRMATION', 'ORDER_ASSIGNED', 'ORDER_IN_PRODUCTION', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "mobile" TEXT,
    "password" TEXT,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgFulfillment" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrePrompt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrePrompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fabric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Fabric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GSM" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "priceModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GSM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Size" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hexCode" TEXT NOT NULL,
    "priceModifier" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "gsmId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendorId" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "shippingAddress" JSONB NOT NULL,
    "trackingNumber" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "gsmId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintFile" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "resolution" INTEGER NOT NULL,
    "colorSpace" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "changedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "type" "NotificationType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttempt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_mobile_idx" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_isActive_priority_idx" ON "Vendor"("isActive", "priority");

-- CreateIndex
CREATE INDEX "Design_userId_idx" ON "Design"("userId");

-- CreateIndex
CREATE INDEX "PrePrompt_isActive_sortOrder_idx" ON "PrePrompt"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Fabric_name_key" ON "Fabric"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GSM_value_key" ON "GSM"("value");

-- CreateIndex
CREATE UNIQUE INDEX "Size_name_key" ON "Size"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Color_name_key" ON "Color"("name");

-- CreateIndex
CREATE INDEX "Pricing_isActive_effectiveFrom_idx" ON "Pricing"("isActive", "effectiveFrom");

-- CreateIndex
CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_designId_fabricId_gsmId_sizeId_colorId_key" ON "CartItem"("userId", "designId", "fabricId", "gsmId", "sizeId", "colorId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_vendorId_idx" ON "Order"("vendorId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintFile_orderId_key" ON "PrintFile"("orderId");

-- CreateIndex
CREATE INDEX "PrintFile_orderId_idx" ON "PrintFile"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

-- CreateIndex
CREATE INDEX "Notification_orderId_idx" ON "Notification"("orderId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GSM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_gsmId_fkey" FOREIGN KEY ("gsmId") REFERENCES "GSM"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "Size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintFile" ADD CONSTRAINT "PrintFile_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
