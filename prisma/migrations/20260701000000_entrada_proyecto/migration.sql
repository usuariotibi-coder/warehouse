-- Add proyectoId to Entrada and remove notas
ALTER TABLE "Entrada" ADD COLUMN IF NOT EXISTS "proyectoId" TEXT;
ALTER TABLE "Entrada" DROP COLUMN IF EXISTS "notas";

ALTER TABLE "Entrada"
  ADD CONSTRAINT "Entrada_proyectoId_fkey"
  FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Entrada_proyectoId_idx" ON "Entrada"("proyectoId");
