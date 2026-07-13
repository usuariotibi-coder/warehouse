'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, MapPin, ChevronDown, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ArticuloNivel {
  cantidad: number
  articulo: { id: string; nombre: string }
}

interface Nivel {
  id: string
  nombre: string
  numero: number
  articuloNiveles: ArticuloNivel[]
}

interface Ubicacion {
  id: string
  nombre: string
  descripcion?: string | null
  nivelesCount: number
  niveles: Nivel[]
  totalArticulos: number
  totalStock: number
}

export default function UbicacionesPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const canEdit = rol === 'ADMIN' || rol === 'ALMACENISTA'

  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Ubicacion | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', nivelesCount: 1 })

  const fetchUbicaciones = useCallback(async () => {
    const res = await fetch('/api/ubicaciones')
    if (res.ok) setUbicaciones(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchUbicaciones() }, [fetchUbicaciones])

  function toggleExpand(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openCreate() {
    setEditando(null)
    setForm({ nombre: '', descripcion: '', nivelesCount: 1 })
    setModalOpen(true)
  }

  function openEdit(u: Ubicacion) {
    setEditando(u)
    setForm({ nombre: u.nombre, descripcion: u.descripcion ?? '', nivelesCount: u.nivelesCount })
    setModalOpen(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const url = editando ? `/api/ubicaciones/${editando.id}` : '/api/ubicaciones'
    const method = editando ? 'PUT' : 'POST'
    const body = editando
      ? { nombre: form.nombre.trim(), descripcion: form.descripcion || undefined }
      : { nombre: form.nombre.trim(), descripcion: form.descripcion || undefined, nivelesCount: form.nivelesCount }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast.success(editando ? 'Location updated' : 'Location created')
      setModalOpen(false)
      setEditando(null)
      fetchUbicaciones()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSaving(false)
  }

  async function eliminar() {
    if (!confirmId) return
    const res = await fetch(`/api/ubicaciones/${confirmId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Location deleted')
      setConfirmId(null)
      fetchUbicaciones()
    } else {
      const err = await res.json()
      toast.error(err.message)
      setConfirmId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Locations</h2>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} /> New Location
          </Button>
        )}
      </div>

      {loading ? <SkeletonTable /> : (
        <div className="card-industrial overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Location', 'Levels', 'Total Items', 'Total Stock', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ubicaciones.map((u) => (
                <>
                  {/* Main row */}
                  <tr
                    key={u.id}
                    className="cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ borderBottom: expandidos.has(u.id) ? 'none' : '1px solid var(--border)' }}
                    onClick={() => toggleExpand(u.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {expandidos.has(u.id)
                          ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                          : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                        <MapPin size={14} style={{ color: 'var(--accent-cyan)' }} />
                        <span className="font-medium font-display">{u.nombre}</span>
                        {u.descripcion && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.descripcion}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {u.niveles.length}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.totalArticulos}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm" style={{ color: u.totalStock > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                        {u.totalStock.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                            <Pencil size={12} />
                          </Button>
                          {rol === 'ADMIN' && (
                            <Button variant="ghost" size="sm" onClick={() => setConfirmId(u.id)}>
                              <Trash2 size={12} style={{ color: 'var(--accent-danger)' }} />
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Levels sub-rows (accordion) */}
                  <AnimatePresence>
                    {expandidos.has(u.id) && (
                      <tr key={`${u.id}-niveles`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={5} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden', background: 'var(--bg-secondary)' }}
                          >
                            <table className="w-full text-sm">
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                  <th className="pl-14 pr-4 py-2 text-left text-xs tracking-wider font-medium"
                                    style={{ color: 'var(--text-muted)' }}>Level</th>
                                  <th className="px-4 py-2 text-left text-xs tracking-wider font-medium"
                                    style={{ color: 'var(--text-muted)' }}>Items</th>
                                  <th className="px-4 py-2 text-left text-xs tracking-wider font-medium"
                                    style={{ color: 'var(--text-muted)' }}>Stock</th>
                                </tr>
                              </thead>
                              <tbody>
                                {u.niveles.map((n) => {
                                  const arts = n.articuloNiveles.filter(an => an.cantidad > 0).length
                                  const stock = n.articuloNiveles.reduce((s, an) => s + an.cantidad, 0)
                                  const tieneStock = stock > 0
                                  return (
                                    <tr key={n.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                      <td className="pl-14 pr-4 py-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full"
                                            style={{ background: tieneStock ? 'var(--accent-success, #00e676)' : 'var(--accent-danger)' }} />
                                          <span className="font-mono text-xs">{u.nombre}-{n.nombre}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{arts}</td>
                                      <td className="px-4 py-2 font-mono text-xs" style={{ color: tieneStock ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                                        {stock.toLocaleString()}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>
          {ubicaciones.length === 0 && (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              No locations registered
            </p>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Edit Location' : 'New Location'} size="sm">
        <div className="space-y-4">
          <Input label="Name *" value={form.nombre}
            onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder="E.g. A1, Warehouse-3" />
          <Input label="Description" value={form.descripcion}
            onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          {!editando && (
            <Input
              label="Number of Levels"
              type="number"
              value={form.nivelesCount}
              onChange={(e) => setForm(f => ({ ...f, nivelesCount: Math.min(20, Math.max(1, Number(e.target.value))) }))}
            />
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={guardar} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={eliminar}
        title="Delete Location"
        message="Are you sure? Cannot delete if it has items in its levels."
        confirmLabel="Delete" variant="danger"
      />
    </div>
  )
}
