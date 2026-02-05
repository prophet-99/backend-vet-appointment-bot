-- CreateEnum
CREATE TYPE "pet_size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "rule_type" AS ENUM ('DAILY_SERVICE_LIMIT', 'DAILY_SIZE_LIMIT');

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_shift" (
    "id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "closure" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "closure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_rule" (
    "id" TEXT NOT NULL,
    "rule_type" "rule_type" NOT NULL,
    "service_id" TEXT,
    "size" "pet_size",
    "max_per_day" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duration_rule" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "size" "pet_size" NOT NULL,
    "minutes" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duration_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "status" "appointment_status" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "owner_name" TEXT NOT NULL,
    "owner_phone" TEXT NOT NULL,
    "pet_name" TEXT NOT NULL,
    "size" "pet_size" NOT NULL,
    "breed_text" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_item" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_state" (
    "conversation_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_state_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_name_key" ON "service"("name");

-- CreateIndex
CREATE UNIQUE INDEX "work_shift_day_of_week_key" ON "work_shift"("day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "closure_date_key" ON "closure"("date");

-- CreateIndex
CREATE UNIQUE INDEX "business_rule_rule_type_service_id_size_key" ON "business_rule"("rule_type", "service_id", "size");

-- CreateIndex
CREATE INDEX "duration_rule_service_id_size_idx" ON "duration_rule"("service_id", "size");

-- CreateIndex
CREATE UNIQUE INDEX "duration_rule_service_id_size_key" ON "duration_rule"("service_id", "size");

-- CreateIndex
CREATE INDEX "appointment_date_status_idx" ON "appointment"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_item_appointment_id_service_id_key" ON "appointment_item"("appointment_id", "service_id");

-- CreateIndex
CREATE INDEX "booking_state_expires_at_idx" ON "booking_state"("expires_at");

-- AddForeignKey
ALTER TABLE "business_rule" ADD CONSTRAINT "business_rule_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duration_rule" ADD CONSTRAINT "duration_rule_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_item" ADD CONSTRAINT "appointment_item_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_item" ADD CONSTRAINT "appointment_item_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
