import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { ProyectoSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth()
  if (error) return error

  const proyecto = await prisma.proyecto.findUnique({
    where: { id: params.id },
    include: {
      salidas: {
        include: {
          usuario: { select: { id: true, nombre: true } },
          items: { include: { loteEntrada: { include: { articulo: true } } } },
        },
        orderBy: { fecha: 'desc' },
      },
      apartados: { where: { estado: 'ACTIVO' }, include: { items: { include: { articulo: true } } } },
    },
  })

  if (!proyecto) return errorResponse('Project not found', 'NOT_FOUND', 404)

  const costoTotal = proyecto.salidas.reduce((sum, s) => sum + (s.costoTotal ?? 0), 0)
  return successResponse({ ...proyecto, costoTotal })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = ProyectoSchema.partial().safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const proyecto = await prisma.proyecto.update({ where: { id: params.id }, data: parsed.data as any })
  return successResponse(proyecto)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  await prisma.proyecto.update({ where: { id: params.id }, data: { estado: 'CERRADO' } })
  return successResponse({ ok: true })
}
