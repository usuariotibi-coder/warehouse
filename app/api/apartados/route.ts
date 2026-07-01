export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth, getPaginationParams } from '@/lib/apiHelpers'
import { ApartadoSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { addDays } from 'date-fns'

export async function GET(req: Request) {
  const { error } = await requireAuth()
  if (error) return error

  // Auto-expire any ACTIVO apartados past their expiry date
  await prisma.apartado.updateMany({
    where: { estado: 'ACTIVO', fechaExpira: { lt: new Date() } },
    data: { estado: 'VENCIDO' },
  })

  const { skip, limit } = getPaginationParams(req.url)
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado') ?? 'ACTIVO'

  const where =
    estado === 'historial'
      ? { estado: { not: 'ACTIVO' as any } }
      : { estado: estado as any }

  const [apartados, total] = await Promise.all([
    prisma.apartado.findMany({
      where,
      skip, take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        usuario: { select: { id: true, nombre: true } },
        proyecto: { select: { id: true, nombre: true } },
        items: { include: { articulo: { select: { id: true, nombre: true, unidad: true } } } },
      },
    }),
    prisma.apartado.count({ where }),
  ])

  return successResponse({ apartados, total })
}

export async function POST(req: Request) {
  const { error, userId } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const parsed = ApartadoSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const { proyectoId, notas, items } = parsed.data
  const fechaExpira = addDays(new Date(), 7)

  const apartado = await prisma.apartado.create({
    data: {
      usuarioId: userId!,
      proyectoId,
      notas,
      fechaExpira,
      items: {
        create: items.map((item) => ({
          articuloId: item.articuloId,
          cantidad: item.cantidad,
        })),
      },
    },
    include: { items: true },
  })

  return successResponse(apartado, 201)
}

