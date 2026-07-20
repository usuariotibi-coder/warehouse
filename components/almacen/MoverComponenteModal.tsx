'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Nivel { id: string; nombre: string; numero: number }
interface UbicacionOpcion { id: string; nombre: string; niveles: Nivel[] }

interface MoverComponenteModalProps {
  isOpen: boolean
  onClose: () => void
  onMoveSuccess: () => void
  articulo: { id: string; nombre: string; marca?: string }
  nivelOrigen: { id: string; nombre: string; ubicacion: { nombre: string } }
  cantidadTotal: number
  cantidadApartada: number
}

export function MoverComponenteModal({
  isOpen, onClose, onMoveSuccess,
  articulo, nivelOrigen, cantidadTotal, cantidadApartada,
}: MoverComponenteModalProps) {
  const [ubicaciones, setUbicaciones] = useState<UbicacionOpcion[]>([])
  const [destUbicacionId, setDestUbicacionId] = useState('')
  const [destNivelId, setDestNivelId] = useState('')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setDestUbicacionId('')
      setDestNivelId('')
      setNotas('')
      setErrorMsg('')
      fetch('/api/ubicaciones')
        .then(r => r.json())
        .then((data: UbicacionOpcion[]) => setUbicaciones(data))
    }
  }, [isOpen])

  const destUbicacion = ubicaciones.find(u => u.id === destUbicacionId)
  const nivelesDestino = destUbicacion?.niveles ?? []
  const destNivelSeleccionado = nivelesDestino.find(n => n.id === destNivelId)
  const canConfirm = !!destNivelId && destNivelId !== nivelOrigen.id

  async function confirmar() {
    if (!canConfirm) return
    setSaving(true)
    setErrorMsg('')
    const res = await fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articuloId: articulo.id,
        nivelOrigenId: nivelOrigen.id,
        nivelDestinoId: destNivelId,
        notas: notas || undefined,
      }),
    })
    if (res.ok) {
      const destLabel = `${destUbicacion?.nombre}-${destNivelSeleccionado?.nombre}`
      toast.success(`${articulo.nombre} movido a ${destLabel}`)
      onMoveSuccess()
      onClose()
    } else {
      const err = await res.json()
      setErrorMsg(err.message)
    }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)',
    background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  } as const

  return (
      <Modal open={isOpen} onClose={onClose} title="Move component" size="sm">
      <div className="space-y-5">
        {/* Info artículo */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Component</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>
            {articulo.nombre}
            {articulo.marca && <span style={{ color: 'var(--text-muted)' }}> · {articulo.marca}</span>}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Origin</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>
            {nivelOrigen.ubicacion.nombre} — {nivelOrigen.nombre}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Quantity</span>
          <span style={{ color: 'var(--accent-primary)', fontSize: 14, fontWeight: 700 }}>
            {cantidadTotal} pcs
          </span>
        </div>

        {/* Destino */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Destination</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Location</label>
              <select
                value={destUbicacionId}
                onChange={(e) => { setDestUbicacionId(e.target.value); setDestNivelId('') }}
                style={inputStyle}
              >
                <option value="">Select location...</option>
                {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Level</label>
              <select
                value={destNivelId}
                onChange={(e) => setDestNivelId(e.target.value)}
                disabled={!destUbicacionId}
                style={{ ...inputStyle, opacity: !destUbicacionId ? 0.5 : 1 }}
              >
                <option value="">Select level...</option>
                {nivelesDestino.map(n => (
                  <option key={n.id} value={n.id} disabled={n.id === nivelOrigen.id}>
                    {n.nombre}{n.id === nivelOrigen.id ? ' (current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Aviso apartados */}
        {cantidadApartada > 0 && (
          <div style={{
            background: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
            borderLeft: '3px solid var(--accent-warning)',
            borderRadius: 4,
            padding: 12,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}>
            <AlertTriangle size={16} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
              This component has <strong style={{ color: 'var(--accent-warning)' }}>{cantidadApartada} reserved units</strong>.
              They will be relocated automatically and the corresponding users will be notified.
            </p>
          </div>
        )}

        {/* Notas */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Notes (optional)</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'none' }}
            placeholder="Movement notes..."
          />
        </div>

        {errorMsg && (
          <p className="text-sm" style={{ color: 'var(--accent-danger)' }}>{errorMsg}</p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={confirmar} loading={saving} disabled={!canConfirm}>
            Confirm move →
          </Button>
        </div>
      </div>
    </Modal>
  )
}
