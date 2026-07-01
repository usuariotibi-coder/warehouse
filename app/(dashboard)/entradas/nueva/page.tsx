'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

interface Articulo { id: string; nombre: string; unidad: string }
interface Nivel { id: string; nombre: string; numero: number }
interface Ubicacion { id: string; nombre: string; niveles: Nivel[] }
interface Proyecto { id: string; nombre: string }

interface LoteItem {
  articuloId: string
  ubicacionId: string
  nivelId: string
  cantidadOriginal: number
}

const selectStyle = {
  background: 'var(--bg-secondary)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
} as const

export default function NuevaEntradaPage() {
  const router = useRouter()
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [proyectoId, setProyectoId] = useState('')
  const [lotes, setLotes] = useState<LoteItem[]>([{ articuloId: '', ubicacionId: '', nivelId: '', cantidadOriginal: 1 }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/articulos?limit=200').then((r) => r.json()),
      fetch('/api/ubicaciones').then((r) => r.json()),
      fetch('/api/proyectos').then((r) => r.json()),
    ]).then(([a, u, p]) => {
      setArticulos(a.articulos ?? [])
      setUbicaciones(u)
      setProyectos(Array.isArray(p) ? p : [])
    })
  }, [])

  function nivelesDeUbicacion(ubicacionId: string): Nivel[] {
    return ubicaciones.find(u => u.id === ubicacionId)?.niveles ?? []
  }

  function addLote() {
    setLotes(l => [...l, { articuloId: '', ubicacionId: '', nivelId: '', cantidadOriginal: 1 }])
  }

  function removeLote(i: number) {
    setLotes(l => l.filter((_, idx) => idx !== i))
  }

  function updateLote(i: number, field: keyof LoteItem, value: string | number) {
    setLotes(l => l.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: value }
      if (field === 'ubicacionId') updated.nivelId = ''
      return updated
    }))
  }

  async function submit() {
    if (lotes.some(l => !l.articuloId || l.cantidadOriginal < 1)) {
      toast.error('Completa todos los artículos y cantidades')
      return
    }
    setSaving(true)
    const payload = {
      proyectoId: proyectoId || undefined,
      lotes: lotes.map(l => ({
        articuloId: l.articuloId,
        ubicacionId: l.ubicacionId || undefined,
        nivelId: l.nivelId || undefined,
        cantidadOriginal: l.cantidadOriginal,
      })),
    }
    const res = await fetch('/api/entradas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success('Entrada registrada correctamente')
      router.push(`/entradas/${data.id}`)
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Proyecto */}
      <div className="card-industrial p-5 space-y-4">
        <h2 className="font-display text-lg font-semibold">Datos generales</h2>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Proyecto
          </label>
          <select
            value={proyectoId}
            onChange={(e) => setProyectoId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md text-sm outline-none border"
            style={selectStyle}
          >
            <option value="">Sin proyecto</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Artículos */}
      <div className="card-industrial p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Artículos</h2>
          <Button variant="outline" size="sm" onClick={addLote}><Plus size={14} /> Agregar</Button>
        </div>

        {lotes.map((lote, i) => {
          const niveles = nivelesDeUbicacion(lote.ubicacionId)
          return (
            <div key={i} className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}>
              {/* Artículo */}
              <div className="col-span-4">
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Artículo
                </label>
                <select
                  value={lote.articuloId}
                  onChange={(e) => updateLote(i, 'articuloId', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none border"
                  style={selectStyle}
                >
                  <option value="">Seleccionar...</option>
                  {articulos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>

              {/* Ubicación */}
              <div className="col-span-3">
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Ubicación
                </label>
                <select
                  value={lote.ubicacionId}
                  onChange={(e) => updateLote(i, 'ubicacionId', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none border"
                  style={selectStyle}
                >
                  <option value="">Sin ubicación</option>
                  {ubicaciones.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>

              {/* Nivel */}
              <div className="col-span-2">
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Nivel
                </label>
                <select
                  value={lote.nivelId}
                  onChange={(e) => updateLote(i, 'nivelId', e.target.value)}
                  disabled={!lote.ubicacionId}
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none border disabled:opacity-40"
                  style={selectStyle}
                >
                  <option value="">—</option>
                  {niveles.map((n) => (
                    <option key={n.id} value={n.id}>{n.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div className="col-span-2">
                <Input
                  label="Cant."
                  type="number"
                  min={0.001}
                  step="any"
                  value={lote.cantidadOriginal}
                  onChange={(e) => updateLote(i, 'cantidadOriginal', parseFloat(e.target.value) || 1)}
                />
              </div>

              <div className="col-span-1 flex justify-center">
                {lotes.length > 1 && (
                  <button onClick={() => removeLote(i)} className="p-2.5 rounded-md hover:bg-red-500/20 transition-colors">
                    <Trash2 size={14} style={{ color: 'var(--accent-danger)' }} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={() => router.push('/entradas')}>Cancelar</Button>
        <Button onClick={submit} loading={saving}>Registrar entrada</Button>
      </div>
    </div>
  )
}
