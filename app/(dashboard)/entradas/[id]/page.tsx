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
        title="Assign prices to lots" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="overflow-x-auto border rounded-lg" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Item</th>
                  <th className="px-4 py-3 text-center text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Quantity</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {entrada.lotes.map((lote, i) => {
                  const precioValue = parseFloat(precios[lote.id] ?? '0') || 0
                  const total = lote.cantidadOriginal * precioValue
                  return (
                    <tr key={lote.id} style={{ borderBottom: i < entrada.lotes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{lote.articulo.nombre}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-mono-data text-sm">
                        {lote.cantidadOriginal} {lote.articulo.unidad}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={precios[lote.id] ?? ''}
                            onChange={(e) => setPrecios((p) => ({ ...p, [lote.id]: e.target.value }))}
                            disabled={!lote.precioPendiente}
                            className="w-28 text-right"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-data font-bold" style={{ color: 'var(--accent-primary)' }}>
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Grand total */}
          <div className="p-3 rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)', border: '1px solid var(--accent-primary)' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Total Entry Value</p>
              <p className="text-lg font-mono-data font-bold" style={{ color: 'var(--accent-primary)' }}>
                {formatCurrency(
                  entrada.lotes.reduce((sum, lote) => {
                    const precio = parseFloat(precios[lote.id] ?? '0') || 0
                    return sum + (lote.cantidadOriginal * precio)
                  }, 0)
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setShowPrecioModal(false)}>Cancel</Button>
            <Button onClick={asignarPrecios} loading={saving}>Save Prices</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
