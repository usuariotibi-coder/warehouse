import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { UbicacionSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = UbicacionSchema.partial().safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const ubicacion = await prisma.ubicacion.update({ where: { id: params.id }, data: parsed.data })
  return successResponse(ubicacion)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const count = await prisma.articuloNivel.count({
    where: { nivel: { ubicacionId: params.id }, cantidad: { gt: 0 } },
  })

  if (count > 0) {
    return errorResponse('Cannot delete a location with items in its levels', 'UBICACION_CON_STOCK', 409)
  }

  await prisma.ubicacion.update({ where: { id: params.id }, data: { activa: false } })
  return successResponse({ ok: true })
}
