/*
  Warnings:

  - You are about to drop the column `status_mode` on the `booking_state` table. All the data in the column will be lost.
  - Added the required column `ai_status` to the `booking_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode_status` to the `booking_state` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking_state" DROP COLUMN "status_mode",
ADD COLUMN     "ai_status" TEXT NOT NULL,
ADD COLUMN     "appointment_id" TEXT,
ADD COLUMN     "cancelled_reason" TEXT,
ADD COLUMN     "mode_status" TEXT NOT NULL;
