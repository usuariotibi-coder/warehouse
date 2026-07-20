import { prisma } from './prisma'

interface FifoItem {
  loteEntradaId: string
  cantidad: number
  precioUnitario: number | null
  costoTotal: number | null
}

interface FifoResult {
  items: FifoItem[]
  costoTotal: number | null
  tieneLotesSinPrecio: boolean
}

export async function calcularFIFO(
  articuloId: string,
  cantidad: number
): Promise<FifoResult> {
  const lotes = await prisma.loteEntrada.findMany({
    where: { articuloId, cantidadDisponible: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  })

  const items: FifoItem[] = []
  let restante = cantidad
  let costoTotal = 0
  let tieneLotesSinPrecio = false

  for (const lote of lotes) {
    if (restante <= 0) break

    const consumir = Math.min(restante, lote.cantidadDisponible)
    const costo = lote.precioUnitario != null ? consumir * lote.precioUnitario : null

    if (lote.precioPendiente) tieneLotesSinPrecio = true

    items.push({
      loteEntradaId: lote.id,
      cantidad: consumir,
      precioUnitario: lote.precioUnitario,
      costoTotal: costo,
    })

    if (costo != null) costoTotal += costo
    restante -= consumir
  }

  return {
    items,
    costoTotal: tieneLotesSinPrecio ? null : costoTotal,
    tieneLotesSinPrecio,
  }
}

export async function descontarStockLote(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  loteId: string,
  cantidad: number
) {
  await tx.loteEntrada.update({
    where: { id: loteId },
    data: { cantidadDisponible: { decrement: cantidad } },
  })

  const lote = await tx.loteEntrada.findUnique({ where: { id: loteId } })
  if (!lote) return

  if (lote.nivelId) {
    await tx.articuloNivel.updateMany({
      where: { nivelId: lote.nivelId, articuloId: lote.articuloId },
      data: { cantidad: { decrement: cantidad } },
    })
  }
}
