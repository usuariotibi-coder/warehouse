import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { Rol } from '@prisma/client'
import { errorResponse } from './utils'

type NextRequest = Request

export async function requireAuth(minRol?: Rol) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { session: null, error: errorResponse('Not authenticated', 'UNAUTHORIZED', 401) }
  }

  const userRol = (session.user as any).rol as Rol
  const rolOrder: Rol[] = [Rol.USUARIO, Rol.ALMACENISTA, Rol.ADMIN]

  if (minRol && rolOrder.indexOf(userRol) < rolOrder.indexOf(minRol)) {
    return { session: null, error: errorResponse('Insufficient permissions', 'FORBIDDEN', 403) }
  }

  return { session, userId: (session.user as any).id as string, rol: userRol, error: null }
}

export function getPaginationParams(url: string) {
  const { searchParams } = new URL(url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
