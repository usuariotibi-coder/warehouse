import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const ultimo = await prisma.nivel.findFirst({
    where: { ubicacionId: params.id },
    orderBy: { numero: 'desc' },
  })

  const siguiente = (ultimo?.numero ?? 0) + 1

  const nivel = await prisma.$transaction(async (tx) => {
    const n = await tx.nivel.create({
      data: { ubicacionId: params.id, nombre: `N${siguiente}`, numero: siguiente },
    })
    await tx.ubicacion.update({
      where: { id: params.id },
      data: { nivelesCount: siguiente },
    })
    return n
  })

  return successResponse(nivel, 201)
}
