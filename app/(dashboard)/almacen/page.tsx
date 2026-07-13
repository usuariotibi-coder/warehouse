'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { UbicacionCard } from '@/components/almacen/UbicacionCard'
import { UbicacionDetailModal } from '@/components/almacen/UbicacionDetailModal'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UbicacionSchema } from '@/lib/validations'
import { z } from 'zod'
import { Plus, Search } from 'lucide-react'

type UbicacionForm = z.infer<typeof UbicacionSchema>
type TipoSeparador = 'NINGUNO' | 'PASILLO' | 'MURO'

interface ArticuloNivel {
  cantidad: number
  apartadoReservado: number
  articulo: { id: string; nombre: string; marca?: string | null; fotoUrl?: string | null; unidad: string }
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
  totalArticulos: number
  totalStock: number
  niveles: Nivel[]
}

const TIPOS: TipoSeparador[] = ['NINGUNO', 'PASILLO', 'MURO']
const TIPO_LABELS: Record<TipoSeparador, string> = {
  NINGUNO: 'No separator',
  PASILLO: '— Aisle',
  MURO: '═ Wall',
}

export default function AlmacenPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Ubicacion | null>(null)
  const [selectedNivelId, setSelectedNivelId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [separadores, setSeparadores] = useState<Record<string, TipoSeparador>>({})

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UbicacionForm>({
    resolver: zodResolver(UbicacionSchema),
  })

  const fetchUbicaciones = useCallback(async () => {
    const res = await fetch('/api/ubicaciones')
    if (res.ok) setUbicaciones(await res.json())
    setLoading(false)
  }, [])

  const fetchSeparadores = useCallback(async () => {
    const res = await fetch('/api/separadores')
    if (res.ok) {
      const data: Array<{ prefix: string; tipo: TipoSeparador }> = await res.json()
      setSeparadores(Object.fromEntries(data.map(s => [s.prefix, s.tipo])))
    }
  }, [])

  useEffect(() => { fetchUbicaciones() }, [fetchUbicaciones])
  useEffect(() => { fetchSeparadores() }, [fetchSeparadores])

  async function updateSeparador(prefix: string, tipo: TipoSeparador) {
    setSeparadores(prev => ({ ...prev, [prefix]: tipo }))
    await fetch('/api/separadores', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, tipo }),
    })
  }

  async function crearUbicacion(data: UbicacionForm) {
    setSaving(true)
    const res = await fetch('/api/ubicaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success('Location created')
      setShowForm(false)
      reset()
      fetchUbicaciones()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSaving(false)
  }

  const matchingNiveles = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return new Set<string>()
    const s = new Set<string>()
    for (const u of ubicaciones) {
      for (const n of u.niveles) {
        if (n.articuloNiveles.some(an =>
          an.cantidad > 0 && (
            an.articulo.nombre.toLowerCase().includes(q) ||
            (an.articulo.marca?.toLowerCase().includes(q))
          )
        )) s.add(n.id)
      }
    }
    return s
  }, [ubicaciones, query])

  const grupos = ubicaciones.reduce<Record<string, Ubicacion[]>>((acc, u) => {
    const prefix = u.nombre[0]?.toUpperCase() ?? '#'
    if (!acc[prefix]) acc[prefix] = []
    acc[prefix].push(u)
    return acc
  }, {})

  const sortedGrupos = Object.entries(grupos).sort() as [string, Ubicacion[]][]

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search article, brand..."
            className="w-full pl-9 pr-3 py-2.5 rounded-md text-sm outline-none border"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        {rol !== 'USUARIO' && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus size={14} /> New Location
          </Button>
        )}
      </div>

      {sortedGrupos.map(([prefix, items], idx) => {
        const prevPrefix = idx > 0 ? sortedGrupos[idx - 1][0] : null
        const tipo: TipoSeparador = prevPrefix ? (separadores[prevPrefix] ?? 'NINGUNO') : 'NINGUNO'

        return (
          <div key={prefix} className="space-y-3">
            {/* Separator between groups */}
            {prevPrefix && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1">
                  {tipo === 'PASILLO' && (
                    <div className="border-t-2 border-dashed" style={{ borderColor: 'var(--border-active)' }} />
                  )}
                  {tipo === 'MURO' && (
                    <div className="space-y-1.5">
                      <div className="border-t-2 border-dashed" style={{ borderColor: 'var(--border-active)' }} />
                      <div className="border-t-2 border-dashed" style={{ borderColor: 'var(--border-active)' }} />
                    </div>
                  )}
                </div>
                {rol === 'ADMIN' && (
                  <div className="flex gap-1 flex-shrink-0">
                    {TIPOS.map(t => (
                      <button
                        key={t}
                        onClick={() => updateSeparador(prevPrefix, t)}
                        className="px-2 py-0.5 rounded text-xs transition-colors"
                        style={{
                          background: tipo === t ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                          color: tipo === t ? 'var(--text-on-accent)' : 'var(--text-muted)',
                          border: `1px solid ${tipo === t ? 'var(--accent-primary)' : 'var(--border)'}`,
                        }}
                      >
                        {TIPO_LABELS[t]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Location grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {items.map((u, i) => (
                <UbicacionCard
                  key={u.id}
                  id={u.id}
                  nombre={u.nombre}
                  descripcion={u.descripcion}
                  totalArticulos={u.totalArticulos}
                  totalStock={u.totalStock}
                  niveles={u.niveles}
                  matchingNiveles={query.trim() ? matchingNiveles : undefined}
                  onClick={() => { setSelectedNivelId(null); setSelected(u) }}
                  onNivelClick={(nivelId) => { setSelectedNivelId(nivelId); setSelected(u) }}
                  index={i}
                />
              ))}
            </div>
          </div>
        )
      })}

      {ubicaciones.length === 0 && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p>No locations registered</p>
        </div>
      )}

      {query.trim() && matchingNiveles.size === 0 && (
        <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
          <p className="text-sm">No articles found matching "{query}"</p>
        </div>
      )}

      <UbicacionDetailModal
        ubicacion={selected}
        open={!!selected}
        onClose={() => { setSelected(null); setSelectedNivelId(null) }}
        onRefresh={fetchUbicaciones}
        initialNivelId={selectedNivelId}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Location" size="sm">
        <form onSubmit={handleSubmit(crearUbicacion)} className="space-y-4">
          <Input label="Name (e.g.: A1, B3)" error={errors.nombre?.message} {...register('nombre')} />
          <Input label="Description (optional)" {...register('descripcion')} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
