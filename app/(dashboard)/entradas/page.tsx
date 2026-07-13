'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { CSVUploader } from '@/components/csv/CSVUploader'
import { formatDate } from '@/lib/utils'
import { Plus, AlertCircle, Upload } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
    articulo: { nombre: string }
  }>
}

export default function EntradasPage() {
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
                {['Date', 'Project', 'Items', 'Operator', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entradas.map((e, i) => {
                const sinPrecio = e.lotes.some((l) => l.precioPendiente)
                return (
                  <motion.tr
                    key={e.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono-data text-xs">{formatDate(e.fecha)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: e.proyecto ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {e.proyecto?.nombre ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {e.lotes.slice(0, 2).map((l) => (
                          <p key={l.id} className="text-xs truncate max-w-40">
                            {l.cantidadOriginal}× {l.articulo.nombre}
                          </p>
                        ))}
                        {e.lotes.length > 2 && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>+{e.lotes.length - 2} more</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {e.usuario.nombre}
                    </td>
                    <td className="px-4 py-3">
                      {sinPrecio ? (
                        <Badge variant="warning">
                          <AlertCircle size={10} className="mr-1" />No price
                        </Badge>
                      ) : (
                        <Badge variant="success">Priced</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/entradas/${e.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
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
