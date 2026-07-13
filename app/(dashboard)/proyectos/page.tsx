'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Plus, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Proyecto {
  id: string
  nombre: string
  descripcion?: string | null
  responsable?: string | null
  estado: string
  _count: { salidas: number; apartados: number }
}

const estadoBadge: Record<string, 'success' | 'warning' | 'default'> = {
  ACTIVO: 'success', PAUSADO: 'warning', CERRADO: 'default',
}

export default function ProyectosPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [responsable, setResponsable] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchProyectos = useCallback(async () => {
    const res = await fetch('/api/proyectos')
    if (res.ok) setProyectos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchProyectos() }, [fetchProyectos])

  async function crearProyecto() {
    if (!nombre.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const res = await fetch('/api/proyectos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, descripcion, responsable }),
    })
    if (res.ok) {
      toast.success('Project created')
      setShowForm(false)
      setNombre(''); setDescripcion(''); setResponsable('')
      fetchProyectos()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Projects</h2>
        {rol === 'ADMIN' && (
          <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> New Project</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {proyectos.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="card-industrial p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} style={{ color: 'var(--accent-purple)' }} />
                <span className="font-display font-semibold">{p.nombre}</span>
              </div>
              <Badge variant={estadoBadge[p.estado] ?? 'default'}>{p.estado}</Badge>
            </div>
            {p.descripcion && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{p.descripcion}</p>
            )}
            {p.responsable && (
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Responsible: {p.responsable}</p>
            )}
            <div className="flex gap-3 text-xs mb-3">
              <span style={{ color: 'var(--text-muted)' }}>{p._count.salidas} exits</span>
              <span style={{ color: 'var(--text-muted)' }}>{p._count.apartados} reserves</span>
            </div>
            <Link href={`/proyectos/${p.id}`}>
              <Button variant="ghost" size="sm">View Details</Button>
            </Link>
          </motion.div>
        ))}
      </div>

      {proyectos.length === 0 && (
        <p className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>No projects</p>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Project" size="sm">
        <div className="space-y-4">
          <Input label="Name *" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input label="Description" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <Input label="Responsible" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={crearProyecto} loading={saving}>Create Project</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
