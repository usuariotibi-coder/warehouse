import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function DELETE(_: Request, { params }: { params: { id: string; nivelId: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const conStock = await prisma.articuloNivel.count({
    where: { nivelId: params.nivelId, cantidad: { gt: 0 } },
  })

  if (conStock > 0) {
    return errorResponse('Cannot delete a level that has items', 'NIVEL_CON_STOCK', 409)
  }

  await prisma.nivel.update({ where: { id: params.nivelId }, data: { activo: false } })
  return successResponse({ ok: true })
}
