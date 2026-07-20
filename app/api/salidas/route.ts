export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth, getPaginationParams } from '@/lib/apiHelpers'
import { SalidaSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { calcularFIFO, descontarStockLote } from '@/lib/fifo'
import { registrarAudit } from '@/lib/audit'
import { Rol } from '@prisma/client'

export async function GET(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const { skip, limit } = getPaginationParams(req.url)

  const [salidas, total] = await Promise.all([
    prisma.salida.findMany({
      skip, take: limit,
      orderBy: { fecha: 'desc' },
      include: {
        usuario: { select: { id: true, nombre: true } },
        proyecto: { select: { id: true, nombre: true } },
        items: { include: { loteEntrada: { include: { articulo: true } } } },
      },
    }),
    prisma.salida.count(),
  ])

  return successResponse({ salidas, total })
}

export async function POST(req: Request) {
  const { error, userId, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = SalidaSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const { proyectoId, notas, items } = parsed.data

  const fifoResults = await Promise.all(
    items.map((item) => calcularFIFO(item.articuloId, item.cantidad))
  )

  const salida = await prisma.$transaction(async (tx) => {
    let costoTotal = 0
    let hayLotesSinPrecio = false

    const salida = await tx.salida.create({
      data: { usuarioId: userId!, proyectoId, notas },
    })

    for (let i = 0; i < items.length; i++) {
      const fifo = fifoResults[i]
      if (fifo.tieneLotesSinPrecio) hayLotesSinPrecio = true

      for (const fi of fifo.items) {
        await tx.salidaItem.create({
          data: {
            salidaId: salida.id,
            loteEntradaId: fi.loteEntradaId,
            cantidad: fi.cantidad,
            precioUnitario: fi.precioUnitario,
            costoTotal: fi.costoTotal,
          },
        })

        await descontarStockLote(tx, fi.loteEntradaId, fi.cantidad)

        if (fi.costoTotal) costoTotal += fi.costoTotal
      }
    }

    await tx.salida.update({
      where: { id: salida.id },
      data: { costoTotal: hayLotesSinPrecio ? null : costoTotal },
    })

    return salida
  })

  await registrarAudit('CREATE_SALIDA', 'Salida', { usuarioId: userId, entidadId: salida.id })

  return successResponse(salida, 201)
}
