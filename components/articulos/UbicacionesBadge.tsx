'use client'

import { useState } from 'react'

interface UbicacionesBadgeProps {
  ubicaciones: string[]
  maxVisible?: number
}

export function UbicacionesBadge({ ubicaciones, maxVisible = 2 }: UbicacionesBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (ubicaciones.length === 0) {
    return (
      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>
        No location
      </span>
    )
  }

  const visible = ubicaciones.slice(0, maxVisible)
  const overflow = ubicaciones.slice(maxVisible)

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visible.map((ub) => (
        <span
          key={ub}
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 4,
            padding: '2px 6px',
            border: '1px solid var(--border)',
          }}
        >
          {ub}
        </span>
      ))}
      {overflow.length > 0 && (
        <div className="relative">
          <span
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              fontSize: 11,
              borderRadius: 4,
              padding: '2px 6px',
              cursor: 'default',
            }}
          >
            +{overflow.length} more
          </span>
          {showTooltip && (
            <div
              className="absolute z-50 bottom-full left-0 mb-1 rounded-md shadow-lg p-2 space-y-1"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', minWidth: 80 }}
            >
              {overflow.map((ub) => (
                <p
                  key={ub}
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    color: 'var(--accent-primary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ub}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
