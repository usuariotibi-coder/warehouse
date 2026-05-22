export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'
import * as XLSX from 'xlsx'

export async function GET(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('Sin permiso', 'FORBIDDEN', 403)

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  const entradas = await prisma.entrada.findMany({
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
      lotes: { include: { articulo: { select: { nombre: true, marca: true, unidad: true } } } },
    },
    orderBy: { fecha: 'desc' },
  })

  const rows = entradas.flatMap((e) =>
    e.lotes.map((l) => ({
      Fecha: e.fecha.toISOString().split('T')[0],
      Artículo: l.articulo.nombre,
      Marca: l.articulo.marca ?? '—',
      Cantidad: l.cantidadOriginal,
      Unidad: l.articulo.unidad,
      'Precio unitario': l.precioUnitario ?? 'Sin precio',
      'Total lote': l.precioUnitario ? (l.cantidadOriginal * l.precioUnitario).toFixed(2) : '—',
      Almacenista: e.usuario.nombre,
    }))
  )

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Entradas')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="entradas.xlsx"',
    },
  })
}

