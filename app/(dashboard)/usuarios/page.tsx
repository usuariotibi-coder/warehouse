'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { toast } from 'sonner'
import { Plus, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  createdAt: string
}

const rolBadge: Record<string, 'cyan' | 'warning' | 'default'> = {
  ADMIN: 'cyan', ALMACENISTA: 'warning', USUARIO: 'default',
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'USUARIO' })
  const [saving, setSaving] = useState(false)

  const fetchUsuarios = useCallback(async () => {
    const res = await fetch('/api/usuarios')
    if (res.ok) setUsuarios(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsuarios() }, [fetchUsuarios])

  async function crearUsuario() {
    if (!form.nombre || !form.email) { toast.error('Name and email are required'); return }
    setSaving(true)
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.tempPassword) {
        toast.success(`User created. Temporary password: ${data.tempPassword}`, { duration: 10000 })
      } else {
        toast.success('User created')
      }
      setShowForm(false)
      setForm({ nombre: '', email: '', password: '', rol: 'USUARIO' })
      fetchUsuarios()
    } else {
      const err = await res.json()
      toast.error(err.message)
    }
    setSaving(false)
  }

  async function cambiarRol(id: string, rol: string) {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rol }),
    })
    if (res.ok) {
      toast.success('Role updated')
      fetchUsuarios()
    }
  }

  async function toggleActivo(u: Usuario) {
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo }),
    })
    if (res.ok) {
      toast.success(u.activo ? 'User deactivated' : 'User activated')
      fetchUsuarios()
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">User Management</h2>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus size={14} /> New User</Button>
      </div>

      {loading ? <SkeletonTable /> : (
        <div className="card-industrial overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['User', 'Email', 'Role', 'Status', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium"
                    style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                  className="hover:bg-[var(--bg-tertiary)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                        {u.nombre[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded border outline-none"
                      style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      <option value="USUARIO">User</option>
                      <option value="ALMACENISTA">Warehouse Operator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.activo ? 'success' : 'default'}>{u.activo ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono-data text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => toggleActivo(u)}>
                      {u.activo ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New User" size="sm">
        <div className="space-y-4">
          <Input label="Name *" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Password (optional — generated if not provided)" type="password"
            value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role</label>
            <select value={form.rol} onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-md text-sm outline-none border"
              style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
              <option value="USUARIO">USUARIO</option>
              <option value="ALMACENISTA">ALMACENISTA</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={crearUsuario} loading={saving}>Create User</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
