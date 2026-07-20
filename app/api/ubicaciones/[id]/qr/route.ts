import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/apiHelpers'
import { errorResponse } from '@/lib/utils'
import QRCode from 'qrcode'
import { uploadImage } from '@/lib/cloudinary'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error, rol } = await requireAuth()
  if (error) return error
  if (rol === 'USUARIO') return errorResponse('No permission', 'FORBIDDEN', 403)

  const ubicacion = await prisma.ubicacion.findUnique({ where: { id: params.id } })
  if (!ubicacion) return errorResponse('Location not found', 'NOT_FOUND', 404)

  if (ubicacion.qrCode) {
    return Response.json({ qrUrl: ubicacion.qrCode })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const qrData = `${appUrl}/almacen?ubicacion=${params.id}`

  const buffer = await QRCode.toBuffer(qrData, { type: 'png', width: 400, margin: 2 })

  let qrUrl: string
  try {
    qrUrl = await uploadImage(buffer, 'inventapro/qr')
  } catch {
    const base64 = await QRCode.toDataURL(qrData)
    qrUrl = base64
  }

  await prisma.ubicacion.update({ where: { id: params.id }, data: { qrCode: qrUrl } })

  return Response.json({ qrUrl })
}
