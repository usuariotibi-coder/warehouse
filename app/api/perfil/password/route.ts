import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { CambiarPasswordSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const parsed = CambiarPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { passwordActual, passwordNueva } = parsed.data

  const usuario = await prisma.usuario.findUnique({ where: { id: userId } })
  if (!usuario) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const valida = await bcrypt.compare(passwordActual, usuario.passwordHash)
  if (!valida) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const hash = await bcrypt.hash(passwordNueva, 12)
  await prisma.usuario.update({
    where: { id: userId },
    data: { passwordHash: hash },
  })

  return NextResponse.json({ ok: true })
}
