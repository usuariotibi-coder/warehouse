export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'
import { z } from 'zod'

const MovimientoSchema = z.object({
  articuloId:     z.string().min(1),
  nivelOrigenId:  z.string().min(1),
  nivelDestinoId: z.string().min(1),
  notas:          z.string().optional(),
})

export async function POST(req: Request) {
  const { error, rol, userId } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse(
    'Only Storekeeper or Admin can perform movements',
    'ROL_INSUFICIENTE',
    403,
  )

  const body = await req.json()
  const parsed = MovimientoSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const { articuloId, nivelOrigenId, nivelDestinoId, notas } = parsed.data

  if (nivelOrigenId === nivelDestinoId) return errorResponse(
    'Destination level must be different from origin level',
    'MISMO_NIVEL',
  )

  // Pre-transaction: gather data
  const [articuloNivelOrigen, lotesAfectados, nivelOrigenData, nivelDestinoData] = await Promise.all([
    prisma.articuloNivel.findUnique({ where: { nivelId_articuloId: { nivelId: nivelOrigenId, articuloId } } }),
    prisma.loteEntrada.findMany({
      where: { articuloId, nivelId: nivelOrigenId, cantidadDisponible: { gt: 0 } },
      select: { id: true },
    }),
    prisma.nivel.findUnique({ where: { id: nivelOrigenId }, include: { ubicacion: { select: { nombre: true } } } }),
    prisma.nivel.findUnique({ where: { id: nivelDestinoId }, include: { ubicacion: { select: { nombre: true } } } }),
  ])

  if (!articuloNivelOrigen || articuloNivelOrigen.cantidad === 0) return errorResponse(
    'No stock of this component in the selected level',
    'SIN_STOCK_EN_ORIGEN',
  )

  const cantidadTotal = articuloNivelOrigen.cantidad
  const loteIds = lotesAfectados.map(l => l.id)

  // Find apartados afectados antes de la transacción
  const apartadosAfectados = await prisma.apartadoItem.findMany({
    where: {
      articuloId,
      loteEntradaId: { in: loteIds },
      apartado: { estado: 'ACTIVO' },
    },
    include: {
      apartado: {
        include: {
          usuario: { select: { id: true, nombre: true } },
          proyecto: { select: { nombre: true } },
        },
      },
    },
  })

  let movimientoId: string

  await prisma.$transaction(async (tx) => {
    // PASO 1 — Reasignar lotes al nivel destino
    await tx.loteEntrada.updateMany({
      where: { articuloId, nivelId: nivelOrigenId },
      data: { nivelId: nivelDestinoId },
    })

    // PASO 2 — ArticuloNivel origen → 0
    await tx.articuloNivel.update({
      where: { nivelId_articuloId: { nivelId: nivelOrigenId, articuloId } },
      data: { cantidad: 0 },
    })

    // PASO 3 — ArticuloNivel destino += cantidadTotal
    await tx.articuloNivel.upsert({
      where: { nivelId_articuloId: { nivelId: nivelDestinoId, articuloId } },
      update: { cantidad: { increment: cantidadTotal } },
      create: { nivelId: nivelDestinoId, articuloId, cantidad: cantidadTotal },
    })

    // PASO 5 — Registro Movimiento
    const mov = await tx.movimiento.create({
      data: { articuloId, nivelOrigenId, nivelDestinoId, cantidadMovida: cantidadTotal, usuarioId: userId!, notas },
    })
    movimientoId = mov.id

    // PASO 6 — AuditLog
    await tx.auditLog.create({
      data: {
        usuarioId: userId,
        accion: 'MOVIMIENTO_COMPONENTE',
        entidad: 'Articulo',
        entidadId: articuloId,
        detalle: {
          nivelOrigen: `${nivelOrigenData?.ubicacion.nombre}-${nivelOrigenData?.nombre}`,
          nivelDestino: `${nivelDestinoData?.ubicacion.nombre}-${nivelDestinoData?.nombre}`,
          cantidadMovida: cantidadTotal,
          lotesAfectados: loteIds.length,
        },
      },
    })
  })

  // PASO 7 — Notificaciones post-transacción
  const apartadoIdsVistos = new Set<string>()
  const usuario = await prisma.usuario.findUnique({ where: { id: userId! }, select: { nombre: true } })

  for (const item of apartadosAfectados) {
    const apartadoId = item.apartadoId
    if (apartadoIdsVistos.has(apartadoId)) continue
    apartadoIdsVistos.add(apartadoId)

    const duenoId = item.apartado.usuarioId
    if (duenoId === userId) continue

    await prisma.notificacion.create({
      data: {
        usuarioId: duenoId,
        tipo: 'MOVIMIENTO_COMPONENTE',
        titulo: 'Components relocated',
        mensaje: `The components you reserved for ${item.apartado.proyecto?.nombre ?? 'no project'} were moved from ${nivelOrigenData?.ubicacion.nombre}-${nivelOrigenData?.nombre} to ${nivelDestinoData?.ubicacion.nombre}-${nivelDestinoData?.nombre} by ${usuario?.nombre}.`,
        metadata: { apartadoId, movimientoId: movimientoId!, articuloId },
      },
    })
  }

  return successResponse({
    success: true,
    movimientoId: movimientoId!,
    cantidadMovida: cantidadTotal,
    lotesAfectados: loteIds.length,
    apartadosActualizados: apartadoIdsVistos.size,
  }, 201)
}
