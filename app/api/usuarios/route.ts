export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { UsuarioSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function GET() {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true, nombre: true, email: true, rol: true,
      activo: true, createdAt: true, telegramUsername: true,
    },
    orderBy: { nombre: 'asc' },
  })

  return successResponse(usuarios)
}

export async function POST(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = UsuarioSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const { nombre, email, password, rol: userRol } = parsed.data
  const tempPassword = password ?? Math.random().toString(36).slice(-8)
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const usuario = await prisma.usuario.create({
    data: { nombre, email, passwordHash, rol: userRol as Rol },
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
  })

  return successResponse({ usuario, tempPassword: !password ? tempPassword : undefined }, 201)
}

