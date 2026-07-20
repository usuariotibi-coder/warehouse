import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { UsuarioSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = UsuarioSchema.partial().safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const data: any = { ...parsed.data }
  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 12)
    delete data.password
  }
  if (data.rol) data.rol = data.rol as Rol

  const usuario = await prisma.usuario.update({
    where: { id: params.id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  })

  return successResponse(usuario)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  await prisma.usuario.update({ where: { id: params.id }, data: { activo: false } })
  return successResponse({ ok: true })
}
