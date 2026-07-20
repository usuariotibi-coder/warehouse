import { prisma } from './prisma'

export interface CSVRowValidated {
  rowNumber: number
  originalData: Record<string, string>
  status: 'valid' | 'warning' | 'error'
  errors: string[]
  warnings: string[]
  resolvedData: {
    articuloId?: string
    nivelId?: string
    ubicacionId?: string
    proyectoId?: string
    proveedorId?: string
    cantidad?: number
  }
  ubicacionSugerida?: {
    nivelId: string
    ubicacionNombre: string
    nivelNombre: string
    cantidadExistente: number
    motivo: 'mismo_articulo_existente'
  }
}

export type TipoCSV = 'entrada' | 'salida' | 'apartado'

export function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? '').trim()]))
  })
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

export async function validarCSV(
  rows: Record<string, string>[],
  tipo: TipoCSV
): Promise<CSVRowValidated[]> {
  const [articulos, ubicaciones, proyectos, proveedores] = await Promise.all([
    prisma.articulo.findMany({ where: { activo: true }, select: { id: true, nombre: true, marca: true, numeroParte: true } }),
    prisma.ubicacion.findMany({
      where: { activa: true },
      include: { niveles: { where: { activo: true }, orderBy: { numero: 'asc' } } },
    }),
    prisma.proyecto.findMany({ where: { estado: 'ACTIVO' }, select: { id: true, nombre: true } }),
    prisma.proveedor.findMany({ where: { activo: true }, select: { id: true, nombre: true } }),
  ])

  const articuloMap = new Map(articulos.map(a => [a.nombre.toLowerCase(), a]))
  const articuloByNumeroParte = new Map(articulos.filter(a => a.numeroParte).map(a => [a.numeroParte!.toLowerCase(), a]))
  const ubicacionMap = new Map(ubicaciones.map(u => [u.nombre.toLowerCase(), u]))
  const proyectoMap = new Map(proyectos.map(p => [p.nombre.toLowerCase(), p]))
  const proveedorMap = new Map(proveedores.map(p => [p.nombre.toLowerCase(), p]))

  const results: CSVRowValidated[] = []

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx]
    const rowNumber = idx + 2
    const errors: string[] = []
    const warnings: string[] = []
    const resolvedData: CSVRowValidated['resolvedData'] = {}

    // Validar artículo
    const artNombre = row['articulo_nombre'] ?? ''
    const artMarca = row['marca'] ?? ''
    const artNumeroParte = row['numero_parte'] ?? ''
    const cantidadStr = row['cantidad'] ?? ''

    if (!artNombre && !artNumeroParte) {
      errors.push('articulo_nombre or numero_parte is required')
    } else {
      let articulo = artNumeroParte
        ? articuloByNumeroParte.get(artNumeroParte.toLowerCase())
        : undefined
      if (!articulo && artNombre) {
        articulo = articuloMap.get(artNombre.toLowerCase())
      }
      if (articulo) {
        resolvedData.articuloId = articulo.id
        if (artMarca && articulo.marca && articulo.marca.toLowerCase() !== artMarca.toLowerCase()) {
          warnings.push(`Brand "${artMarca}" does not match registered ("${articulo.marca}")`)
        }
      }
    }

    const cantidad = parseFloat(cantidadStr)
    if (!cantidadStr || isNaN(cantidad) || cantidad <= 0) {
      errors.push('quantity must be a positive number')
    } else {
      resolvedData.cantidad = cantidad
    }

    if (tipo === 'entrada') {
      const ubNombre = row['ubicacion'] ?? ''
      const nivNombre = row['nivel'] ?? ''

      if (!ubNombre) {
        warnings.push('No location specified')
      } else {
        const ub = ubicacionMap.get(ubNombre.toLowerCase())
        if (!ub) {
            errors.push(`Location "${ubNombre}" does not exist`)
        } else {
          resolvedData.ubicacionId = ub.id
          if (nivNombre) {
            const nivel = ub.niveles.find(n => n.nombre.toLowerCase() === nivNombre.toLowerCase())
            if (!nivel) {
              errors.push(`Level "${nivNombre}" does not exist in location "${ubNombre}"`)
            } else {
              resolvedData.nivelId = nivel.id
            }
          } else {
            warnings.push('No level specified')
          }
        }
      }

      const proveedorNombre = row['proveedor_nombre'] ?? ''
      if (proveedorNombre) {
        const prov = proveedorMap.get(proveedorNombre.toLowerCase())
        if (prov) {
          resolvedData.proveedorId = prov.id
        } else {
          warnings.push(`Supplier "${proveedorNombre}" not registered — will be created on processing`)
        }
      }

    }

    if (tipo === 'salida' || tipo === 'apartado') {
      const proyNombre = row['proyecto_nombre'] ?? ''
      if (proyNombre) {
        const proyecto = proyectoMap.get(proyNombre.toLowerCase())
        if (!proyecto) {
          errors.push(`Project "${proyNombre}" does not exist or is not active`)
        } else {
          resolvedData.proyectoId = proyecto.id
        }
      }

      if (tipo === 'salida' && resolvedData.articuloId && resolvedData.cantidad) {
        const stock = await prisma.articuloNivel.aggregate({
          where: { articuloId: resolvedData.articuloId },
          _sum: { cantidad: true },
        })
        const stockDisponible = stock._sum.cantidad ?? 0
        if (stockDisponible < resolvedData.cantidad) {
          errors.push(`Insufficient stock: available ${stockDisponible}, requested ${resolvedData.cantidad}`)
        }
      }
    }

    // Sugerencia de ubicación para entradas
    let ubicacionSugerida: CSVRowValidated['ubicacionSugerida']
    if (tipo === 'entrada' && resolvedData.articuloId) {
      const existente = await prisma.articuloNivel.findFirst({
        where: { articuloId: resolvedData.articuloId, cantidad: { gt: 0 } },
        orderBy: { cantidad: 'desc' },
        include: { nivel: { include: { ubicacion: true } } },
      })
      if (existente && existente.nivelId !== resolvedData.nivelId) {
        ubicacionSugerida = {
          nivelId: existente.nivelId,
          ubicacionNombre: existente.nivel.ubicacion.nombre,
          nivelNombre: existente.nivel.nombre,
          cantidadExistente: existente.cantidad,
          motivo: 'mismo_articulo_existente',
        }
      }
    }

    const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid'
    results.push({ rowNumber, originalData: row, status, errors, warnings, resolvedData, ubicacionSugerida })
  }

  return results
}
