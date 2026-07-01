export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { calcularFIFO, descontarStockLote } from '@/lib/fifo'
import { notificarAdminsEntradaSinPrecio } from '@/lib/notifications'
import { registrarAudit } from '@/lib/audit'
import { CSVRowValidated, TipoCSV } from '@/lib/csv-validator'
import { Rol } from '@prisma/client'

export async function POST(req: Request) {
  const { error, userId, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('Sin permiso', 'FORBIDDEN', 403)

  const body = await req.json()
  const { filas, tipo, proyectoId, notas } = body as {
    filas: CSVRowValidated[]
    tipo: TipoCSV
    proyectoId?: string
    notas?: string
  }

  const filasValidas = filas.filter(f => f.status !== 'error')
  if (!filasValidas.length) return errorResponse('No hay filas válidas para procesar', 'NO_VALID_ROWS')

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      if (tipo === 'entrada') {
        const entrada = await tx.entrada.create({
          data: { usuarioId: userId!, proyectoId },
        })

        for (const fila of filasValidas) {
          const { articuloId, nivelId, ubicacionId, cantidad } = fila.resolvedData
          if (!cantidad) continue

          let artId = articuloId
          if (!artId) {
            const nombreParaCrear = fila.originalData['articulo_nombre'] || fila.originalData['numero_parte']
            if (!nombreParaCrear) continue
            const art = await tx.articulo.create({
              data: {
                nombre: nombreParaCrear,
                marca: fila.originalData['marca'] || undefined,
                numeroParte: fila.originalData['numero_parte'] || undefined,
              },
            })
            artId = art.id
          }

          await tx.loteEntrada.create({
            data: {
              entradaId: entrada.id,
              articuloId: artId,
              ubicacionId,
              nivelId,
              cantidadOriginal: cantidad,
              cantidadDisponible: cantidad,
              precioPendiente: true,
            },
          })

          if (nivelId) {
            await tx.articuloNivel.upsert({
              where: { nivelId_articuloId: { nivelId, articuloId: artId } },
              create: { nivelId, articuloId: artId, cantidad },
              update: { cantidad: { increment: cantidad } },
            })
          }
        }

        return { tipo: 'entrada', id: entrada.id, procesadas: filasValidas.length }
      }

      if (tipo === 'salida') {
        const fifoResults = await Promise.all(
          filasValidas.map(f => calcularFIFO(f.resolvedData.articuloId!, f.resolvedData.cantidad!))
        )

        let costoTotal = 0
        let hayLotesSinPrecio = false
        const salida = await tx.salida.create({
          data: { usuarioId: userId!, proyectoId, notas },
        })

        for (let i = 0; i < filasValidas.length; i++) {
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

        return { tipo: 'salida', id: salida.id, procesadas: filasValidas.length }
      }

      if (tipo === 'apartado') {
        const fechaExpira = new Date()
        fechaExpira.setDate(fechaExpira.getDate() + 7)
        const apartado = await tx.apartado.create({
          data: { usuarioId: userId!, proyectoId, notas, fechaExpira },
        })

        for (const fila of filasValidas) {
          const { articuloId, cantidad } = fila.resolvedData
          if (!articuloId || !cantidad) continue
          await tx.apartadoItem.create({
            data: { apartadoId: apartado.id, articuloId, cantidad },
          })
        }

        return { tipo: 'apartado', id: apartado.id, procesadas: filasValidas.length }
      }

      throw new Error('Tipo no válido')
    })

    if (resultado.tipo === 'entrada') {
      await notificarAdminsEntradaSinPrecio(resultado.id)
      await registrarAudit('CSV_ENTRADA', 'Entrada', { usuarioId: userId, entidadId: resultado.id })
    }

    return successResponse(resultado)
  } catch (err: any) {
    return errorResponse(err.message ?? 'Error al procesar CSV', 'PROCESS_ERROR', 500)
  }
}
