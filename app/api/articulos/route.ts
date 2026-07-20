export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth, getPaginationParams } from '@/lib/apiHelpers'
import { ArticuloSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function GET(req: Request) {
  const { error } = await requireAuth()
  if (error) return error

  // Auto-expire apartados vencidos para que el conteo de reservados sea preciso
  await prisma.apartado.updateMany({
    where: { estado: 'ACTIVO', fechaExpira: { lt: new Date() } },
    data: { estado: 'VENCIDO' },
  })

  const { searchParams } = new URL(req.url)
  const { skip, limit } = getPaginationParams(req.url)
  const q = searchParams.get('q')

  const where = {
    activo: true,
    ...(q ? { OR: [
      { nombre: { contains: q, mode: 'insensitive' as const } },
      { marca: { contains: q, mode: 'insensitive' as const } },
      { numeroParte: { contains: q, mode: 'insensitive' as const } },
    ]} : {}),
  }

  const [articulos, total, apartadosActivos] = await Promise.all([
    prisma.articulo.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nombre: 'asc' },
      include: {
        lotesEntrada: { where: { cantidadDisponible: { gt: 0 } }, select: { cantidadDisponible: true } },
        articuloNiveles: {
          where: { cantidad: { gt: 0 } },
          include: { nivel: { select: { nombre: true, ubicacion: { select: { nombre: true } } } } },
        },
      },
    }),
    prisma.articulo.count({ where }),
    prisma.apartadoItem.groupBy({
      by: ['articuloId'],
      where: { apartado: { estado: 'ACTIVO' } },
      _sum: { cantidad: true },
    }),
  ])

  const reservadoMap = new Map(apartadosActivos.map(a => [a.articuloId, a._sum.cantidad ?? 0]))

  const result = articulos.map(a => ({
    ...a,
    apartadoReservado: reservadoMap.get(a.id) ?? 0,
    ubicaciones: a.articuloNiveles.map(an => `${an.nivel.ubicacion.nombre}-${an.nivel.nombre}`),
  }))

  return successResponse({ articulos: result, total, page: Math.ceil(skip / limit) + 1, limit })
}

export async function POST(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = ArticuloSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const articulo = await prisma.articulo.create({ data: parsed.data })
  return successResponse(articulo, 201)
}

