'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Entrada {
  id: string
  fecha: string
  proyecto?: { nombre: string } | null
  usuario: { nombre: string }
  lotes: Array<{
    id: string
    cantidadOriginal: number
    cantidadDisponible: number
    precioUnitario?: number | null
    precioPendiente: boolean
    articulo: { nombre: string; unidad: string }
  }>
}

export default function EntradaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [entrada, setEntrada] = useState<Entrada | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrecioModal, setShowPrecioModal] = useState(false)
  const [precios, setPrecios] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/entradas/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) { setLoading(false); return }
        setEntrada(d)
        const initPrecios: Record<string, string> = {}
        d.lotes?.forEach((l: any) => { initPrecios[l.id] = l.precioUnitario?.toString() ?? '' })
        setPrecios(initPrecios)
        setLoading(false)
      })
  }, [id])

  async function asignarPrecios() {
    setSaving(true)
    const lotes = Object.entries(precios)
      .filter(([_, v]) => v && parseFloat(v) > 0)
      .map(([loteId, v]) => ({ loteId, precioUnitario: parseFloat(v) }))

    const res = await fetch(`/api/entradas/${id}/precio`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lotes }),
    })

    if (res.ok) {
      toast.success('Prices assigned successfully')
      setShowPrecioModal(false)
      const updated = await fetch(`/api/entradas/${id}`).then((r) => r.json())
      setEntrada(updated)
    } else {
      toast.error('Error assigning prices')
    }
    setSaving(false)
  }

  if (loading) return <SkeletonCard />
  if (!entrada) return <p style={{ color: 'var(--text-muted)' }}>Entry not found</p>

  const sinPrecio = entrada.lotes.some((l) => l.precioPendiente)

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="card-industrial p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold">Entry #{entrada.id.slice(-6).toUpperCase()}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {formatDateTime(entrada.fecha)} · by {entrada.usuario.nombre}
            </p>
            {entrada.proyecto && (
              <p className="text-xs mt-1 font-medium" style={{ color: 'var(--accent-primary)' }}>
                Project: {entrada.proyecto.nombre}
              </p>
            )}
          </div>
          {rol === 'ADMIN' && sinPrecio && (
            <Button onClick={() => setShowPrecioModal(true)}>
              Assign Prices
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {entrada.lotes.map((lote) => (
            <div key={lote.id} className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="text-sm font-medium">{lote.articulo.nombre}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {lote.cantidadDisponible} / {lote.cantidadOriginal} {lote.articulo.unidad} disponibles
                </p>
              </div>
              <div className="text-right">
                {lote.precioPendiente ? (
                  <Badge variant="warning">No price</Badge>
                ) : (
                  <span className="font-mono-data text-sm" style={{ color: 'var(--accent-primary)' }}>
                    {formatCurrency(lote.precioUnitario)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={showPrecioModal} onClose={() => setShowPrecioModal(false)}
        title="Assign prices to lots" size="md">
        <div className="space-y-3">
          {entrada.lotes.map((lote) => (
            <div key={lote.id} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{lote.articulo.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {lote.cantidadOriginal} {lote.articulo.unidad}
                </p>
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={precios[lote.id] ?? ''}
                  onChange={(e) => setPrecios((p) => ({ ...p, [lote.id]: e.target.value }))}
                  disabled={!lote.precioPendiente}
                />
              </div>
            </div>
          ))}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowPrecioModal(false)}>Cancel</Button>
            <Button onClick={asignarPrecios} loading={saving}>Save Prices</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
