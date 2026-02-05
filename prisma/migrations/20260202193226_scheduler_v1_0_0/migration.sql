/*
  Warnings:

  - You are about to drop the column `data` on the `booking_state` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "booking_state" DROP COLUMN "data",
ADD COLUMN     "desired_date" TEXT,
ADD COLUMN     "last_bot_text" TEXT,
ADD COLUMN     "last_user_text" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "owner_name" TEXT,
ADD COLUMN     "pet_name" TEXT,
ADD COLUMN     "pet_size" TEXT,
ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[];
