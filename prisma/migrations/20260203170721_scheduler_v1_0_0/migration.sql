/*
  Warnings:

  - You are about to drop the column `desired_date` on the `booking_state` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "booking_state" DROP COLUMN "desired_date",
ADD COLUMN     "appointment_date" TEXT,
ADD COLUMN     "appointment_time" TEXT;
