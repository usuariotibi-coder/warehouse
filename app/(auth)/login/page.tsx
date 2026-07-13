'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})
type LoginForm = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      toast.error('Invalid credentials')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      {/* Theme toggle — top-right corner */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md px-4">
        <div
          className="rounded-xl p-8"
          style={{
            background: 'var(--auth-card-bg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <h1
              className="font-display text-3xl font-bold tracking-widest"
              style={{ color: 'var(--accent-primary)' }}
            >
              MXQ-STOCK
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Inventory Control System
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                className="block text-xs font-medium mb-1.5 tracking-wider uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-md text-sm transition-colors outline-none focus:ring-1"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: `1px solid ${errors.email ? 'var(--accent-danger)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                }}
                placeholder="admin@mxqstock.com"
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: 'var(--accent-danger)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5 tracking-wider uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-md text-sm transition-colors outline-none focus:ring-1"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: `1px solid ${errors.password ? 'var(--accent-danger)' : 'var(--border)'}`,
                  color: 'var(--text-primary)',
                }}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: 'var(--accent-danger)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md font-display font-semibold text-sm tracking-widest uppercase transition-all disabled:opacity-50"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--text-on-accent)',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            MXQ-STOCK v1.0 — Precision Control
          </p>
        </div>
      </div>
    </>
  )
}
