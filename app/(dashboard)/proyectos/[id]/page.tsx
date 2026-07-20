'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FolderOpen, DollarSign } from 'lucide-react'

interface Proyecto {
  id: string
  nombre: string
  descripcion?: string | null
  responsable?: string | null
  estado: string
  costoTotal: number
  salidas: Array<{
    id: string
    fecha: string
    costoTotal?: number | null
    usuario: { nombre: string }
    items: Array<{ loteEntrada: { articulo: { nombre: string } }; cantidad: number }>
  }>
}

export default function ProyectoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/proyectos/${id}`)
      .then((r) => r.json())
      .then((d) => { setProyecto(d); setLoading(false) })
  }, [id])

  if (loading) return <SkeletonCard />
  if (!proyecto) return <p style={{ color: 'var(--text-muted)' }}>Project not found</p>

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="card-industrial p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FolderOpen size={24} style={{ color: 'var(--accent-purple)' }} />
            <div>
              <h2 className="font-display text-2xl font-bold">{proyecto.nombre}</h2>
              {proyecto.responsable && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Manager: {proyecto.responsable}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total FIFO cost</p>
            <p className="font-mono-data text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
              {formatCurrency(proyecto.costoTotal)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-sm uppercase tracking-widest mb-3"
          style={{ color: 'var(--text-muted)' }}>
          Exit history ({proyecto.salidas.length})
        </h3>
        <div className="card-industrial overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Items', 'FIFO Cost', 'User'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proyecto.salidas.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-4 py-3 font-mono-data text-xs">{formatDate(s.fecha)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {s.items.slice(0, 2).map((it, j) => (
                      <span key={j} className="block">{it.cantidad}× {it.loteEntrada.articulo.nombre}</span>
                    ))}
                    {s.items.length > 2 && <span style={{ color: 'var(--text-muted)' }}>+{s.items.length - 2}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono-data font-bold" style={{ color: 'var(--accent-primary)' }}>
                    {s.costoTotal != null ? formatCurrency(s.costoTotal) : '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{s.usuario.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
