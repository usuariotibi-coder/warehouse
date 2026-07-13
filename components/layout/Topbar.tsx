'use client'

import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { usePathname } from 'next/navigation'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/almacen': 'Warehouse',
  '/entradas': 'Entries',
  '/salidas': 'Exits',
  '/apartados': 'Reserves',
  '/articulos': 'Items Catalog',
  '/ubicaciones': 'Locations',
  '/proyectos': 'Projects',
  '/reportes': 'Reports',
  '/usuarios': 'Users',
  '/perfil': 'My Profile',
  '/ayuda': 'Help',
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const title = Object.entries(titles).find(([key]) => pathname.startsWith(key))?.[1] ?? 'MXQ-STOCK'

  return (
    <header
      className="h-14 flex items-center justify-between px-4 gap-4 flex-shrink-0"
      style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--topbar-border)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <Menu size={18} style={{ color: 'var(--text-secondary)' }} />
        </button>
        <h1 className="font-display font-semibold text-base tracking-wide">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors hover:bg-[var(--bg-tertiary)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <LogOut size={14} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  )
}
