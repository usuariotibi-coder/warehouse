'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard, Warehouse, ArrowDownToLine, ArrowUpFromLine,
  Bookmark, Package, MapPin, FolderOpen, BarChart3,
  Users, User, X, PanelLeftClose, PanelLeftOpen, HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { href: '/almacen', label: 'Almacén', icon: Warehouse, roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] },
  { href: '/entradas', label: 'Entradas', icon: ArrowDownToLine, roles: ['ADMIN', 'ALMACENISTA'] },
  { href: '/salidas', label: 'Salidas', icon: ArrowUpFromLine, roles: ['ADMIN', 'ALMACENISTA'] },
  { href: '/apartados', label: 'Apartados', icon: Bookmark, roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] },
  { href: '/articulos', label: 'Artículos', icon: Package, roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] },
  { href: '/ubicaciones', label: 'Ubicaciones', icon: MapPin, roles: ['ADMIN', 'ALMACENISTA'] },
  { href: '/proyectos', label: 'Proyectos', icon: FolderOpen, roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] },
  { href: '/reportes', label: 'Reportes', icon: BarChart3, roles: ['ADMIN'] },
  { href: '/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
  { href: '/perfil', label: 'Mi perfil', icon: User, roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] },
  { href: '/ayuda', label: 'Ayuda', icon: HelpCircle, roles: ['ADMIN', 'ALMACENISTA', 'USUARIO'] },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ open, onClose, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol ?? 'USUARIO'

  const visibleItems = navItems.filter((item) => item.roles.includes(rol))

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen z-50 flex flex-col border-r',
          'lg:translate-x-0 lg:static lg:z-auto',
          collapsed ? 'w-60 lg:w-16' : 'w-60',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
          transition: 'width 200ms ease-in-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center flex-shrink-0 overflow-hidden"
          style={{
            borderBottom: '1px solid var(--sidebar-border)',
            minHeight: 56,
            padding: collapsed ? '0 12px' : '0 20px',
            justifyContent: collapsed ? 'center' : 'space-between',
            transition: 'padding 200ms ease-in-out',
          }}
        >
          <span
            className="font-display font-bold tracking-widest whitespace-nowrap overflow-hidden"
            style={{
              color: 'var(--sidebar-active-text)',
              fontSize: collapsed ? 14 : 20,
              transition: 'font-size 200ms ease-in-out',
            }}
          >
            {collapsed ? 'IP' : 'INVENTAPRO'}
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 ml-2 flex-shrink-0"
            style={{ color: 'var(--sidebar-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 overflow-x-hidden">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <li key={item.href} title={collapsed ? item.label : undefined}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={onClose}
                    className={cn(
                      'flex items-center rounded-md text-sm transition-all',
                      collapsed
                        ? 'justify-center py-2.5 px-0'
                        : 'gap-3 px-3 py-2.5',
                    )}
                    style={{
                      color: active ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                      background: active ? 'var(--sidebar-active-bg)' : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)'
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = ''
                    }}
                  >
                    <item.icon size={16} style={{ flexShrink: 0 }} />
                    {!collapsed && (
                      <span className="font-display tracking-wide truncate">{item.label}</span>
                    )}
                    {!collapsed && active && (
                      <span
                        className="ml-auto w-1 h-5 rounded-full flex-shrink-0"
                        style={{ background: 'var(--sidebar-active-text)' }}
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Toggle — desktop only */}
        <div
          className="hidden lg:block flex-shrink-0 px-2 py-2"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          <button
            onClick={onToggle}
            className={cn(
              'flex items-center gap-2 w-full rounded-md py-2 text-xs transition-colors',
              collapsed ? 'justify-center px-0' : 'px-3',
            )}
            style={{ color: 'var(--sidebar-text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '' }}
            title={collapsed ? 'Expandir menú' : undefined}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span className="font-display tracking-wide">Colapsar menú</span>
              </>
            )}
          </button>
        </div>

        {/* Footer — user info */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{
            borderTop: '1px solid var(--sidebar-border)',
            padding: '10px 12px',
          }}
        >
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-2')}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--sidebar-active-bg)', color: 'var(--sidebar-active-text)' }}
            >
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-text)' }}>
                  {session?.user?.name}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--sidebar-text-muted)' }}>{rol}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
