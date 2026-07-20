import TelegramBot from 'node-telegram-bot-api'
import { prisma } from './prisma'

let bot: TelegramBot | null = null

function getBot(): TelegramBot | null {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null
  if (!bot) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
  }
  return bot
}

export async function enviarMensajeTelegram(chatId: string, mensaje: string) {
  const b = getBot()
  if (!b) return
  try {
    await b.sendMessage(chatId, mensaje, { parse_mode: 'HTML' })
  } catch (e) {
    console.error('Telegram error:', e)
  }
}

export async function procesarComandoTelegram(msg: TelegramBot.Message) {
  const b = getBot()
  if (!b) return

  const chatId = msg.chat.id.toString()
  const text = msg.text ?? ''

  if (text.startsWith('/vincular ')) {
    const token = text.replace('/vincular ', '').trim()

    const registro = await prisma.auditLog.findFirst({
      where: {
        accion: 'TELEGRAM_TOKEN',
        detalle: { path: ['token'], equals: token },
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!registro?.usuarioId) {
      await b.sendMessage(chatId, '❌ Invalid or expired token.')
      return
    }

    const usuario = await prisma.usuario.update({
      where: { id: registro.usuarioId },
      data: {
        telegramChatId: chatId,
        telegramUsername: msg.from?.username,
      },
    })

    await b.sendMessage(chatId, `✅ Account successfully linked to <b>${usuario.nombre}</b>.`, { parse_mode: 'HTML' })
  } else if (text === '/start') {
    await b.sendMessage(chatId, '👋 Welcome to <b>InventaPro Bot</b>.\n\nTo link your account, go to your profile in the app and follow the instructions.', { parse_mode: 'HTML' })
  }
}
