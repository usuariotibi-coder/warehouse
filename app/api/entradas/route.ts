export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth, getPaginationParams } from '@/lib/apiHelpers'
import { EntradaSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { notificarAdminsEntradaSinPrecio } from '@/lib/notifications'
import { registrarAudit } from '@/lib/audit'
import { Rol } from '@prisma/client'

export async function GET(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const { skip, limit } = getPaginationParams(req.url)
  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  const where = {
    ...(desde || hasta ? {
      fecha: {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      },
    } : {}),
  }

  const [entradas, total] = await Promise.all([
    prisma.entrada.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fecha: 'desc' },
      include: {
        usuario: { select: { id: true, nombre: true } },
        proyecto: { select: { id: true, nombre: true } },
        lotes: { include: { articulo: { select: { id: true, nombre: true, unidad: true, marca: true, numeroParte: true } }, proveedor: { select: { id: true, nombre: true } } } },
      },
    }),
    prisma.entrada.count({ where }),
  ])

  return successResponse({ entradas, total })
}

export async function POST(req: Request) {
  const { error, userId, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = EntradaSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const { proyectoId, lotes } = parsed.data

  const entrada = await prisma.$transaction(async (tx) => {
    const entrada = await tx.entrada.create({
      data: { usuarioId: userId!, proyectoId },
    })

    for (const lote of lotes) {
      await tx.loteEntrada.create({
        data: {
          entradaId: entrada.id,
          articuloId: lote.articuloId,
          ubicacionId: lote.ubicacionId,
          nivelId: lote.nivelId,
          proveedorId: lote.proveedorId,
          cantidadOriginal: lote.cantidadOriginal,
          cantidadDisponible: lote.cantidadOriginal,
          precioPendiente: true,
        },
      })

      if (lote.nivelId) {
        await tx.articuloNivel.upsert({
          where: { nivelId_articuloId: { nivelId: lote.nivelId, articuloId: lote.articuloId } },
          create: { nivelId: lote.nivelId, articuloId: lote.articuloId, cantidad: lote.cantidadOriginal },
          update: { cantidad: { increment: lote.cantidadOriginal } },
        })
      }
    }

    return entrada
  })

  await notificarAdminsEntradaSinPrecio(entrada.id)
  await registrarAudit('CREATE_ENTRADA', 'Entrada', { usuarioId: userId, entidadId: entrada.id })

  return successResponse(entrada, 201)
}
