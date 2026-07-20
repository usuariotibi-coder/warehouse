import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { ArticuloSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAuth()
  if (error) return error

  const [articulo, apartadoReservado] = await Promise.all([
    prisma.articulo.findUnique({
      where: { id: params.id },
      include: {
        articuloNiveles: { include: { nivel: { include: { ubicacion: true } } } },
        lotesEntrada: {
          orderBy: { createdAt: 'asc' },
          include: { entrada: { include: { usuario: true } } },
        },
        movimientos: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            nivelOrigen:  { select: { nombre: true, ubicacion: { select: { nombre: true } } } },
            nivelDestino: { select: { nombre: true, ubicacion: { select: { nombre: true } } } },
            usuario: { select: { nombre: true } },
          },
        },
      },
    }),
    prisma.apartadoItem.aggregate({
      where: { articuloId: params.id, apartado: { estado: 'ACTIVO' } },
      _sum: { cantidad: true },
    }),
  ])

  const result = articulo ? { ...articulo, apartadoReservado: apartadoReservado._sum.cantidad ?? 0 } : null

  if (!result) return errorResponse('Item not found', 'NOT_FOUND', 404)
  return successResponse(result)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = ArticuloSchema.partial().safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const articulo = await prisma.articulo.update({ where: { id: params.id }, data: parsed.data })
  return successResponse(articulo)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  await prisma.articulo.update({ where: { id: params.id }, data: { activo: false } })
  return successResponse({ ok: true })
}
