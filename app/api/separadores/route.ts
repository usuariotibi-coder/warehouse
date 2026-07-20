export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse } from '@/lib/utils'
import { Rol, TipoSeparador } from '@prisma/client'

const TIPOS_VALIDOS: TipoSeparador[] = ['NINGUNO', 'PASILLO', 'MURO']

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const separadores = await prisma.separadorFila.findMany()
  return Response.json(separadores)
}

export async function PUT(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const { prefix, tipo } = body

  if (!prefix || typeof prefix !== 'string') return errorResponse('prefix required', 'VALIDATION_ERROR')
  if (!TIPOS_VALIDOS.includes(tipo)) return errorResponse('Invalid tipo', 'VALIDATION_ERROR')

  const separador = await prisma.separadorFila.upsert({
    where: { prefix },
    update: { tipo },
    create: { prefix, tipo },
  })

  return Response.json(separador)
}
