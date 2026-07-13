export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'
import { startOfMonth } from 'date-fns'

export async function GET() {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('Sin permiso', 'FORBIDDEN', 403)

  const ahora = new Date()
  const inicioMes = startOfMonth(ahora)
  const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)

  const [
    lotesSinPrecio,
    loteConPrecio,
    articulosTotal,
    articulosEnCero,
    entradasMesCount,
    salidasMesCount,
    apartadosProximosVencer,
    proyectosActivos,
    entradasPorProyecto,
    salidasPorProyecto,
    piezasEnStock,
    piezasSinPrecio,
    piezasConPrecioCero,
    entradasMesValor,
    salidasMesValor,
  ] = await Promise.all([
    prisma.loteEntrada.count({ where: { precioPendiente: true, cantidadDisponible: { gt: 0 } } }),
    prisma.loteEntrada.findMany({
      where: { precioPendiente: false, cantidadDisponible: { gt: 0 } },
      select: { cantidadDisponible: true, precioUnitario: true },
    }),
    prisma.articulo.count({ where: { activo: true } }),
    prisma.articulo.count({
      where: {
        activo: true,
        lotesEntrada: { none: { cantidadDisponible: { gt: 0 } } },
      },
    }),
    prisma.entrada.count({ where: { fecha: { gte: inicioMes } } }),
    prisma.salida.count({ where: { fecha: { gte: inicioMes } } }),
    prisma.apartado.count({
      where: { estado: 'ACTIVO', fechaExpira: { lte: en24h } },
    }),
    prisma.proyecto.count({ where: { estado: 'ACTIVO' } }),
    prisma.$queryRaw<Array<{ proyecto: string; valor: number; entradas: number }>>`
      SELECT
        COALESCE(p.nombre, 'Sin proyecto') as proyecto,
        COALESCE(SUM(le."cantidadOriginal" * le."precioUnitario"), 0)::float as valor,
        COUNT(DISTINCT e.id)::int as entradas
      FROM "Entrada" e
      LEFT JOIN "Proyecto" p ON p.id = e."proyectoId"
      LEFT JOIN "LoteEntrada" le ON le."entradaId" = e.id AND le."precioPendiente" = false
      GROUP BY COALESCE(p.nombre, 'Sin proyecto')
      ORDER BY valor DESC
      LIMIT 10
    `,
    prisma.$queryRaw<Array<{ proyecto: string; valor: number; salidas: number }>>`
      SELECT
        COALESCE(p.nombre, 'Sin proyecto') as proyecto,
        COALESCE(SUM(si."costoTotal"), 0)::float as valor,
        COUNT(DISTINCT s.id)::int as salidas
      FROM "Salida" s
      LEFT JOIN "Proyecto" p ON p.id = s."proyectoId"
      LEFT JOIN "SalidaItem" si ON si."salidaId" = s.id
      GROUP BY COALESCE(p.nombre, 'Sin proyecto')
      ORDER BY valor DESC
      LIMIT 10
    `,
    prisma.loteEntrada.aggregate({
      where: { cantidadDisponible: { gt: 0 } },
      _sum: { cantidadDisponible: true },
    }),
    prisma.loteEntrada.aggregate({
      where: { precioPendiente: true, cantidadDisponible: { gt: 0 } },
      _sum: { cantidadDisponible: true },
    }),
    prisma.loteEntrada.aggregate({
      where: { precioUnitario: 0, cantidadDisponible: { gt: 0 } },
      _sum: { cantidadDisponible: true },
    }),
    prisma.$queryRaw<Array<{ valor: number }>>`
      SELECT COALESCE(SUM(le."cantidadOriginal" * le."precioUnitario"), 0)::float as valor
      FROM "Entrada" e
      LEFT JOIN "LoteEntrada" le ON le."entradaId" = e.id AND le."precioPendiente" = false
      WHERE e.fecha >= ${inicioMes}
    `,
    prisma.$queryRaw<Array<{ valor: number }>>`
      SELECT COALESCE(SUM(si."costoTotal"), 0)::float as valor
      FROM "Salida" s
      LEFT JOIN "SalidaItem" si ON si."salidaId" = s.id
      WHERE s.fecha >= ${inicioMes}
    `,
  ])

  const valorInventario = loteConPrecio.reduce(
    (sum, l) => sum + (l.cantidadDisponible * (l.precioUnitario ?? 0)), 0
  )

  // Merge entradas y salidas por proyecto
  const proyectoMap = new Map<string, any>()

  entradasPorProyecto.forEach(e => {
    proyectoMap.set(e.proyecto, {
      proyecto: e.proyecto,
      entradas: e.entradas,
      valorEntradas: e.valor,
      salidas: 0,
      valorSalidas: 0,
    })
  })

  salidasPorProyecto.forEach(s => {
    const existing = proyectoMap.get(s.proyecto) || { proyecto: s.proyecto, entradas: 0, valorEntradas: 0 }
    proyectoMap.set(s.proyecto, {
      ...existing,
      salidas: s.salidas,
      valorSalidas: s.valor,
    })
  })

  const resumenPorProyecto = Array.from(proyectoMap.values()).sort((a, b) => b.valorSalidas - a.valorSalidas)

  const entradasMesValorFinal = (entradasMesValor[0] as any)?.valor ?? 0
  const salidasMesValorFinal = (salidasMesValor[0] as any)?.valor ?? 0

  return successResponse({
    valorInventario,
    articulosEnStock: articulosTotal - articulosEnCero,
    movimientosMes: entradasMesCount + salidasMesCount,
    lotesSinPrecio,
    piezasEnStock: piezasEnStock._sum.cantidadDisponible ?? 0,
    piezasSinPrecio: piezasSinPrecio._sum.cantidadDisponible ?? 0,
    piezasConPrecioCero: piezasConPrecioCero._sum.cantidadDisponible ?? 0,
    entradasMesValor: entradasMesValorFinal,
    salidasMesValor: salidasMesValorFinal,
    apartadosProximosVencer,
    proyectosActivos,
    resumenPorProyecto,
  })
}

