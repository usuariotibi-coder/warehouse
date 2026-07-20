export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { enviarNotificacion } from '@/lib/notifications'

export async function POST() {
  const vencidos = await prisma.apartado.findMany({
    where: { estado: 'ACTIVO', fechaExpira: { lt: new Date() } },
  })

  for (const apartado of vencidos) {
    await prisma.apartado.update({
      where: { id: apartado.id },
      data: { estado: 'VENCIDO' },
    })

    await enviarNotificacion({
      usuarioId: apartado.usuarioId,
      tipo: 'APARTADO_VENCIMIENTO',
      titulo: 'Your reserve has expired',
      mensaje: 'The reserved items are now available for other users.',
      metadata: { apartadoId: apartado.id },
      canales: { inApp: true, email: true, telegram: true },
    })
  }

  return Response.json({ procesados: vencidos.length })
}

