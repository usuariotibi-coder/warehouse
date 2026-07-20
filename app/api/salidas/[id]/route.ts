import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const salida = await prisma.salida.findUnique({
    where: { id: params.id },
    include: {
      usuario: true,
      proyecto: true,
      items: { include: { loteEntrada: { include: { articulo: true, entrada: true } } } },
    },
  })

  if (!salida) return errorResponse('Exit not found', 'NOT_FOUND', 404)
  return successResponse(salida)
}
