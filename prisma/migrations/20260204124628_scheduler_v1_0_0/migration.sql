/*
  Warnings:

  - You are about to drop the column `appointment_time` on the `booking_state` table. All the data in the column will be lost.
  - You are about to drop the column `services` on the `booking_state` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "booking_state" DROP COLUMN "appointment_time",
DROP COLUMN "services",
ADD COLUMN     "appointment_end_time" TEXT,
ADD COLUMN     "appointment_start_time" TEXT,
ADD COLUMN     "breed_text" TEXT,
ADD COLUMN     "preferred_date" TEXT,
ADD COLUMN     "preferred_time" TEXT,
ADD COLUMN     "services_name" TEXT[] DEFAULT ARRAY[]::TEXT[];
