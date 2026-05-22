import { PrismaClient, Rol } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash('Admin2024!', 12)

  await prisma.usuario.upsert({
    where: { email: 'admin@inventapro.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@inventapro.com',
      passwordHash,
      rol: Rol.ADMIN,
    },
  })

  for (const nombre of ['A1', 'A2', 'B1']) {
    await prisma.ubicacion.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    })
  }

  for (const nombre of ['Proyecto Demo 1', 'Proyecto Demo 2']) {
    await prisma.proyecto.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    })
  }

  console.log('Seed completado.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
