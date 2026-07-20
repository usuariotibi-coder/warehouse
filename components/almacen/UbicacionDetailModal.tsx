'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { QrCode, Plus, Trash2, Bookmark, ArrowLeftRight } from 'lucide-react'
import NextImage from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { addDays } from 'date-fns'
import { MoverComponenteModal } from './MoverComponenteModal'

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

interface Proyecto { id: string; nombre: string }

interface UbicacionDetailModalProps {
  ubicacion: {
    id: string
    nombre: string
    niveles: Nivel[]
  } | null
  open: boolean
  onClose: () => void
  onRefresh?: () => void
  initialNivelId?: string | null
}

const selectStyle = {
  background: 'var(--bg-tertiary)',
  borderColor: 'var(--border)',
  color: 'var(--text-primary)',
} as const

export function UbicacionDetailModal({ ubicacion, open, onClose, onRefresh, initialNivelId }: UbicacionDetailModalProps) {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const canEdit = rol === 'ADMIN' || rol === 'ALMACENISTA'

  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [nivelSeleccionado, setNivelSeleccionado] = useState<string | null>(null)

  useEffect(() => {
    if (open) setNivelSeleccionado(initialNivelId ?? null)
  }, [open, initialNivelId])
  const [addingNivel, setAddingNivel] = useState(false)

  // Mover state
  const [moverData, setMoverData] = useState<{
    articulo: { id: string; nombre: string; marca?: string }
    cantidadTotal: number
    cantidadApartada: number
  } | null>(null)

  // Apartado state
  const [apartandoId, setApartandoId] = useState<string | null>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [apartadoForm, setApartadoForm] = useState({ cantidad: 1, proyectoId: '', notas: '' })
  const [savingApartado, setSavingApartado] = useState(false)

  const nivelesActivos = ubicacion?.niveles.filter(n => n) ?? []
  const nivelActualId = nivelSeleccionado ?? nivelesActivos[0]?.id ?? null
  const nivelActual = nivelesActivos.find(n => n.id === nivelActualId) ?? nivelesActivos[0] ?? null

  async function generarQR() {
    if (!ubicacion) return
    setLoadingQr(true)
    const res = await fetch(`/api/ubicaciones/${ubicacion.id}/qr`)
    if (res.ok) {
      const data = await res.json()
      setQrUrl(data.qrUrl)
    }
    setLoadingQr(false)
  }

  async function agregarNivel() {
    if (!ubicacion) return
    setAddingNivel(true)
    const res = await fetch(`/api/ubicaciones/${ubicacion.id}/niveles`, { method: 'POST' })
    if (res.ok) {
      toast.success('Level added')
      onRefresh?.()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setAddingNivel(false)
  }

  async function eliminarNivel(nivelId: string) {
    if (!ubicacion) return
    const res = await fetch(`/api/ubicaciones/${ubicacion.id}/niveles/${nivelId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Level deleted')
      if (nivelSeleccionado === nivelId) setNivelSeleccionado(null)
      onRefresh?.()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
  }

  function abrirApartar(articuloId: string) {
    setApartandoId(articuloId)
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
      toast.error('You must select a project to make a reservation')
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
      toast.success('Reserve created successfully')
      setApartandoId(null)
      onRefresh?.()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSavingApartado(false)
  }

  if (!ubicacion) return null

  return (
    <>
      <Modal open={open} onClose={onClose} title={`Location ${ubicacion.nombre}`} size="full">
        <div className="flex flex-col h-full gap-3">
          <div className="flex justify-end flex-shrink-0">
            <Button variant="outline" size="sm" onClick={generarQR} loading={loadingQr}>
              <QrCode size={14} />
              {qrUrl ? 'View QR' : 'Generate QR'}
            </Button>
          </div>

          {qrUrl && (
            <div className="flex justify-center p-4 rounded-lg flex-shrink-0" style={{ background: 'white' }}>
              <NextImage src={qrUrl} alt="QR" width={200} height={200} />
            </div>
          )}

          {/* Dos paneles */}
          <div className="flex rounded-lg overflow-hidden border flex-1 min-h-0" style={{ borderColor: 'var(--border)' }}>
            {/* Panel izquierdo — Niveles */}
            <div className="flex flex-col flex-shrink-0" style={{ width: 160, borderRight: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div className="px-3 py-2 text-xs uppercase tracking-widest font-medium"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                Levels
              </div>
              <div className="flex-1 overflow-y-auto">
                {nivelesActivos.map((nivel) => {
                  const totalArticulos = nivel.articuloNiveles.filter(an => an.cantidad > 0).length
                  const activo = nivel.id === nivelActualId
                  const tieneStock = nivel.articuloNiveles.some(an => an.cantidad > 0)
                  return (
                    <button
                      key={nivel.id}
                      onClick={() => setNivelSeleccionado(nivel.id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors"
                      style={{
                        background: activo ? 'var(--bg-tertiary)' : undefined,
                        borderLeft: activo ? '3px solid var(--accent-primary)' : '3px solid transparent',
                        color: activo ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: tieneStock ? 'var(--accent-success, #00e676)' : 'var(--accent-danger)' }} />
                      <span className="font-mono text-xs flex-1">
                        {ubicacion.nombre}-{nivel.nombre}
                      </span>
                      {!tieneStock && rol === 'ADMIN' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); eliminarNivel(nivel.id) }}
                          style={{ color: 'var(--accent-danger)' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({totalArticulos})</span>
                    </button>
                  )
                })}
              </div>
              {canEdit && (
                <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <Button variant="ghost" size="sm" className="w-full" onClick={agregarNivel} loading={addingNivel}>
                    <Plus size={12} /> Level
                  </Button>
                </div>
              )}
            </div>

            {/* Panel derecho — tabla de componentes */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 text-xs uppercase tracking-widest font-medium flex items-center gap-2"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                Components
                {nivelActual && (
                  <span className="font-mono-data" style={{ color: 'var(--accent-primary)' }}>
                    — {ubicacion.nombre}-{nivelActual.nombre}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={nivelActualId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                  >
                    {!nivelActual || nivelActual.articuloNiveles.filter(an => an.cantidad > 0).length === 0 ? (
                      <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
                        No items at this level
                      </p>
                    ) : (
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                            <th className="text-left px-3 py-2 text-xs font-medium tracking-wider uppercase"
                              style={{ color: 'var(--text-muted)' }}>Item</th>
                            <th className="text-left px-3 py-2 text-xs font-medium tracking-wider uppercase"
                              style={{ color: 'var(--text-muted)' }}>Brand</th>
                            <th className="text-right px-3 py-2 text-xs font-medium tracking-wider uppercase"
                              style={{ color: 'var(--text-muted)' }}>Reserved</th>
                            <th className="text-right px-3 py-2 text-xs font-medium tracking-wider uppercase"
                              style={{ color: 'var(--text-muted)' }}>Available</th>
                            <th className="text-left px-3 py-2 text-xs font-medium tracking-wider uppercase"
                              style={{ color: 'var(--text-muted)' }}>Unit</th>
                            <th className="px-3 py-2" style={{ width: 72 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {nivelActual.articuloNiveles
                            .filter(an => an.cantidad > 0)
                            .map((an, i) => {
                              const disponible = Math.max(0, an.cantidad - an.apartadoReservado)
                              return (
                                <tr
                                  key={i}
                                  style={{
                                    borderBottom: '1px solid var(--border)',
                                    background: i % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                                  }}
                                >
                                  {/* Nombre */}
                                  <td className="px-3 py-2.5">
                                    <span className="font-medium truncate block max-w-[180px]" title={an.articulo.nombre}>
                                      {an.articulo.nombre}
                                    </span>
                                  </td>
                                  {/* Marca */}
                                  <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>
                                    {an.articulo.marca ?? '—'}
                                  </td>
                                  {/* Apartado */}
                                  <td className="px-3 py-2.5 text-right">
                                    {an.apartadoReservado > 0 ? (
                                      <span className="font-mono-data text-xs font-medium"
                                        style={{ color: 'var(--accent-warning)' }}>
                                        {an.apartadoReservado}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                                    )}
                                  </td>
                                  {/* Disponible */}
                                  <td className="px-3 py-2.5 text-right">
                                    <span className="font-mono-data font-bold"
                                      style={{ color: 'var(--accent-primary)', fontSize: 15 }}>
                                      {disponible}
                                    </span>
                                    {an.apartadoReservado > 0 && (
                                      <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                                        de {an.cantidad}
                                      </span>
                                    )}
                                  </td>
                                  {/* Unidad */}
                                  <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {an.articulo.unidad}
                                  </td>
                                  {/* Acciones */}
                                  <td className="px-2 py-2.5">
                                    <div className="flex items-center gap-0.5 justify-end">
                                      {disponible > 0 && (
                                        <Button variant="ghost" size="sm" onClick={() => abrirApartar(an.articulo.id)} title="Apartar">
                                          <Bookmark size={12} />
                                        </Button>
                                      )}
                                      {canEdit && an.cantidad > 0 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          title="Mover"
                                          onClick={() => setMoverData({
                                            articulo: { id: an.articulo.id, nombre: an.articulo.nombre, marca: an.articulo.marca ?? undefined },
                                            cantidadTotal: an.cantidad,
                                            cantidadApartada: an.apartadoReservado,
                                          })}
                                          style={{ color: 'var(--text-secondary)' }}
                                        >
                                          <ArrowLeftRight size={12} />
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                        </tbody>
                      </table>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Apartar */}
      <Modal
        open={!!apartandoId}
        onClose={() => setApartandoId(null)}
        title="Reserve item"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5"
              style={{ color: 'var(--text-secondary)' }}>
              Project <span style={{ color: 'var(--accent-danger)' }}>*</span>
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
            {proyectos.length === 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Loading active projects...
              </p>
            )}
          </div>
          <Input
            label="Quantity *"
            type="number"
            min={1}
            value={apartadoForm.cantidad}
            onChange={(e) => setApartadoForm(f => ({ ...f, cantidad: Math.max(1, parseInt(e.target.value) || 1) }))}
          />
          <div className="rounded-md px-3 py-2.5 text-sm"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            Validity: <span style={{ color: 'var(--text-primary)' }}>7 calendar days</span>
          </div>
          <Input
            label="Notes (optional)"
            value={apartadoForm.notas}
            onChange={(e) => setApartadoForm(f => ({ ...f, notas: e.target.value }))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setApartandoId(null)}>Cancel</Button>
            <Button
              onClick={crearApartado}
              loading={savingApartado}
              disabled={!apartadoForm.proyectoId}
            >
              <Bookmark size={14} /> Reserve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Mover */}
      {moverData && nivelActual && (
        <MoverComponenteModal
          isOpen={!!moverData}
          onClose={() => setMoverData(null)}
          onMoveSuccess={() => { setMoverData(null); onRefresh?.() }}
          articulo={moverData.articulo}
          nivelOrigen={{ id: nivelActual.id, nombre: nivelActual.nombre, ubicacion: { nombre: ubicacion.nombre } }}
          cantidadTotal={moverData.cantidadTotal}
          cantidadApartada={moverData.cantidadApartada}
        />
      )}
    </>
  )
}
