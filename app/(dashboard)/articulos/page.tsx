'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArticuloSchema } from '@/lib/validations'
import { z } from 'zod'
import { Plus, Search, Bookmark } from 'lucide-react'
import { UbicacionesBadge } from '@/components/articulos/UbicacionesBadge'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { addDays } from 'date-fns'

type ArticuloForm = z.input<typeof ArticuloSchema>

interface Articulo {
  id: string
  nombre: string
  marca?: string | null
  numeroParte?: string | null
  unidad: string
  fotoUrl?: string | null
  stockMinimo?: number | null
  lotesEntrada: Array<{ cantidadDisponible: number }>
  apartadoReservado: number
  ubicaciones: string[]
}

interface Proyecto { id: string; nombre: string }

export default function ArticulosPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)

  // Apartado modal
  const [apartandoId, setApartandoId] = useState<string | null>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [apartadoForm, setApartadoForm] = useState({ cantidad: 1, proyectoId: '', notas: '' })
  const [savingApartado, setSavingApartado] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ArticuloForm>({
    resolver: zodResolver(ArticuloSchema),
  })

  const fetchArticulos = useCallback(async () => {
    const res = await fetch(`/api/articulos?q=${query}&limit=50`)
    if (res.ok) {
      const data = await res.json()
      setArticulos(data.articulos)
    }
    setLoading(false)
  }, [query])

  useEffect(() => { fetchArticulos() }, [fetchArticulos])

  function abrirApartar(articulo: Articulo) {
    setApartandoId(articulo.id)
    setApartadoForm({ cantidad: 1, proyectoId: '', notas: '' })
    if (proyectos.length === 0) {
      fetch('/api/proyectos').then(r => r.json()).then(data => {
        setProyectos(data.filter((p: any) => p.estado === 'ACTIVO'))
      })
    }
  }

  async function crearApartado() {
    if (!apartandoId) return
    if (!apartadoForm.proyectoId) {
      toast.error('Debes seleccionar un proyecto para apartar')
      return
    }
    setSavingApartado(true)
    const fechaExpira = addDays(new Date(), 7).toISOString()
    const res = await fetch('/api/apartados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proyectoId: apartadoForm.proyectoId,
        notas: apartadoForm.notas || undefined,
        fechaExpira,
        items: [{ articuloId: apartandoId, cantidad: apartadoForm.cantidad }],
      }),
    })
    if (res.ok) {
      toast.success('Apartado creado correctamente')
      setApartandoId(null)
      fetchArticulos()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSavingApartado(false)
  }

  async function crearArticulo(data: ArticuloForm) {
    setSaving(true)
    const res = await fetch('/api/articulos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success('Artículo creado')
      setShowForm(false)
      reset()
      fetchArticulos()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSaving(false)
  }

  const selectStyle = {
    background: 'var(--bg-tertiary)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  } as const

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar artículo, marca, número de parte..."
            className="w-full pl-9 pr-3 py-2.5 rounded-md text-sm outline-none border"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
        {rol !== 'USUARIO' && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus size={14} /> Nuevo artículo
          </Button>
        )}
      </div>

      {loading ? (
        <SkeletonTable />
      ) : (
        <div className="card-industrial overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Artículo', 'Marca', 'N° Parte', 'Unidad', 'Apartado', 'Stock disponible', 'Ubicación(es)', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articulos.map((a, i) => {
                const stockTotal = a.lotesEntrada?.reduce((s, l) => s + l.cantidadDisponible, 0) ?? 0
                const reservado = a.apartadoReservado ?? 0
                const stockDisponible = Math.max(0, stockTotal - reservado)
                const stockBadge = stockDisponible === 0 ? 'danger'
                  : (a.stockMinimo && stockDisponible <= a.stockMinimo) ? 'warning'
                  : 'success'

                return (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">{a.nombre}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.marca ?? '—'}</td>
                    <td className="px-4 py-3 font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
                      {a.numeroParte ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{a.unidad}</td>

                    {/* Apartado */}
                    <td className="px-4 py-3">
                      {reservado > 0 ? (
                        <span className="flex items-center gap-1 font-mono-data text-sm"
                          style={{ color: 'var(--accent-warning)' }}>
                          <Bookmark size={12} />
                          {reservado}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Stock disponible */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-data font-bold text-base"
                          style={{ color: 'var(--accent-primary)' }}>{stockDisponible}</span>
                        {reservado > 0 && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            ({stockTotal} − {reservado})
                          </span>
                        )}
                        <Badge variant={stockBadge}>
                          {stockDisponible === 0 ? 'Sin stock' : 'En stock'}
                        </Badge>
                      </div>
                    </td>

                    {/* Ubicaciones */}
                    <td className="px-4 py-3">
                      <UbicacionesBadge ubicaciones={a.ubicaciones ?? []} />
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {stockDisponible > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => abrirApartar(a)}
                            title="Apartar">
                            <Bookmark size={12} />
                          </Button>
                        )}
                        <Link href={`/articulos/${a.id}`}>
                          <Button variant="ghost" size="sm">Ver</Button>
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
          {articulos.length === 0 && (
            <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
              No hay artículos registrados
            </p>
          )}
        </div>
      )}

      {/* Modal Apartar */}
      <Modal
        open={!!apartandoId}
        onClose={() => setApartandoId(null)}
        title="Apartar artículo"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-secondary)' }}>
              Proyecto <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <select
              value={apartadoForm.proyectoId}
              onChange={(e) => setApartadoForm(f => ({ ...f, proyectoId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-md text-sm outline-none border"
              style={selectStyle}
            >
              <option value="">Seleccionar proyecto...</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <Input
            label="Cantidad *"
            type="number"
            min={1}
            value={apartadoForm.cantidad}
            onChange={(e) => setApartadoForm(f => ({ ...f, cantidad: Math.max(0.001, parseFloat(e.target.value) || 1) }))}
          />
          <div className="rounded-md px-3 py-2.5 text-sm"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            Vigencia: <span style={{ color: 'var(--text-primary)' }}>7 días calendario</span>
          </div>
          <Input
            label="Notas (opcional)"
            value={apartadoForm.notas}
            onChange={(e) => setApartadoForm(f => ({ ...f, notas: e.target.value }))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setApartandoId(null)}>Cancelar</Button>
            <Button onClick={crearApartado} loading={savingApartado} disabled={!apartadoForm.proyectoId}>
              <Bookmark size={14} /> Apartar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Nuevo Artículo */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo artículo">
        <form onSubmit={handleSubmit(crearArticulo)} className="space-y-4">
          <Input label="Nombre *" error={errors.nombre?.message} {...register('nombre')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Marca" {...register('marca')} />
            <Input label="Número de parte" {...register('numeroParte')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Unidad" placeholder="pza" {...register('unidad')} />
            <Input label="Stock mínimo" type="number" {...register('stockMinimo', { valueAsNumber: true })} />
          </div>
          <Input label="Descripción" {...register('descripcion')} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear artículo</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
