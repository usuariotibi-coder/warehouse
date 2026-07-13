'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative flex items-center rounded-full transition-colors flex-shrink-0"
      style={{
        width: 64,
        height: 28,
        padding: 3,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        minWidth: 44,
      }}
    >
      {/* Track icons */}
      <span
        className="absolute left-2 flex items-center justify-center pointer-events-none transition-opacity"
        style={{
          opacity: isDark ? 0.3 : 1,
          color: 'var(--accent-warning)',
        }}
      >
        <Sun size={12} />
      </span>
      <span
        className="absolute right-2 flex items-center justify-center pointer-events-none transition-opacity"
        style={{
          opacity: isDark ? 1 : 0.3,
          color: 'var(--accent-primary)',
        }}
      >
        <Moon size={12} />
      </span>

      {/* Thumb */}
      <span
        className="rounded-full transition-transform duration-200 flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          background: 'var(--accent-primary)',
          transform: isDark ? 'translateX(34px)' : 'translateX(0px)',
          flexShrink: 0,
        }}
      >
        {isDark
          ? <Moon size={11} style={{ color: 'var(--text-on-accent)' }} />
          : <Sun size={11} style={{ color: 'var(--text-on-accent)' }} />
        }
      </span>
    </button>
  )
}
