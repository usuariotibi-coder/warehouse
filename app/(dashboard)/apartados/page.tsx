'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Plus, Trash2, AlertTriangle, Clock, Upload, History, CheckCircle2, XCircle, Timer, Info } from 'lucide-react'
import { CSVUploader } from '@/components/csv/CSVUploader'
import { addDays, differenceInDays, isPast } from 'date-fns'
import { motion } from 'framer-motion'

interface Apartado {
  id: string
  estado: string
  fechaExpira: string
  updatedAt: string
  createdAt: string
  notas?: string | null
  costoEstimado?: number | null
  usuario: { id: string; nombre: string }
  proyecto?: { nombre: string } | null
  items: Array<{ articulo: { nombre: string; unidad: string }; cantidad: number }>
}

const estadoBadge: Record<string, { label: string; variant: 'success' | 'danger' | 'default'; icon: React.ReactNode }> = {
  CONVERTIDO_SALIDA: { label: 'Converted to exit', variant: 'success', icon: <CheckCircle2 size={11} /> },
  CANCELADO:         { label: 'Cancelled',         variant: 'default', icon: <XCircle size={11} /> },
  VENCIDO:           { label: 'Expired',           variant: 'danger',  icon: <Timer size={11} /> },
}

export default function ApartadosPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const userId = (session?.user as any)?.id
  const [tab, setTab] = useState<'activos' | 'historial'>('activos')
  const [apartados, setApartados] = useState<Apartado[]>([])
  const [historial, setHistorial] = useState<Apartado[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingHist, setLoadingHist] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [articulos, setArticulos] = useState<any[]>([])
  const [proyectos, setProyectos] = useState<any[]>([])
  const [formItems, setFormItems] = useState([{ articuloId: '', cantidad: 1 }])
  const [proyectoId, setProyectoId] = useState('')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchApartados = useCallback(async () => {
    const res = await fetch('/api/apartados?estado=ACTIVO')
    if (res.ok) {
      const data = await res.json()
      setApartados(data.apartados)
    }
    setLoading(false)
  }, [])

  const fetchHistorial = useCallback(async () => {
    setLoadingHist(true)
    const res = await fetch('/api/apartados?estado=historial&limit=50')
    if (res.ok) {
      const data = await res.json()
      setHistorial(data.apartados)
    }
    setLoadingHist(false)
  }, [])

  useEffect(() => {
    fetchApartados()
    Promise.all([
      fetch('/api/articulos?limit=200').then((r) => r.json()),
      fetch('/api/proyectos').then((r) => r.json()),
    ]).then(([a, p]) => {
      setArticulos(a.articulos ?? [])
      setProyectos(p.filter((pr: any) => pr.estado === 'ACTIVO'))
    })
  }, [fetchApartados])

  useEffect(() => {
    if (tab === 'historial' && historial.length === 0) fetchHistorial()
  }, [tab, historial.length, fetchHistorial])

  async function crearApartado() {
    if (formItems.some((i) => !i.articuloId || i.cantidad < 1)) {
      toast.error('Complete all items')
      return
    }
    setSaving(true)
    const res = await fetch('/api/apartados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectoId: proyectoId || undefined, notas, items: formItems }),
    })
    if (res.ok) {
      toast.success('Reserve created')
      setShowForm(false)
      setFormItems([{ articuloId: '', cantidad: 1 }])
      setProyectoId('')
      setNotas('')
      fetchApartados()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSaving(false)
  }

  async function cancelarApartado(id: string) {
    const res = await fetch(`/api/apartados/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Reserve cancelled')
      fetchApartados()
      if (tab === 'historial') fetchHistorial()
    }
  }

  async function convertirASalida(id: string) {
    const res = await fetch(`/api/apartados/${id}/convertir`, { method: 'POST' })
    if (res.ok) {
      toast.success('Reserve converted to exit')
      fetchApartados()
      if (tab === 'historial') fetchHistorial()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
  }

  const vencimientoLabel = (fecha: string) => {
    const dias = differenceInDays(new Date(fecha), new Date())
    if (isPast(new Date(fecha))) return { text: 'Expired', color: 'var(--accent-danger)' }
    if (dias <= 1) return { text: `Expires in ${dias}d`, color: 'var(--accent-warning)' }
    return { text: `${dias} days`, color: 'var(--text-muted)' }
  }

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <button
            onClick={() => setTab('activos')}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              background: tab === 'activos' ? 'var(--accent-primary)' : 'transparent',
              color: tab === 'activos' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            Active {apartados.length > 0 && `(${apartados.length})`}
          </button>
          <button
            onClick={() => setTab('historial')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              background: tab === 'historial' ? 'var(--bg-tertiary)' : 'transparent',
              color: tab === 'historial' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            <History size={13} /> History
          </button>
        </div>
        {tab === 'activos' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}>
              <Upload size={14} /> Upload CSV
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> New Reserve</Button>
          </div>
        )}
        {csvOpen && (
          <CSVUploader tipo="apartado" onProcesado={fetchApartados} onClose={() => setCsvOpen(false)} />
        )}
      </div>

      {/* ACTIVOS */}
      {tab === 'activos' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {apartados.map((a, i) => {
              const vc = vencimientoLabel(a.fechaExpira)
              const canEdit = rol === 'ADMIN' || a.usuario.id === userId
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }} className="card-industrial p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">{a.usuario.nombre}</p>
                      {a.proyecto && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.proyecto.nombre}</p>}
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Created {formatDate(a.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} style={{ color: vc.color }} />
                      <span className="text-xs" style={{ color: vc.color }}>{vc.text}</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    {a.items.map((item, j) => (
                      <div key={j} className="flex justify-between text-xs p-2 rounded"
                        style={{ background: 'var(--bg-tertiary)' }}>
                        <span>{item.articulo.nombre}</span>
                        <span className="font-mono-data" style={{ color: 'var(--accent-purple)' }}>
                          {item.cantidad} {item.articulo.unidad}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', border: '1px solid var(--accent-primary)' }}>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Reserve Value</span>
                      <span className="text-sm font-mono-data font-bold" style={{ color: 'var(--accent-primary)' }}>
                        {a.costoEstimado != null ? formatCurrency(a.costoEstimado) : '—'}
                      </span>
                    </div>
                    <div className="flex gap-2 items-start p-2 rounded-lg text-xs"
                      style={{ background: 'color-mix(in srgb, var(--accent-warning) 6%, transparent)', borderLeft: '2px solid var(--accent-warning)' }}>
                      <Info size={13} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Expected value using current available inventory. Actual cost may vary based on stock availability at exit time.
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex gap-2">
                      {rol !== 'USUARIO' && (
                        <Button variant="secondary" size="sm" onClick={() => convertirASalida(a.id)}>
                          Convert to exit
                        </Button>
                      )}
                      <Button variant="danger" size="sm" onClick={() => cancelarApartado(a.id)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
          {apartados.length === 0 && (
            <p className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
              No active reserves
            </p>
          )}
        </>
      )}

      {/* HISTORIAL */}
      {tab === 'historial' && (
        <>
          {loadingHist ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : historial.length === 0 ? (
            <p className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
              No history records
            </p>
          ) : (
            <div className="card-industrial overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Created', 'Project', 'Total Items', 'Total Pieces', 'User', 'Result'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs uppercase tracking-wider font-medium"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historial.map((a, i) => {
                    const info = estadoBadge[a.estado]
                    const totalItems = a.items.length
                    const totalPiezas = a.items.reduce((sum, it) => sum + it.cantidad, 0)

                    return (
                      <motion.tr key={a.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        style={{ borderBottom: '1px solid var(--border)' }}
                        className="hover:bg-[var(--bg-tertiary)] transition-colors"
                      >
                        <td className="px-3 py-3 font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(a.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-xs" style={{ color: a.proyecto ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {a.proyecto?.nombre ?? '—'}
                        </td>
                        <td className="px-3 py-3 font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {totalItems}
                        </td>
                        <td className="px-3 py-3 font-mono-data text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {totalPiezas.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {a.usuario.nombre}
                        </td>
                        <td className="px-3 py-3">
                          {info && (
                            <Badge variant={info.variant}>
                              <span className="flex items-center gap-1">{info.icon} {info.label}</span>
                            </Badge>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal New Reserve */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Reserve" size="lg">
        <div className="space-y-4">
          {/* Expiration notice */}
          <div className="p-4 rounded-lg border" style={{ background: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)', borderColor: 'var(--accent-warning)' }}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--accent-warning)' }}>
                  Important Notice
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Reserved items are held for <strong>7 calendar days</strong> from today
                  ({formatDate(addDays(new Date(), 7))}). After that date, the reserve will be marked as expired
                  and items will become available automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Project (optional)
              </label>
              <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md text-sm outline-none border"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                <option value="">No project</option>
                {proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <Input label="Notes (optional)" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Items</label>
              <Button variant="ghost" size="sm" onClick={() => setFormItems((f) => [...f, { articuloId: '', cantidad: 1 }])}>
                <Plus size={12} /> Add
              </Button>
            </div>
            {/* Header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-1 pb-0.5">
              <div className="col-span-9 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Item</div>
              <div className="col-span-2 text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Quantity</div>
            </div>
            {formItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 items-center p-2 rounded-lg"
                style={{ background: 'var(--bg-tertiary)' }}>
                <div className="col-span-12 sm:col-span-9">
                  <label className="sm:hidden block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Item</label>
                  <select value={item.articuloId}
                    onChange={(e) => setFormItems((f) => f.map((fi, idx) => idx === i ? { ...fi, articuloId: e.target.value } : fi))}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none border"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    <option value="">Select item...</option>
                    {articulos.map((a: any) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div className="col-span-10 sm:col-span-2">
                  <label className="sm:hidden block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Quantity</label>
                  <input type="number" min={0.001} step="any" value={item.cantidad}
                    onChange={(e) => setFormItems((f) => f.map((fi, idx) => idx === i ? { ...fi, cantidad: parseFloat(e.target.value) || 1 } : fi))}
                    className="w-full px-3 py-2 rounded-md text-sm outline-none border text-center font-mono-data"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-center">
                  {formItems.length > 1 && (
                    <button onClick={() => setFormItems((f) => f.filter((_, idx) => idx !== i))}
                      className="p-1.5 rounded hover:bg-red-500/20 transition-colors">
                      <Trash2 size={14} style={{ color: 'var(--accent-danger)' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={crearApartado} loading={saving}>Create Reserve</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
