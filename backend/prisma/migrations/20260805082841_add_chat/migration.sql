-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "senderRole" "Role" NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_shopId_idx" ON "Message"("shopId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
