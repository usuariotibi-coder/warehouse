import { prisma } from './prisma'
import { TipoNotificacion, Rol } from '@prisma/client'
import { enviarEmailEntradaSinPrecio, enviarEmailApartadoVencimiento } from './resend'
import { enviarMensajeTelegram } from './telegram'

interface NotifOptions {
  usuarioId: string
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  metadata?: Record<string, string>
  canales?: { inApp?: boolean; email?: boolean; telegram?: boolean }
}

export async function enviarNotificacion({
  usuarioId,
  tipo,
  titulo,
  mensaje,
  metadata,
  canales = { inApp: true, email: false, telegram: false },
}: NotifOptions) {
  if (canales.inApp !== false) {
    await prisma.notificacion.create({
      data: { usuarioId, tipo, titulo, mensaje, metadata },
    })
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
  if (!usuario) return

  if (canales.email && usuario.email) {
    if (tipo === 'ENTRADA_SIN_PRECIO' && metadata?.entradaId) {
      await enviarEmailEntradaSinPrecio(usuario.email, metadata.entradaId).catch(console.error)
    } else if (tipo === 'APARTADO_VENCIMIENTO' && metadata?.fechaExpira) {
      await enviarEmailApartadoVencimiento(
        usuario.email,
        metadata.apartadoId ?? '',
        new Date(metadata.fechaExpira)
      ).catch(console.error)
    }
  }

  if (canales.telegram && usuario.telegramChatId) {
    await enviarMensajeTelegram(usuario.telegramChatId, `<b>${titulo}</b>\n${mensaje}`)
  }
}

export async function notificarAdminsEntradaSinPrecio(entradaId: string) {
  const admins = await prisma.usuario.findMany({
    where: { rol: Rol.ADMIN, activo: true },
  })

  for (const admin of admins) {
    await enviarNotificacion({
      usuarioId: admin.id,
      tipo: 'ENTRADA_SIN_PRECIO',
      titulo: 'New entry without assigned price',
      mensaje: 'An entry has been registered that requires price assignment.',
      metadata: { entradaId },
      canales: { inApp: true, email: true, telegram: true },
    })
  }
}
