/*
  Warnings:

  - A unique constraint covering the columns `[nu_control]` on the table `patients` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `first_name` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nu_control` to the `patients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "first_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "last_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "nu_control" VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "patients_nu_control_key" ON "patients"("nu_control");

-- CreateIndex
CREATE INDEX "patients_nu_control_idx" ON "patients"("nu_control");
