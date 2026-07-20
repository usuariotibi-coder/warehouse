export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { UbicacionSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'
import { z } from 'zod'

const UbicacionCreateSchema = UbicacionSchema.extend({
  nivelesCount: z.number().int().min(1).max(20).default(6),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const [ubicaciones, apartadosActivos] = await Promise.all([
    prisma.ubicacion.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      include: {
        niveles: {
          where: { activo: true },
          orderBy: { numero: 'asc' },
          include: {
            articuloNiveles: {
              include: {
                articulo: { select: { id: true, nombre: true, marca: true, fotoUrl: true, unidad: true } },
              },
            },
          },
        },
      },
    }),
    prisma.apartadoItem.groupBy({
      by: ['articuloId'],
      where: { apartado: { estado: 'ACTIVO' } },
      _sum: { cantidad: true },
    }),
  ])

  const reservadoMap = new Map(apartadosActivos.map(a => [a.articuloId, a._sum.cantidad ?? 0]))

  const result = ubicaciones.map((u) => {
    const niveles = u.niveles.map(n => ({
      ...n,
      articuloNiveles: n.articuloNiveles.map(an => ({
        ...an,
        apartadoReservado: reservadoMap.get(an.articuloId) ?? 0,
      })),
    }))

    return {
      ...u,
      niveles,
      totalArticulos: niveles.reduce(
        (sum, n) => sum + n.articuloNiveles.filter((an) => an.cantidad > 0).length, 0
      ),
      totalStock: niveles.reduce(
        (sum, n) => sum + n.articuloNiveles.reduce((s, an) => s + an.cantidad, 0), 0
      ),
    }
  })

  return successResponse(result)
}

export async function POST(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = UbicacionCreateSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const { nivelesCount, ...ubicacionData } = parsed.data

  const ubicacion = await prisma.$transaction(async (tx) => {
    const ub = await tx.ubicacion.create({ data: { ...ubicacionData, nivelesCount } })
    for (let i = 1; i <= nivelesCount; i++) {
      await tx.nivel.create({
        data: { ubicacionId: ub.id, nombre: `N${i}`, numero: i },
      })
    }
    return ub
  })

  return successResponse(ubicacion, 201)
}
