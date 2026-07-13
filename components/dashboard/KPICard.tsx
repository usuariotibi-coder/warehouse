'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'cyan' | 'green' | 'warning' | 'danger' | 'purple'
  index?: number
}

const colorMap = {
  cyan: 'var(--accent-primary)',
  green: 'var(--accent-success)',
  warning: 'var(--accent-warning)',
  danger: 'var(--accent-danger)',
  purple: 'var(--accent-purple)',
}

export function KPICard({ title, value, subtitle, icon: Icon, color = 'cyan', index = 0 }: KPICardProps) {
  const c = colorMap[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-industrial p-3"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs uppercase tracking-widest font-medium leading-tight"
          style={{ color: 'var(--text-muted)' }}>
          {title}
        </p>
        <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${c}18` }}>
          <Icon size={14} style={{ color: c }} />
        </div>
      </div>
      <p className="font-mono-data text-xl font-bold leading-tight" style={{ color: c }}>{value}</p>
      {subtitle && (
        <p className="text-xs mt-0.5 leading-tight" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      )}
    </motion.div>
  )
}
