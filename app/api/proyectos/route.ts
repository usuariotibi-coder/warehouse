export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { ProyectoSchema } from '@/lib/validations'
import { errorResponse, successResponse } from '@/lib/utils'
import { Rol } from '@prisma/client'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  const proyectos = await prisma.proyecto.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      _count: { select: { salidas: true, apartados: true } },
    },
  })

  return successResponse(proyectos)
}

export async function POST(req: Request) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol !== Rol.ADMIN) return errorResponse('No permission', 'FORBIDDEN', 403)

  const body = await req.json()
  const parsed = ProyectoSchema.safeParse(body)
  if (!parsed.success) return errorResponse(parsed.error.issues[0].message, 'VALIDATION_ERROR')

  const proyecto = await prisma.proyecto.create({ data: parsed.data as any })
  return successResponse(proyecto, 201)
}

