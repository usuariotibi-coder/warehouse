import { Resend } from 'resend'

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'inventario@inventapro.com'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

export async function enviarEmailEntradaSinPrecio(to: string, entradaId: string) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '[InventaPro] New entry requires price assignment',
    html: `
      <div style="font-family:sans-serif;background:#0A0C0F;color:#E8EAED;padding:32px">
        <h1 style="color:#00D4FF">InventaPro</h1>
        <p>A new warehouse entry has been registered that requires price assignment.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/entradas/${entradaId}"
           style="display:inline-block;background:#00D4FF;color:#0A0C0F;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Assign price →
        </a>
      </div>
    `,
  })
}

export async function enviarEmailApartadoVencimiento(to: string, apartadoId: string, fechaExpira: Date) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '[InventaPro] Your reserve is about to expire',
    html: `
      <div style="font-family:sans-serif;background:#0A0C0F;color:#E8EAED;padding:32px">
        <h1 style="color:#00D4FF">InventaPro</h1>
        <p>Tu apartado vence el <strong>${fechaExpira.toLocaleDateString('es-MX')}</strong>.</p>
        <p>Process the exit before expiration to avoid losing the reserve.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/apartados"
           style="display:inline-block;background:#FFB300;color:#0A0C0F;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          View reserve →
        </a>
      </div>
    `,
  })
}

export async function enviarEmailBienvenida(to: string, nombre: string, password: string) {
  const resend = getResend()
  if (!resend) return
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '[InventaPro] Welcome — your access credentials',
    html: `
      <div style="font-family:sans-serif;background:#0A0C0F;color:#E8EAED;padding:32px">
        <h1 style="color:#00D4FF">InventaPro</h1>
        <p>Hola <strong>${nombre}</strong>, tu cuenta ha sido creada.</p>
        <p>Email: <code>${to}</code></p>
        <p>Temporary password: <code>${password}</code></p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
           style="display:inline-block;background:#00D4FF;color:#0A0C0F;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
          Sign in →
        </a>
      </div>
    `,
  })
}
