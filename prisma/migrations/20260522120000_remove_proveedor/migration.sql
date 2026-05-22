-- Remove proveedorNombre from Entrada
ALTER TABLE "Entrada" DROP COLUMN IF EXISTS "proveedorNombre";

-- Drop Proveedor table
DROP TABLE IF EXISTS "Proveedor";
