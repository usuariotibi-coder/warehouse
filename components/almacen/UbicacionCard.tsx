'use client'

import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

interface ArticuloNivel {
  cantidad: number
  apartadoReservado: number
}

interface Nivel {
  id: string
  nombre: string
  numero: number
  articuloNiveles: ArticuloNivel[]
}

interface UbicacionCardProps {
  id: string
  nombre: string
  descripcion?: string | null
  totalArticulos: number
  totalStock: number
  niveles?: Nivel[]
  matchingNiveles?: Set<string>
  onClick: () => void
  onNivelClick?: (nivelId: string) => void
  index?: number
}

function nivelArticulos(nivel: Nivel) {
  return nivel.articuloNiveles.filter((an) => an.cantidad > 0).length
}

function nivelLedColor(count: number): string {
  if (count === 0) return 'var(--accent-danger)'
  if (count < 3)  return 'var(--accent-warning)'
  return 'var(--accent-success)'
}

export function UbicacionCard({
  nombre, descripcion, totalArticulos, niveles = [], matchingNiveles, onClick, onNivelClick, index = 0,
}: UbicacionCardProps) {
  const searching = matchingNiveles !== undefined && matchingNiveles.size > 0
  const cardMatches = searching && niveles.some((n) => matchingNiveles.has(n.id))

  const overallLed = totalArticulos === 0 ? 'var(--accent-danger)'
    : totalArticulos < 3 ? 'var(--accent-warning)'
    : 'var(--accent-success)'

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="card-industrial p-4 text-left w-full transition-all"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: searching && !cardMatches ? 0.4 : 1,
        borderColor: cardMatches ? 'var(--accent-primary)' : undefined,
        transition: 'opacity 0.2s, border-color 0.2s',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MapPin size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span
            className="font-mono-data font-bold"
            style={{ color: 'var(--accent-primary)', fontSize: 18, lineHeight: 1 }}
          >
            {nombre}
          </span>
        </div>
        <span
          className="inline-block rounded-sm flex-shrink-0"
          style={{
            width: 8, height: 8,
            background: overallLed,
            boxShadow: `0 0 5px ${overallLed}`,
          }}
        />
      </div>

      {descripcion && (
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)', marginTop: -4 }}>
          {descripcion}
        </p>
      )}

      {/* Niveles grid 3×2 */}
      {niveles.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {niveles.map((nivel) => {
            const count = nivelArticulos(nivel)
            const ledColor = nivelLedColor(count)
            const isMatch = matchingNiveles?.has(nivel.id) ?? false
            return (
              <div
                key={nivel.id}
                className={isMatch ? 'tile-match' : ''}
                onClick={(e) => { e.stopPropagation(); onNivelClick ? onNivelClick(nivel.id) : onClick() }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  padding: '6px 4px 5px',
                  gap: 3,
                  background: isMatch ? undefined : 'var(--bg-tertiary)',
                  border: isMatch ? '1px solid color-mix(in srgb, var(--accent-primary) 50%, transparent)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <span
                  className="rounded-full"
                  style={{ width: 6, height: 6, background: ledColor, flexShrink: 0 }}
                />
                <span
                  className="font-mono-data font-bold leading-none"
                  style={{ fontSize: 10, color: 'var(--text-muted)' }}
                >
                  N-{nivel.numero}
                </span>
                <span
                  className="font-mono-data font-bold leading-none"
                  style={{ fontSize: 13, color: count > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Fallback sin niveles */}
      {niveles.length === 0 && (
        <div className="rounded p-2" style={{ background: 'var(--bg-tertiary)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Items</p>
          <p className="font-mono-data text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
            {totalArticulos}
          </p>
        </div>
      )}
    </motion.button>
  )
}
