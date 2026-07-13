'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { Plus, Upload } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CSVUploader } from '@/components/csv/CSVUploader'

interface SalidaItem {
  id: string
  cantidad: number
  precioUnitario?: number | null
  costoTotal?: number | null
  loteEntrada: { articulo: { nombre: string; unidad: string } }
}

interface Salida {
  id: string
  fecha: string
  costoTotal?: number | null
  usuario: { nombre: string }
  proyecto?: { nombre: string } | null
  items: SalidaItem[]
}

interface SalidaDetalle extends Salida {
  notas?: string | null
}

export default function SalidasPage() {
  const [salidas, setSalidas] = useState<Salida[]>([])
  const [loading, setLoading] = useState(true)
  const [csvOpen, setCsvOpen] = useState(false)
  const [detalle, setDetalle] = useState<SalidaDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const fetch_ = useCallback(async () => {
    const res = await fetch('/api/salidas?limit=50')
    if (res.ok) {
      const data = await res.json()
      setSalidas(data.salidas)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function abrirDetalle(id: string) {
    setLoadingDetalle(true)
    setDetalle({ id, fecha: '', items: [], usuario: { nombre: '' } })
    const res = await fetch(`/api/salidas/${id}`)
    if (res.ok) {
      const data = await res.json()
      setDetalle(data)
    }
    setLoadingDetalle(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Exit Log</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
            <Upload size={14} /> Upload CSV
          </Button>
          <Link href="/salidas/nueva">
            <Button size="sm"><Plus size={14} /> New Exit</Button>
          </Link>
        </div>
      </div>

      {csvOpen && (
        <CSVUploader tipo="salida" onProcesado={fetch_} onClose={() => setCsvOpen(false)} />
      )}

      {loading ? <SkeletonTable /> : (
        <div className="card-industrial overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Project', 'Total Items', 'Total Pieces', 'USD Value', 'Status'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {salidas.map((s, i) => {
                const totalItems = s.items.length
                const totalPiezas = s.items.reduce((sum, it) => sum + it.cantidad, 0)
                const costoPendiente = s.costoTotal == null

                return (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                    onClick={() => abrirDetalle(s.id)}
                  >
                    <td className="px-3 py-3 font-mono-data text-xs">{formatDate(s.fecha)}</td>
                    <td className="px-3 py-3 text-xs" style={{ color: s.proyecto ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {s.proyecto?.nombre ?? '—'}
                    </td>
                    <td className="px-3 py-3 font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {totalItems}
                    </td>
                    <td className="px-3 py-3 font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {totalPiezas.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-mono-data font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {s.costoTotal != null ? formatCurrency(s.costoTotal) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {costoPendiente ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : (
                        <Badge variant="success">Complete</Badge>
                      )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {salidas.length === 0 && (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              No exits registered
            </p>
          )}
        </div>
      )}

      {/* Exit detail modal */}
      <Modal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        title={detalle ? `Exit #${detalle.id.slice(-6).toUpperCase()}` : ''}
        size="md"
      >
        {loadingDetalle || !detalle ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Date</p>
                <p className="font-mono-data">{formatDateTime(detalle.fecha)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Operator</p>
                <p>{detalle.usuario.nombre}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Project</p>
                <p>{detalle.proyecto?.nombre ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Total Cost</p>
                {detalle.costoTotal != null
                  ? <p className="font-mono-data font-bold" style={{ color: 'var(--accent-primary)' }}>{formatCurrency(detalle.costoTotal)}</p>
                  : <Badge variant="warning">Price pending</Badge>
                }
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Items</p>
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                      {['Item', 'Qty', 'Unit Price', 'Cost'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-wider font-medium"
                          style={{ color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.items.map((item, i) => (
                      <tr key={item.id} style={{ borderBottom: i < detalle.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td className="px-3 py-2.5 font-medium">{item.loteEntrada.articulo.nombre}</td>
                        <td className="px-3 py-2.5 font-mono-data text-xs">
                          {item.cantidad} {item.loteEntrada.articulo.unidad}
                        </td>
                        <td className="px-3 py-2.5 font-mono-data text-xs">
                          {item.precioUnitario != null ? formatCurrency(item.precioUnitario) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td className="px-3 py-2.5 font-mono-data text-xs" style={{ color: 'var(--accent-primary)' }}>
                          {item.costoTotal != null ? formatCurrency(item.costoTotal) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detalle.notas && (
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Notes</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{detalle.notas}</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button variant="ghost" onClick={() => setDetalle(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
