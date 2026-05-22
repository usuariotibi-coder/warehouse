import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const rol = token.rol as string

    const adminOnly = ['/dashboard', '/usuarios', '/reportes']
    const almacenistaPlus = ['/entradas', '/salidas', '/ubicaciones']

    if (adminOnly.some((r) => pathname.startsWith(r)) && rol !== 'ADMIN') {
      return NextResponse.redirect(new URL('/almacen', req.url))
    }

    if (
      almacenistaPlus.some((r) => pathname.startsWith(r)) &&
      rol === 'USUARIO'
    ) {
      return NextResponse.redirect(new URL('/almacen', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/almacen/:path*',
    '/entradas/:path*',
    '/salidas/:path*',
    '/apartados/:path*',
    '/articulos/:path*',
    '/ubicaciones/:path*',
    '/proyectos/:path*',
    '/reportes/:path*',
    '/usuarios/:path*',
    '/perfil/:path*',
  ],
}
