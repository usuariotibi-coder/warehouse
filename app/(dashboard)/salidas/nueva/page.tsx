'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Articulo { id: string; nombre: string; unidad: string }
interface Proyecto { id: string; nombre: string }

interface SalidaItem { articuloId: string; cantidad: number }

export default function NuevaSalidaPage() {
  const router = useRouter()
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [proyectoId, setProyectoId] = useState('')
  const [notas, setNotas] = useState('')
  const [items, setItems] = useState<SalidaItem[]>([{ articuloId: '', cantidad: 1 }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/articulos?limit=200').then((r) => r.json()),
      fetch('/api/proyectos').then((r) => r.json()),
    ]).then(([a, p]) => {
      setArticulos(a.articulos ?? [])
      setProyectos(p.filter((pr: any) => pr.estado === 'ACTIVO'))
    })
  }, [])

  function addItem() { setItems((i) => [...i, { articuloId: '', cantidad: 1 }]) }
  function removeItem(i: number) { setItems((list) => list.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: keyof SalidaItem, value: string | number) {
    setItems((list) => list.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function submit() {
    if (items.some((i) => !i.articuloId || i.cantidad < 1)) {
      toast.error('Completa todos los artículos y cantidades')
      return
    }
    setSaving(true)
    const res = await fetch('/api/salidas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectoId: proyectoId || undefined, notas: notas || undefined, items }),
    })
    if (res.ok) {
      toast.success('Salida registrada')
      router.push('/salidas')
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="w-full space-y-5">
      <div className="p-4 rounded-lg border" style={{ background: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)', borderColor: 'var(--accent-warning)' }}>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={14} style={{ color: 'var(--accent-warning)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--accent-warning)' }}>
            Los precios se calculan automáticamente con el método FIFO
          </p>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Si hay lotes sin precio asignado, el costo total no se calculará hasta que el admin los asigne.
        </p>
      </div>

      <div className="card-industrial p-5">
        <div className="flex items-center gap-6">
          <h2 className="font-display text-lg font-semibold whitespace-nowrap">Datos generales</h2>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Proyecto destino (opcional)
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md text-sm outline-none border"
                style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">Sin proyecto</option>
                {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <Input label="Notas (opcional)" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card-industrial p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Artículos</h2>
          <Button variant="outline" size="sm" onClick={addItem}><Plus size={14} /> Agregar</Button>
        </div>

        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-3 px-3 pb-1">
          {[
            { label: 'Artículo', span: 'col-span-10' },
            { label: 'Cantidad', span: 'col-span-1' },
            { label: '', span: 'col-span-1' },
          ].map(({ label, span }) => (
            <div key={label} className={`${span} text-xs uppercase tracking-wider`} style={{ color: 'var(--text-muted)' }}>
              {label}
            </div>
          ))}
        </div>

        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg"
            style={{ background: 'var(--bg-tertiary)' }}>
            <div className="col-span-12 md:col-span-10">
              <label className="md:hidden block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Artículo</label>
              <select
                value={item.articuloId}
                onChange={(e) => updateItem(i, 'articuloId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-md text-sm outline-none border"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                <option value="">Seleccionar artículo...</option>
                {articulos.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div className="col-span-10 md:col-span-1">
              <label className="md:hidden block text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Cantidad</label>
              <input
                type="number"
                min={0.001}
                step="any"
                value={item.cantidad}
                onChange={(e) => updateItem(i, 'cantidad', parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2.5 rounded-md text-sm outline-none border text-center"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="col-span-2 md:col-span-1 flex justify-center">
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} className="p-2 rounded-md hover:bg-red-500/20 transition-colors">
                  <Trash2 size={14} style={{ color: 'var(--accent-danger)' }} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={() => router.push('/salidas')}>Cancel</Button>
        <Button onClick={submit} loading={saving}>Record Exit</Button>
      </div>
    </div>
  )
}
