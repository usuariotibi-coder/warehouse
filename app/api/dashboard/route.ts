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
    entradasMes,
    salidasMes,
    apartadosProximosVencer,
    proyectosActivos,
    entradasPorProyecto,
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
  ])

  const valorInventario = loteConPrecio.reduce(
    (sum, l) => sum + (l.cantidadDisponible * (l.precioUnitario ?? 0)), 0
  )

  return successResponse({
    valorInventario,
    articulosEnStock: articulosTotal - articulosEnCero,
    articulosEnCero,
    movimientosMes: entradasMes + salidasMes,
    lotesSinPrecio,
    apartadosProximosVencer,
    proyectosActivos,
    entradasPorProyecto,
  })
}

