export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'
import * as XLSX from 'xlsx'

export async function GET(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  const salidas = await prisma.salida.findMany({
    where: {
      ...(desde || hasta ? {
        fecha: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(hasta) } : {}),
        },
      } : {}),
    },
    include: {
      usuario: { select: { nombre: true } },
      proyecto: { select: { nombre: true } },
      items: {
        include: {
          loteEntrada: { include: { articulo: { select: { nombre: true, unidad: true } } } },
        },
      },
    },
    orderBy: { fecha: 'desc' },
  })

  const rows = salidas.flatMap((s) =>
    s.items.map((item) => ({
      Fecha: s.fecha.toISOString().split('T')[0],
      Item: item.loteEntrada.articulo.nombre,
      Quantity: item.cantidad,
      Unit: item.loteEntrada.articulo.unidad,
      'FIFO price': item.precioUnitario ?? '—',
      'Total cost': item.costoTotal?.toFixed(2) ?? '—',
      Project: s.proyecto?.nombre ?? '—',
      User: s.usuario.nombre,
    }))
  )

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Salidas')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="salidas.xlsx"',
    },
  })
}

