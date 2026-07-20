'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { ArrowDownToLine, ArrowLeftRight, Package } from 'lucide-react'
import { motion } from 'framer-motion'

interface Articulo {
  id: string
  nombre: string
  marca?: string | null
  numeroParte?: string | null
  unidad: string
  descripcion?: string | null
  stockMinimo?: number | null
  apartadoReservado: number
  lotesEntrada: Array<{
    id: string
    cantidadOriginal: number
    cantidadDisponible: number
    precioUnitario?: number | null
    precioPendiente: boolean
    createdAt: string
    entrada: {
      fecha: string
      usuario: { nombre: string }
    }
  }>
  movimientos: Array<{
    id: string
    cantidadMovida: number
    notas?: string | null
    createdAt: string
    nivelOrigen: { nombre: string; ubicacion: { nombre: string } }
    nivelDestino: { nombre: string; ubicacion: { nombre: string } }
    usuario: { nombre: string }
  }>
}

export default function ArticuloDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [articulo, setArticulo] = useState<Articulo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/articulos/${id}`)
      .then((r) => r.json())
      .then((d) => { setArticulo(d); setLoading(false) })
  }, [id])

  if (loading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
  if (!articulo) return <p style={{ color: 'var(--text-muted)' }}>Item not found</p>

  const stockTotal = articulo.lotesEntrada.reduce((s, l) => s + l.cantidadDisponible, 0)
  const reservado = articulo.apartadoReservado ?? 0
  const stockDisponible = Math.max(0, stockTotal - reservado)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="card-industrial p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)' }}>
            <Package size={28} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">{articulo.nombre}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {articulo.marca && <Badge variant="default">{articulo.marca}</Badge>}
              {articulo.numeroParte && (
                <Badge variant="cyan">
                  <span className="font-mono-data">{articulo.numeroParte}</span>
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Available stock</p>
            <p className="font-mono-data text-3xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {stockDisponible}
            </p>
            {reservado > 0 && (
              <p className="text-xs" style={{ color: 'var(--accent-warning)' }}>
                {reservado} reserved · {stockTotal} total
              </p>
            )}
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{articulo.unidad}</p>
          </div>
        </div>
      </div>

      {/* Lotes FIFO */}
      <div>
        <h3 className="font-display font-semibold text-sm uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-muted)' }}>
          FIFO Lots (oldest → newest)
        </h3>
        <div className="space-y-2">
          {articulo.lotesEntrada.map((lote, i) => (
            <motion.div
              key={lote.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-industrial p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownToLine size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span className="text-sm font-medium">
                      {formatDateTime(lote.entrada.fecha)}
                    </span>
                    <Badge variant={lote.precioPendiente ? 'warning' : 'success'}>
                      {lote.precioPendiente ? 'Sin precio' : formatCurrency(lote.precioUnitario)}
                    </Badge>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    By {lote.entrada.usuario.nombre}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono-data text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
                    {lote.cantidadDisponible}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    / {lote.cantidadOriginal} original
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Historial de movimientos */}
      {articulo.movimientos?.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-sm uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}>
            Movement history
          </h3>
          <div className="space-y-2">
            {articulo.movimientos.map((mov, i) => (
              <motion.div
                key={mov.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-industrial p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowLeftRight size={14} style={{ color: 'var(--accent-primary)' }} />
                      <span className="text-sm font-medium">{formatDate(mov.createdAt)}</span>
                    </div>
                    <p className="text-xs font-mono-data" style={{ color: 'var(--accent-primary)' }}>
                      {mov.nivelOrigen.ubicacion.nombre}-{mov.nivelOrigen.nombre}
                      {' → '}
                      {mov.nivelDestino.ubicacion.nombre}-{mov.nivelDestino.nombre}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      By {mov.usuario.nombre}{mov.notas && ` · ${mov.notas}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-data text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {mov.cantidadMovida}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{articulo.unidad}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
