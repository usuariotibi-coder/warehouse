'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  tipo: string
  leida: boolean
  createdAt: string
  metadata?: Record<string, string>
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notificacion[]>([])

  async function fetchNotifs() {
    const res = await fetch('/api/notificaciones')
    if (res.ok) {
      const data = await res.json()
      setNotifs(data)
    }
  }

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30_000)
    return () => clearInterval(interval)
  }, [])

  const unread = notifs.filter((n) => !n.leida).length

  async function markRead(id: string) {
    await fetch(`/api/notificaciones/${id}`, { method: 'PUT' })
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md transition-colors hover:bg-[var(--bg-tertiary)]"
      >
        <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
            style={{ background: 'var(--accent-danger)', color: 'white', fontSize: 10 }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-active)',
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-display font-semibold text-sm">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No notifications
                </p>
              ) : (
                notifs.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className="w-full text-left px-4 py-3 transition-colors hover:bg-[var(--bg-tertiary)]"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.leida && (
                        <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: 'var(--accent-primary)' }} />
                      )}
                      <div className={n.leida ? 'opacity-60' : ''}>
                        <p className="text-xs font-medium">{n.titulo}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
