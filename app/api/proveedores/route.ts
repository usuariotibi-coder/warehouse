export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { z } from 'zod'
import { Rol } from '@prisma/client'

const ProveedorSchema = z.object({
  nombre: z.string().min(1, 'Name is required'),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  })

  return successResponse(proveedores)
}

export async function POST(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = ProveedorSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const proveedor = await prisma.proveedor.create({ data: parsed.data })
  return successResponse(proveedor, 201)
}
