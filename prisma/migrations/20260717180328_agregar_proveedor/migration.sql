/*
  Warnings:

  - You are about to drop the `ArticuloUbicacion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ArticuloUbicacion" DROP CONSTRAINT "ArticuloUbicacion_articuloId_fkey";

-- DropForeignKey
ALTER TABLE "ArticuloUbicacion" DROP CONSTRAINT "ArticuloUbicacion_ubicacionId_fkey";

-- AlterTable
ALTER TABLE "LoteEntrada" ADD COLUMN     "proveedorId" TEXT;

-- AlterTable
ALTER TABLE "Ubicacion" ALTER COLUMN "nivelesCount" SET DEFAULT 6;

-- DropTable
DROP TABLE "ArticuloUbicacion";

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");

-- AddForeignKey
ALTER TABLE "LoteEntrada" ADD CONSTRAINT "LoteEntrada_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
