import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { calcularFIFO, descontarStockLote } from '@/lib/fifo'
import { Rol } from '@prisma/client'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { error, userId, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('Sin permiso', 'FORBIDDEN', 403)

  const apartado = await prisma.apartado.findUnique({
    where: { id: params.id },
    include: { items: true },
  })

  if (!apartado) return errorResponse('Apartado no encontrado', 'NOT_FOUND', 404)
  if (apartado.estado !== 'ACTIVO') return errorResponse('El apartado no está activo', 'INVALID_STATE', 409)

  const fifoResults = await Promise.all(
    apartado.items.map((item) => calcularFIFO(item.articuloId, item.cantidad))
  )

  const salida = await prisma.$transaction(async (tx) => {
    let costoTotal = 0
    let hayLotesSinPrecio = false

    const salida = await tx.salida.create({
      data: { usuarioId: userId!, proyectoId: apartado.proyectoId },
    })

    for (let i = 0; i < apartado.items.length; i++) {
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

    await tx.salida.update({ where: { id: salida.id }, data: { costoTotal: hayLotesSinPrecio ? null : costoTotal } })

    await tx.apartado.update({
      where: { id: params.id },
      data: { estado: 'CONVERTIDO_SALIDA' },
    })

    return salida
  })

  return successResponse(salida, 201)
}
