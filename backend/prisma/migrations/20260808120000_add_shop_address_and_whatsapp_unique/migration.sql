-- AlterTable: add optional shop address
ALTER TABLE "Shop" ADD COLUMN "address" TEXT;

-- CreateIndex: a WhatsApp number uniquely identifies a shop (NULLs exempt in SQLite)
CREATE UNIQUE INDEX "Shop_whatsappNumber_key" ON "Shop"("whatsappNumber");
