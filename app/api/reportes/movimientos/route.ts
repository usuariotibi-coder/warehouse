export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'
import { subDays } from 'date-fns'
import * as XLSX from 'xlsx'

export async function GET(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === Rol.USUARIO) return errorResponse('No permission', 'FORBIDDEN', 403)

  const { searchParams } = new URL(req.url)
  const formato = searchParams.get('formato')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 50
  const skip = (page - 1) * limit

  const desdeParam = searchParams.get('desde')
  const hastaParam = searchParams.get('hasta')
  const articuloId = searchParams.get('articuloId') || undefined
  const ubicacionOrigenId = searchParams.get('ubicacionOrigenId') || undefined
  const ubicacionDestinoId = searchParams.get('ubicacionDestinoId') || undefined
  const usuarioIdParam = searchParams.get('usuarioId') || undefined

  const desde = desdeParam ? new Date(desdeParam) : subDays(new Date(), 30)
  const hasta = hastaParam ? new Date(hastaParam + 'T23:59:59') : new Date()

  const where: any = {
    createdAt: { gte: desde, lte: hasta },
    ...(articuloId && { articuloId }),
    ...(usuarioIdParam && { usuarioId: usuarioIdParam }),
    ...(ubicacionOrigenId && { nivelOrigen: { ubicacionId: ubicacionOrigenId } }),
    ...(ubicacionDestinoId && { nivelDestino: { ubicacionId: ubicacionDestinoId } }),
  }

  const include = {
    articulo: { select: { id: true, nombre: true, marca: true } },
    nivelOrigen: { select: { nombre: true, ubicacion: { select: { nombre: true } } } },
    nivelDestino: { select: { nombre: true, ubicacion: { select: { nombre: true } } } },
    usuario: { select: { id: true, nombre: true } },
  }

  if (formato === 'excel') {
    const movimientos = await prisma.movimiento.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
    })

    const rows = movimientos.map(m => ({
      Date: new Date(m.createdAt).toLocaleString('en-US'),
      Item: m.articulo.nombre,
      Brand: m.articulo.marca ?? '—',
      Quantity: m.cantidadMovida,
      Origin: `${m.nivelOrigen.ubicacion.nombre}-${m.nivelOrigen.nombre}`,
      Destination: `${m.nivelDestino.ubicacion.nombre}-${m.nivelDestino.nombre}`,
      User: m.usuario.nombre,
      Notes: m.notas ?? '',
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos')
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="movimientos-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  }

  const [data, total] = await Promise.all([
    prisma.movimiento.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.movimiento.count({ where }),
  ])

  return successResponse({ data, total, page, totalPages: Math.ceil(total / limit) })
}
