'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { CSVUploader } from '@/components/csv/CSVUploader'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus, AlertCircle, Upload } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Entrada {
  id: string
  fecha: string
  usuario: { nombre: string }
  proyecto?: { nombre: string } | null
  lotes: Array<{
    id: string
    articuloId: string
    cantidadOriginal: number
    precioPendiente: boolean
    precioUnitario?: number | null
    articulo: { nombre: string }
  }>
}

export default function EntradasPage() {
  const router = useRouter()
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)
  const [csvOpen, setCsvOpen] = useState(false)

  const fetchEntradas = useCallback(async () => {
    const res = await fetch('/api/entradas?limit=50')
    if (res.ok) {
      const data = await res.json()
      setEntradas(data.entradas)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchEntradas() }, [fetchEntradas])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Entry Log</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
            <Upload size={14} /> Upload CSV
          </Button>
          <Link href="/entradas/nueva">
            <Button size="sm"><Plus size={14} /> New Entry</Button>
          </Link>
        </div>
      </div>

      {csvOpen && (
        <CSVUploader tipo="entrada" onProcesado={fetchEntradas} onClose={() => setCsvOpen(false)} />
      )}

      {loading ? (
        <SkeletonTable />
      ) : (
        <div className="card-industrial overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Project', 'Total Items', 'Total Pieces', 'USD Value', 'Without Price', 'Status'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entradas.map((e, i) => {
                const sinPrecio = e.lotes.some((l) => l.precioPendiente)
                const cantidadSinPrecio = e.lotes.filter((l) => l.precioPendiente).length
                const totalItems = e.lotes.length
                const totalPiezas = e.lotes.reduce((sum, l) => sum + l.cantidadOriginal, 0)
                const valorUSD = e.lotes
                  .filter((l) => !l.precioPendiente && l.precioUnitario)
                  .reduce((sum, l) => sum + (l.cantidadOriginal * (l.precioUnitario ?? 0)), 0)

                return (
                  <motion.tr
                    key={e.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                    onClick={() => router.push(`/entradas/${e.id}`)}
                  >
                    <td className="px-3 py-3 font-mono-data text-xs">{formatDate(e.fecha)}</td>
                    <td className="px-3 py-3 text-xs" style={{ color: e.proyecto ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {e.proyecto?.nombre ?? '—'}
                    </td>
                    <td className="px-3 py-3 font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {totalItems}
                    </td>
                    <td className="px-3 py-3 font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {totalPiezas.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 font-mono-data font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {formatCurrency(valorUSD)}
                    </td>
                    <td className="px-3 py-3 font-mono-data text-xs" style={{ color: cantidadSinPrecio > 0 ? 'var(--accent-warning)' : 'var(--text-secondary)' }}>
                      {cantidadSinPrecio > 0 ? (
                        <span>{cantidadSinPrecio}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {sinPrecio ? (
                        <Badge variant="warning">
                          <AlertCircle size={10} className="mr-1" />No price
                        </Badge>
                      ) : (
                        <Badge variant="success">Priced</Badge>
                      )}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          {entradas.length === 0 && (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              No entries registered
            </p>
          )}
        </div>
      )}
    </div>
  )
}
