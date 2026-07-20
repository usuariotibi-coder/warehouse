import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, userId, rol } = await requireAuth()
  if (error) return error

  const apartado = await prisma.apartado.findUnique({ where: { id: params.id } })
  if (!apartado) return errorResponse('Reserve not found', 'NOT_FOUND', 404)
  if (apartado.usuarioId !== userId && rol !== Rol.ADMIN) {
    return errorResponse('No permission', 'FORBIDDEN', 403)
  }

  const body = await req.json()
  const updated = await prisma.apartado.update({
    where: { id: params.id },
    data: { notas: body.notas },
  })

  return successResponse(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, userId, rol } = await requireAuth()
  if (error) return error

  const apartado = await prisma.apartado.findUnique({ where: { id: params.id } })
  if (!apartado) return errorResponse('Reserve not found', 'NOT_FOUND', 404)
  if (apartado.usuarioId !== userId && rol !== Rol.ADMIN) {
    return errorResponse('No permission', 'FORBIDDEN', 403)
  }

  await prisma.apartado.update({
    where: { id: params.id },
    data: { estado: 'CANCELADO' },
  })

  return successResponse({ ok: true })
}
