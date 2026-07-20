import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const entrada = await prisma.entrada.findUnique({
    where: { id: params.id },
    include: {
      usuario: { select: { id: true, nombre: true } },
      proyecto: { select: { id: true, nombre: true } },
      lotes: {
        include: {
          articulo: { select: { id: true, nombre: true, unidad: true, marca: true, numeroParte: true } },
          proveedor: { select: { id: true, nombre: true } },
          salidaItems: true,
          apartadoItems: true,
        },
      },
    },
  })

  if (!entrada) return errorResponse('Entry not found', 'NOT_FOUND', 404)
  return successResponse(entrada)
}
