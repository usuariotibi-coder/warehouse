'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { useSession } from 'next-auth/react'
import { FileSpreadsheet, FileText, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatDateTime } from '@/lib/utils'

type TipoReporte = 'inventario' | 'entradas' | 'salidas' | 'movimientos'

interface Movimiento {
  id: string
  createdAt: string
  cantidadMovida: number
  notas: string | null
  articulo: { id: string; nombre: string; marca: string | null }
  nivelOrigen: { nombre: string; ubicacion: { nombre: string } }
  nivelDestino: { nombre: string; ubicacion: { nombre: string } }
  usuario: { id: string; nombre: string }
}

interface Ubicacion { id: string; nombre: string }
interface Articulo { id: string; nombre: string }
interface Usuario { id: string; nombre: string }

export default function ReportesPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [tipo, setTipo] = useState<TipoReporte>('inventario')

  // Exportación (para reportes no-movimientos)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [loading, setLoading] = useState<'pdf' | 'excel' | null>(null)

  // Movimientos
  const [movDesde, setMovDesde] = useState('')
  const [movHasta, setMovHasta] = useState('')
  const [movArticuloId, setMovArticuloId] = useState('')
  const [movUbicacionOrigenId, setMovUbicacionOrigenId] = useState('')
  const [movUbicacionDestinoId, setMovUbicacionDestinoId] = useState('')
  const [movUsuarioId, setMovUsuarioId] = useState('')
  const [movPage, setMovPage] = useState(1)
  const [movData, setMovData] = useState<Movimiento[]>([])
  const [movTotal, setMovTotal] = useState(0)
  const [movTotalPages, setMovTotalPages] = useState(1)
  const [movLoading, setMovLoading] = useState(false)
  const [movExporting, setMovExporting] = useState(false)

  // Opciones para filtros
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([])
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  useEffect(() => {
    if (tipo === 'movimientos') {
      fetch('/api/ubicaciones').then(r => r.json()).then(data =>
        setUbicaciones(data.map((u: any) => ({ id: u.id, nombre: u.nombre })))
      )
      fetch('/api/articulos?limit=200').then(r => r.json()).then(data =>
        setArticulos(data.articulos ?? [])
      )
      if (rol === 'ADMIN') {
        fetch('/api/usuarios').then(r => r.json()).then(data => setUsuarios(data ?? []))
      }
    }
  }, [tipo, rol])

  const fetchMovimientos = useCallback(async (page = 1) => {
    setMovLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (movDesde) params.set('desde', movDesde)
    if (movHasta) params.set('hasta', movHasta)
    if (movArticuloId) params.set('articuloId', movArticuloId)
    if (movUbicacionOrigenId) params.set('ubicacionOrigenId', movUbicacionOrigenId)
    if (movUbicacionDestinoId) params.set('ubicacionDestinoId', movUbicacionDestinoId)
    if (movUsuarioId) params.set('usuarioId', movUsuarioId)

    const res = await fetch(`/api/reportes/movimientos?${params}`)
    if (res.ok) {
      const data = await res.json()
      setMovData(data.data)
      setMovTotal(data.total)
      setMovTotalPages(data.totalPages)
      setMovPage(page)
    }
    setMovLoading(false)
  }, [movDesde, movHasta, movArticuloId, movUbicacionOrigenId, movUbicacionDestinoId, movUsuarioId])

  useEffect(() => {
    if (tipo === 'movimientos') fetchMovimientos(1)
  }, [tipo, fetchMovimientos])

  async function exportarMovimientos() {
    setMovExporting(true)
    const params = new URLSearchParams({ formato: 'excel' })
    if (movDesde) params.set('desde', movDesde)
    if (movHasta) params.set('hasta', movHasta)
    if (movArticuloId) params.set('articuloId', movArticuloId)
    if (movUbicacionOrigenId) params.set('ubicacionOrigenId', movUbicacionOrigenId)
    if (movUbicacionDestinoId) params.set('ubicacionDestinoId', movUbicacionDestinoId)
    if (movUsuarioId) params.set('usuarioId', movUsuarioId)

    const res = await fetch(`/api/reportes/movimientos?${params}`)
    if (!res.ok) { toast.error('Error exporting'); setMovExporting(false); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `movimientos-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
    setMovExporting(false)
  }

  async function descargar(formato: 'pdf' | 'excel') {
    setLoading(formato)
    const params = new URLSearchParams({ formato, ...(desde && { desde }), ...(hasta && { hasta }) })
    const res = await fetch(`/api/reportes/${tipo}?${params}`)
    if (!res.ok) { toast.error('Error generating report'); setLoading(null); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`
    a.click()
    URL.revokeObjectURL(url)
    setLoading(null)
  }

  const selectStyle = {
    background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)',
    padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14,
    outline: 'none', width: '100%',
  } as const

  const reportes: Array<{ id: TipoReporte; label: string; desc: string }> = [
    { id: 'inventario', label: 'Inventory valuation', desc: 'Current stock with FIFO valuation per item and location' },
    { id: 'entradas', label: 'Entry report', desc: 'Entry history with prices and suppliers' },
    { id: 'salidas', label: 'Exit report', desc: 'Exits by project with FIFO costs' },
    { id: 'movimientos', label: 'Component movements', desc: 'Relocation history between levels with advanced filters' },
  ]

  return (
    <div className="space-y-6">
      {/* Selector de tipo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {reportes.map((r) => (
          <button
            key={r.id}
            onClick={() => setTipo(r.id)}
            className="card-industrial p-4 text-left transition-all"
            style={tipo === r.id ? { borderColor: 'var(--accent-primary)', background: 'color-mix(in srgb, var(--accent-primary) 6%, transparent)' } : {}}
          >
            <div className="flex items-center gap-2 mb-1">
              {tipo === r.id && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-primary)' }} />}
              {r.id === 'movimientos' && <ArrowLeftRight size={12} style={{ color: 'var(--accent-primary)' }} />}
              <p className="text-sm font-medium">{r.label}</p>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Panel exportación para reportes simples */}
      {tipo !== 'movimientos' && (
        <div className="card-industrial p-4 max-w-2xl space-y-4">
          {tipo !== 'inventario' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="From" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              <Input label="To" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={() => descargar('pdf')} loading={loading === 'pdf'} variant="secondary">
              <FileText size={16} /> Export PDF
            </Button>
            <Button onClick={() => descargar('excel')} loading={loading === 'excel'}>
              <FileSpreadsheet size={16} /> Export Excel
            </Button>
          </div>
        </div>
      )}

      {/* Panel movimientos */}
      {tipo === 'movimientos' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="card-industrial p-4 space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <Input label="From" type="date" value={movDesde} onChange={(e) => setMovDesde(e.target.value)} />
              <Input label="To" type="date" value={movHasta} onChange={(e) => setMovHasta(e.target.value)} />
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Item</label>
                <select value={movArticuloId} onChange={(e) => setMovArticuloId(e.target.value)} style={selectStyle}>
                  <option value="">All</option>
                  {articulos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Origin</label>
                <select value={movUbicacionOrigenId} onChange={(e) => setMovUbicacionOrigenId(e.target.value)} style={selectStyle}>
                  <option value="">All</option>
                  {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Destination</label>
                <select value={movUbicacionDestinoId} onChange={(e) => setMovUbicacionDestinoId(e.target.value)} style={selectStyle}>
                  <option value="">All</option>
                  {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
              {rol === 'ADMIN' && (
                <div>
                  <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>User</label>
                  <select value={movUsuarioId} onChange={(e) => setMovUsuarioId(e.target.value)} style={selectStyle}>
                    <option value="">All</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => fetchMovimientos(1)}>Search</Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setMovDesde(''); setMovHasta(''); setMovArticuloId('')
                setMovUbicacionOrigenId(''); setMovUbicacionDestinoId(''); setMovUsuarioId('')
              }}>Clear filters</Button>
              <div className="flex-1" />
              <Button size="sm" variant="secondary" onClick={exportarMovimientos} loading={movExporting}>
                <FileSpreadsheet size={14} /> Excel
              </Button>
            </div>
          </div>

          {/* Tabla */}
          {movLoading ? (
            <SkeletonTable />
          ) : (
            <div className="card-industrial overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Item', 'Brand', 'Qty', 'Movement', 'User', 'Notes'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movData.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}
                      className="hover:bg-[var(--bg-tertiary)] transition-colors">
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium">{m.articulo.nombre}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {m.articulo.marca ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono-data font-bold" style={{ color: 'var(--accent-primary)' }}>
                        {m.cantidadMovida}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 font-mono-data text-xs">
                          <span style={{ color: 'var(--accent-primary)' }}>
                            {m.nivelOrigen.ubicacion.nombre}-{m.nivelOrigen.nombre}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>→</span>
                          <span style={{ color: 'var(--accent-primary)' }}>
                            {m.nivelDestino.ubicacion.nombre}-{m.nivelDestino.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {m.usuario.nombre}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)', maxWidth: 160 }}>
                        <span className="truncate block">{m.notas ?? '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movData.length === 0 && (
                <p className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  No movements in the selected period
                </p>
              )}
            </div>
          )}

          {/* Paginación */}
          {movTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Showing {((movPage - 1) * 50) + 1}–{Math.min(movPage * 50, movTotal)} of {movTotal} movements
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => fetchMovimientos(movPage - 1)} disabled={movPage === 1}>
                  <ChevronLeft size={14} />
                </Button>
                <span className="text-sm px-2 py-1" style={{ color: 'var(--text-secondary)' }}>
                  {movPage} / {movTotalPages}
                </span>
                <Button variant="ghost" size="sm" onClick={() => fetchMovimientos(movPage + 1)} disabled={movPage === movTotalPages}>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
