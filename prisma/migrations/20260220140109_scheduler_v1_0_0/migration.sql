/*
  Warnings:

  - You are about to drop the column `breed_text` on the `appointment` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `appointment` table. All the data in the column will be lost.
  - You are about to drop the column `appointment_date` on the `booking_state` table. All the data in the column will be lost.
  - You are about to drop the column `appointment_end_time` on the `booking_state` table. All the data in the column will be lost.
  - You are about to drop the column `appointment_start_time` on the `booking_state` table. All the data in the column will be lost.
  - You are about to drop the column `breed_text` on the `booking_state` table. All the data in the column will be lost.
  - You are about to drop the column `owner_name` on the `booking_state` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `business_rule` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `duration_rule` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rule_type,service_id,pet_size]` on the table `business_rule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[service_id,pet_size]` on the table `duration_rule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pet_breed` to the `appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pet_size` to the `appointment` table without a default value. This is not possible if the table is not empty.
  - Made the column `notes` on table `appointment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `show_greeting` to the `booking_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status_mode` to the `booking_state` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pet_size` to the `duration_rule` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "business_rule_rule_type_service_id_size_key";

-- DropIndex
DROP INDEX "duration_rule_service_id_size_idx";

-- DropIndex
DROP INDEX "duration_rule_service_id_size_key";

-- AlterTable
ALTER TABLE "appointment" DROP COLUMN "breed_text",
DROP COLUMN "size",
ADD COLUMN     "pet_breed" TEXT NOT NULL,
ADD COLUMN     "pet_size" "pet_size" NOT NULL,
ALTER COLUMN "notes" SET NOT NULL;

-- AlterTable
ALTER TABLE "booking_state" DROP COLUMN "appointment_date",
DROP COLUMN "appointment_end_time",
DROP COLUMN "appointment_start_time",
DROP COLUMN "breed_text",
DROP COLUMN "owner_name",
ADD COLUMN     "pet_breed" TEXT,
ADD COLUMN     "show_greeting" BOOLEAN NOT NULL,
ADD COLUMN     "status_mode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "business_rule" DROP COLUMN "size",
ADD COLUMN     "pet_size" "pet_size";

-- AlterTable
ALTER TABLE "duration_rule" DROP COLUMN "size",
ADD COLUMN     "pet_size" "pet_size" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "business_rule_rule_type_service_id_pet_size_key" ON "business_rule"("rule_type", "service_id", "pet_size");

-- CreateIndex
CREATE INDEX "duration_rule_service_id_pet_size_idx" ON "duration_rule"("service_id", "pet_size");

-- CreateIndex
CREATE UNIQUE INDEX "duration_rule_service_id_pet_size_key" ON "duration_rule"("service_id", "pet_size");
