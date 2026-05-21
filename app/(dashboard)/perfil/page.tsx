'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from 'sonner'
import { Eye, EyeOff, Check, X, KeyRound } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      {ok
        ? <Check size={12} style={{ color: 'var(--accent-success, #22c55e)' }} />
        : <X size={12} style={{ color: 'var(--text-muted)' }} />}
      <span style={{ color: ok ? 'var(--accent-success, #22c55e)' : 'var(--text-muted)' }}>{label}</span>
    </span>
  )
}

export default function PerfilPage() {
  const { data: session } = useSession()

  // Telegram state
  const [paso, setPaso] = useState<'idle' | 'token'>('idle')
  const [token, setToken] = useState('')

  // Password change state
  const [pwModalOpen, setPwModalOpen] = useState(false)
  const [pwActual, setPwActual] = useState('')
  const [pwNueva, setPwNueva] = useState('')
  const [pwConfirmar, setPwConfirmar] = useState('')
  const [showActual, setShowActual] = useState(false)
  const [showNueva, setShowNueva] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const rules = {
    length: pwNueva.length >= 10,
    upper: /[A-Z]/.test(pwNueva),
    lower: /[a-z]/.test(pwNueva),
    number: /[0-9]/.test(pwNueva),
    special: /[^A-Za-z0-9]/.test(pwNueva),
  }
  const strength = Object.values(rules).filter(Boolean).length
  const strengthLabel = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'][strength]
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'][strength]

  async function generarToken() {
    const res = await fetch('/api/perfil/telegram-token', { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setToken(data.token)
      setPaso('token')
    } else {
      toast.error('Error al generar token')
    }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwNueva !== pwConfirmar) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setPwLoading(true)
    try {
      const res = await fetch('/api/perfil/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordActual: pwActual,
          passwordNueva: pwNueva,
          passwordConfirmar: pwConfirmar,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al cambiar contraseña')
      } else {
        toast.success('Contraseña actualizada correctamente')
        setPwActual('')
        setPwNueva('')
        setPwConfirmar('')
        setPwModalOpen(false)
      }
    } finally {
      setPwLoading(false)
    }
  }

  const allRulesOk = Object.values(rules).every(Boolean)
  const canSubmit = pwActual.length > 0 && allRulesOk && pwNueva === pwConfirmar && !pwLoading

  return (
    <div className="max-w-lg space-y-6">
      {/* Cuenta */}
      <div className="card-industrial p-5">
        <h2 className="font-display text-lg font-semibold mb-4">Información de cuenta</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{session?.user?.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{session?.user?.email}</p>
              <p className="text-xs mt-0.5 font-mono-data" style={{ color: 'var(--accent-primary)' }}>
                {(session?.user as any)?.rol}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPwModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              title="Cambiar contraseña"
            >
              <KeyRound size={13} />
              Contraseña
            </button>
          </div>
        </div>
      </div>

      {/* Modal cambiar contraseña */}
      <Modal open={pwModalOpen} onClose={() => setPwModalOpen(false)} title="Cambiar contraseña" size="sm">
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Tu nueva contraseña debe cumplir todos los requisitos de seguridad.
        </p>

        <form onSubmit={cambiarPassword} className="space-y-4">
          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Contraseña actual
            </label>
            <div className="relative">
              <Input
                type={showActual ? 'text' : 'password'}
                value={pwActual}
                onChange={(e) => setPwActual(e.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowActual((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showActual ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Nueva contraseña
            </label>
            <div className="relative">
              <Input
                type={showNueva ? 'text' : 'password'}
                value={pwNueva}
                onChange={(e) => setPwNueva(e.target.value)}
                placeholder="••••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNueva((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showNueva ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar */}
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div
                    key={n}
                    className="h-1 flex-1 rounded-full transition-all"
                    style={{
                      background: strength >= n ? strengthColor : 'var(--bg-tertiary)',
                    }}
                  />
                ))}
              </div>
              {pwNueva.length > 0 && (
                <p className="text-xs font-medium" style={{ color: strengthColor }}>
                  {strengthLabel}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                <RuleItem ok={rules.length} label="Mínimo 10 caracteres" />
                <RuleItem ok={rules.upper} label="Una mayúscula" />
                <RuleItem ok={rules.lower} label="Una minúscula" />
                <RuleItem ok={rules.number} label="Un número" />
                <RuleItem ok={rules.special} label="Un carácter especial" />
              </div>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <Input
                type={showConfirmar ? 'text' : 'password'}
                value={pwConfirmar}
                onChange={(e) => setPwConfirmar(e.target.value)}
                placeholder="••••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwConfirmar.length > 0 && pwNueva !== pwConfirmar && (
              <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {pwLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </form>
      </Modal>

      {/* Telegram */}
      <div className="card-industrial p-5">
        <h2 className="font-display text-lg font-semibold mb-2">Vinculación con Telegram</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Vincula tu cuenta de Telegram para recibir notificaciones de inventario en tiempo real.
        </p>

        {paso === 'idle' ? (
          <Button onClick={generarToken}>Vincular Telegram</Button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent-primary)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                1. Abre el bot en Telegram
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                2. Envía este mensaje al bot:
              </p>
              <code className="block p-3 rounded font-mono-data text-sm"
                style={{ background: 'var(--bg-primary)', color: 'var(--accent-primary)' }}>
                /vincular {token}
              </code>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                El token expira en 10 minutos.
              </p>
            </div>
            <Button variant="ghost" onClick={() => setPaso('idle')}>Cancelar</Button>
          </div>
        )}
      </div>
    </div>
  )
}
