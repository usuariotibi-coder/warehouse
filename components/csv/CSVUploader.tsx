'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'
import { Upload, Download, CheckCircle, AlertTriangle, XCircle, X, ChevronRight } from 'lucide-react'
import type { CSVRowValidated } from '@/lib/csv-validator'

export type TipoCSV = 'entrada' | 'salida' | 'apartado'

interface Nivel { id: string; nombre: string }
interface Ubicacion { id: string; nombre: string; niveles: Nivel[] }

interface CSVUploaderProps {
  tipo: TipoCSV
  onProcesado: () => void
  onClose: () => void
}

const TEMPLATE_URLS: Record<TipoCSV, string> = {
  entrada: '/templates/template-entradas.csv',
  salida: '/templates/template-salidas.csv',
  apartado: '/templates/template-apartados.csv',
}

const TIPO_LABELS: Record<TipoCSV, string> = {
  entrada: 'Entradas',
  salida: 'Salidas',
  apartado: 'Apartados',
}

const ROW_COLORS: Record<CSVRowValidated['status'], string> = {
  valid: 'color-mix(in srgb, var(--accent-success) 6%, transparent)',
  warning: 'color-mix(in srgb, var(--accent-warning) 8%, transparent)',
  error: 'color-mix(in srgb, var(--accent-danger) 8%, transparent)',
}

const ROW_BORDER: Record<CSVRowValidated['status'], string> = {
  valid: 'color-mix(in srgb, var(--accent-success) 30%, transparent)',
  warning: 'color-mix(in srgb, var(--accent-warning) 30%, transparent)',
  error: 'color-mix(in srgb, var(--accent-danger) 30%, transparent)',
}

export function CSVUploader({ tipo, onProcesado, onClose }: CSVUploaderProps) {
  const [paso, setPaso] = useState<1 | 2 | 3>(2)
  const [dragging, setDragging] = useState(false)
  const [validating, setValidating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [filas, setFilas] = useState<CSVRowValidated[]>([])
  const [seleccionadas, setSeleccionadas] = useState<Set<number>>(new Set())
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [overrides, setOverrides] = useState<Record<number, { ubicacionId?: string; nivelId?: string }>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/ubicaciones').then(r => r.json()).then(setUbicaciones).catch(() => {})
  }, [])

  async function procesarArchivo(file: File) {
    const text = await file.text()
    setValidating(true)
    const res = await fetch('/api/csv/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText: text, tipo }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message)
      setValidating(false)
      return
    }
    const resultado: CSVRowValidated[] = await res.json()
    setFilas(resultado)
    const validas = new Set(resultado.filter(f => f.status !== 'error').map(f => f.rowNumber))
    setSeleccionadas(validas)
    setValidating(false)
    setPaso(3)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) procesarArchivo(file)
    else toast.error('Solo se aceptan archivos .csv')
  }, [tipo])

  function toggleFila(rowNumber: number) {
    setSeleccionadas(prev => {
      const next = new Set(prev)
      next.has(rowNumber) ? next.delete(rowNumber) : next.add(rowNumber)
      return next
    })
  }

  function eliminarFila(rowNumber: number) {
    setFilas(prev => prev.filter(f => f.rowNumber !== rowNumber))
    setSeleccionadas(prev => { const next = new Set(prev); next.delete(rowNumber); return next })
  }

  function setOverrideUbicacion(rowNumber: number, ubicacionId: string) {
    setOverrides(prev => ({ ...prev, [rowNumber]: { ubicacionId, nivelId: undefined } }))
  }

  function setOverrideNivel(rowNumber: number, nivelId: string) {
    setOverrides(prev => ({ ...prev, [rowNumber]: { ...prev[rowNumber], nivelId } }))
  }

  async function procesar() {
    const filasSeleccionadas = filas
      .filter(f => seleccionadas.has(f.rowNumber))
      .map(f => {
        const ov = overrides[f.rowNumber]
        if (!ov) return f
        return {
          ...f,
          resolvedData: {
            ...f.resolvedData,
            ...(ov.ubicacionId ? { ubicacionId: ov.ubicacionId } : {}),
            ...(ov.nivelId ? { nivelId: ov.nivelId } : {}),
          },
        }
      })
    if (!filasSeleccionadas.length) { toast.error('No hay filas seleccionadas'); return }

    setProcessing(true)
    const res = await fetch('/api/csv/procesar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filas: filasSeleccionadas, tipo }),
    })
    if (res.ok) {
      const data = await res.json()
      toast.success(`${data.procesadas} ${TIPO_LABELS[tipo].toLowerCase()} procesadas correctamente`)
      onProcesado()
      onClose()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setProcessing(false)
  }

  const validas = filas.filter(f => f.status === 'valid').length
  const warnings = filas.filter(f => f.status === 'warning').length
  const errores = filas.filter(f => f.status === 'error').length
  const procesables = filas.filter(f => seleccionadas.has(f.rowNumber)).length

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex flex-col shadow-2xl"
      style={{ width: 680, background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-display font-semibold">Cargar CSV — {TIPO_LABELS[tipo]}</h3>
        <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        {([1, 2, 3] as const).map((n, i) => (
          <div key={n} className="flex items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: paso >= n ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: paso >= n ? 'var(--bg-primary)' : 'var(--text-muted)',
                }}>
                {n}
              </span>
              <span className="text-xs" style={{ color: paso >= n ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {n === 1 ? 'Plantilla' : n === 2 ? 'Cargar' : 'Revisar'}
              </span>
            </div>
            {i < 2 && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
          </div>
        ))}
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-5">
        {paso === 1 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Descarga la plantilla CSV con el formato correcto para {TIPO_LABELS[tipo].toLowerCase()}.
            </p>
            <a
              href={TEMPLATE_URLS[tipo]}
              download
              className="flex items-center gap-3 p-4 rounded-lg border transition-colors hover:border-[var(--accent-primary)]"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}
            >
              <Download size={20} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <p className="text-sm font-medium">Plantilla {TIPO_LABELS[tipo]}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  template-{tipo === 'entrada' ? 'entradas' : tipo === 'salida' ? 'salidas' : 'apartados'}.csv
                </p>
              </div>
            </a>
            <Button className="w-full" onClick={() => setPaso(2)}>
              Continuar <ChevronRight size={14} />
            </Button>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Arrastra tu archivo CSV o haz clic para seleccionarlo.
              </p>
              <a
                href={TEMPLATE_URLS[tipo]}
                download
                className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                style={{ color: 'var(--accent-cyan)' }}
              >
                <Download size={12} />
                Descargar plantilla
              </a>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
              style={{
                borderColor: dragging ? 'var(--accent-primary)' : 'var(--border)',
                background: dragging ? 'color-mix(in srgb, var(--accent-primary) 5%, transparent)' : 'var(--bg-tertiary)',
              }}
            >
              <Upload size={32} style={{ color: dragging ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {dragging ? 'Suelta el archivo aquí' : 'Arrastra el CSV o haz clic para buscar'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Solo archivos .csv</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) procesarArchivo(f) }}
            />
            {validating && (
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>Validando filas...</p>
            )}
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="flex gap-4 text-sm">
              <span style={{ color: 'var(--text-muted)' }}>{filas.length} filas totales</span>
              <span style={{ color: '#00e676' }}>✓ {validas} válidas</span>
              {warnings > 0 && <span style={{ color: 'var(--accent-warning)' }}>⚠ {warnings} con advertencia</span>}
              {errores > 0 && <span style={{ color: 'var(--accent-danger)' }}>✗ {errores} con error</span>}
            </div>

            {/* Tabla */}
            <div className="space-y-2">
              {filas.map((fila) => (
                <div
                  key={fila.rowNumber}
                  className="rounded-lg border p-3 flex gap-3"
                  style={{
                    background: ROW_COLORS[fila.status],
                    borderColor: ROW_BORDER[fila.status],
                    opacity: seleccionadas.has(fila.rowNumber) ? 1 : 0.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={seleccionadas.has(fila.rowNumber)}
                    disabled={fila.status === 'error'}
                    onChange={() => toggleFila(fila.rowNumber)}
                    className="mt-1 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      {fila.status === 'valid' && <CheckCircle size={13} style={{ color: '#00e676' }} />}
                      {fila.status === 'warning' && <AlertTriangle size={13} style={{ color: 'var(--accent-warning)' }} />}
                      {fila.status === 'error' && <XCircle size={13} style={{ color: 'var(--accent-danger)' }} />}
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Fila {fila.rowNumber}</span>
                      <span className="text-xs font-medium truncate">
                        {fila.originalData['articulo_nombre']} — {fila.originalData['cantidad']} {fila.originalData['marca'] && `(${fila.originalData['marca']})`}
                      </span>
                    </div>

                    {fila.errors.map((e, i) => (
                      <p key={i} className="text-xs" style={{ color: 'var(--accent-danger)' }}>✗ {e}</p>
                    ))}
                    {fila.warnings.map((w, i) => (
                      <p key={i} className="text-xs" style={{ color: 'var(--accent-warning)' }}>⚠ {w}</p>
                    ))}

                    {/* Selector de ubicación */}
                    {fila.warnings.includes('No se especificó ubicación') && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <select
                          value={overrides[fila.rowNumber]?.ubicacionId ?? ''}
                          onChange={e => setOverrideUbicacion(fila.rowNumber, e.target.value)}
                          className="px-2 py-1 rounded text-xs border outline-none"
                          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)', minWidth: 140 }}
                        >
                          <option value="">Seleccionar ubicación...</option>
                          {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                        {overrides[fila.rowNumber]?.ubicacionId && (
                          <select
                            value={overrides[fila.rowNumber]?.nivelId ?? ''}
                            onChange={e => setOverrideNivel(fila.rowNumber, e.target.value)}
                            className="px-2 py-1 rounded text-xs border outline-none"
                            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)', minWidth: 120 }}
                          >
                            <option value="">Seleccionar nivel...</option>
                            {ubicaciones.find(u => u.id === overrides[fila.rowNumber]?.ubicacionId)?.niveles.map(n => (
                              <option key={n.id} value={n.id}>{n.nombre}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Selector de nivel (ubicación ya resuelta en CSV) */}
                    {fila.warnings.includes('No se especificó nivel') && fila.resolvedData.ubicacionId && (
                      <div className="mt-2">
                        <select
                          value={overrides[fila.rowNumber]?.nivelId ?? ''}
                          onChange={e => setOverrideNivel(fila.rowNumber, e.target.value)}
                          className="px-2 py-1 rounded text-xs border outline-none"
                          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-primary)', minWidth: 140 }}
                        >
                          <option value="">Seleccionar nivel...</option>
                          {ubicaciones.find(u => u.id === fila.resolvedData.ubicacionId)?.niveles.map(n => (
                            <option key={n.id} value={n.id}>{n.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {fila.ubicacionSugerida && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full cursor-pointer"
                          style={{ background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)', color: 'var(--accent-primary)', border: '1px solid color-mix(in srgb, var(--accent-primary) 40%, transparent)' }}>
                          📦 Sugerido: {fila.ubicacionSugerida.ubicacionNombre}-{fila.ubicacionSugerida.nivelNombre} ({fila.ubicacionSugerida.cantidadExistente} uds ya aquí)
                        </span>
                      </div>
                    )}
                  </div>

                  {fila.status === 'error' && (
                    <button onClick={() => eliminarFila(fila.rowNumber)} className="flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {paso === 3 && (
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderTop: '1px solid var(--border)' }}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={procesar} loading={processing} disabled={procesables === 0}>
            Procesar {procesables} fila{procesables !== 1 ? 's' : ''} seleccionada{procesables !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  )
}
